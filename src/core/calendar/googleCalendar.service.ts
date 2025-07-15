import { sign } from 'hono/jwt';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: Array<{ email: string }>;
  location?: string;
}

export interface GoogleCalendarConfig {
  serviceAccountEmail: string;
  privateKey: string;
  calendarId: string;
}

export interface ListEventsOptions {
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
}

export interface CreateCalendarOptions {
  summary: string;
  description?: string;
  timeZone?: string;
  location?: string;
}

export interface GoogleCalendarService {
  listEvents: (options?: ListEventsOptions) => Promise<GoogleCalendarEvent[]>;
  createEvent: (event: CalendarEvent) => Promise<GoogleCalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<GoogleCalendarEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEvent: (eventId: string) => Promise<GoogleCalendarEvent>;
  checkTimeConflicts: (start: Date, end: Date) => Promise<GoogleCalendarEvent[]>;
  getFreeBusy: (timeMin: Date, timeMax: Date, calendars?: string[]) => Promise<FreeBusyResponse>;
  createCalendar: (options: CreateCalendarOptions) => Promise<GoogleCalendarResponse>;
  getCalendar: (calendarId: string) => Promise<GoogleCalendarResponse>;
}

// Google Calendar API response types
export interface GoogleCalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  status?: string;
  htmlLink?: string;
}

export interface FreeBusyResponse {
  calendars?: {
    [calendarId: string]: {
      busy?: Array<{
        start: string;
        end: string;
      }>;
      errors?: Array<{
        domain: string;
        reason: string;
      }>;
    };
  };
}

export interface GoogleCalendarResponse {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  timeZone?: string;
  accessRole?: string;
  defaultReminders?: Array<{
    method: string;
    minutes: number;
  }>;
  etag?: string;
  kind?: string;
}

/**
 * Create JWT token for Google service account authentication
 */
const createServiceAccountJWT = async (
  serviceAccountEmail: string,
  privateKey: string
): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  // Clean the private key
  const cleanPrivateKey = privateKey
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const formattedPrivateKey = `-----BEGIN PRIVATE KEY-----\n${cleanPrivateKey}\n-----END PRIVATE KEY-----`;

  return await sign(payload, formattedPrivateKey, 'RS256');
};

/**
 * Exchange JWT for access token
 */
const getAccessToken = async (jwt: string): Promise<string> => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
};

/**
 * Make authenticated request to Google Calendar API
 */
const makeCalendarRequest = async (
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = `https://www.googleapis.com/calendar/v3${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendar API request failed: ${response.status} ${error}`);
  }

  return response;
};

/**
 * Convert CalendarEvent to Google Calendar event format
 * Note: Excludes attendees as service accounts cannot invite attendees without Domain-Wide Delegation
 */
const toGoogleCalendarEvent = (event: CalendarEvent): Partial<GoogleCalendarEvent> => ({
  summary: event.summary,
  description: event.description,
  location: event.location,
  start: {
    dateTime: event.start.toISOString(),
    timeZone: 'America/New_York',
  },
  end: {
    dateTime: event.end.toISOString(),
    timeZone: 'America/New_York',
  },
  // Attendees excluded: Service accounts cannot invite attendees without Domain-Wide Delegation
  // attendees: event.attendees,
});

/**
 * Convert partial CalendarEvent updates to Google Calendar event format
 * Note: Excludes attendees as service accounts cannot invite attendees without Domain-Wide Delegation
 */
const toGoogleCalendarEventUpdate = (updates: Partial<CalendarEvent>): Partial<GoogleCalendarEvent> => {
  const event: Partial<GoogleCalendarEvent> = {};
  
  if (updates.summary) event.summary = updates.summary;
  if (updates.description) event.description = updates.description;
  if (updates.location) event.location = updates.location;
  if (updates.start) {
    event.start = {
      dateTime: updates.start.toISOString(),
      timeZone: 'America/New_York',
    };
  }
  if (updates.end) {
    event.end = {
      dateTime: updates.end.toISOString(),
      timeZone: 'America/New_York',
    };
  }
  // Attendees excluded: Service accounts cannot invite attendees without Domain-Wide Delegation
  // if (updates.attendees) event.attendees = updates.attendees;
  
  return event;
};

/**
 * Check if two time periods overlap
 */
const hasTimeOverlap = (event: GoogleCalendarEvent, start: Date, end: Date): boolean => {
  if (!event.start?.dateTime || !event.end?.dateTime) return false;
  
  const eventStart = new Date(event.start.dateTime);
  const eventEnd = new Date(event.end.dateTime);
  
  return eventStart < end && eventEnd > start;
};

/**
 * Error handling wrapper
 */
const withErrorHandling = <T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) => async (...args: T): Promise<R> => {
  try {
    return await fn(...args);
  } catch (error) {
    console.error(`Error ${operation}:`, error);
    throw error;
  }
};

/**
 * Factory function for creating calendar service
 */
export const createGoogleCalendarService = (config: GoogleCalendarConfig): GoogleCalendarService => {
  const { serviceAccountEmail, privateKey, calendarId } = config;

  /**
   * Get authenticated access token
   */
  const getAuthenticatedToken = async (): Promise<string> => {
    const jwt = await createServiceAccountJWT(serviceAccountEmail, privateKey);
    return await getAccessToken(jwt);
  };

  /**
   * List events from the calendar
   */
  const listEvents = withErrorHandling(
    'listing events',
    async (options?: ListEventsOptions): Promise<GoogleCalendarEvent[]> => {
      const accessToken = await getAuthenticatedToken();
      
      const params = new URLSearchParams({
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: (options?.maxResults || 10).toString(),
      });
      
      if (options?.timeMin) {
        params.append('timeMin', options.timeMin.toISOString());
      }
      if (options?.timeMax) {
        params.append('timeMax', options.timeMax.toISOString());
      }

      const response = await makeCalendarRequest(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events?${params}`
      );

      const data = await response.json() as { items?: GoogleCalendarEvent[] };
      return data.items || [];
    }
  );

  /**
   * Create a new calendar event
   */
  const createEvent = withErrorHandling(
    'creating event',
    async (event: CalendarEvent): Promise<GoogleCalendarEvent> => {
      const accessToken = await getAuthenticatedToken();
      
      const response = await makeCalendarRequest(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          body: JSON.stringify(toGoogleCalendarEvent(event)),
        }
      );

      const createdEvent = await response.json() as GoogleCalendarEvent;
      console.log('Event created:', createdEvent);
      return createdEvent;
    }
  );

  /**
   * Update an existing event
   */
  const updateEvent = withErrorHandling(
    'updating event',
    async (eventId: string, updates: Partial<CalendarEvent>): Promise<GoogleCalendarEvent> => {
      const accessToken = await getAuthenticatedToken();
      
      const response = await makeCalendarRequest(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(toGoogleCalendarEventUpdate(updates)),
        }
      );

      return await response.json() as GoogleCalendarEvent;
    }
  );

  /**
   * Delete an event
   */
  const deleteEvent = withErrorHandling(
    'deleting event',
    async (eventId: string): Promise<void> => {
      const accessToken = await getAuthenticatedToken();
      
      const response = await makeCalendarRequest(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
        }
      );
      
      // Check if the response indicates successful deletion
      if (response.status !== 204) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }
      
      console.log('Event deleted successfully');
    }
  );

  /**
   * Get a single event by ID
   */
  const getEvent = withErrorHandling(
    'getting event',
    async (eventId: string): Promise<GoogleCalendarEvent> => {
      const accessToken = await getAuthenticatedToken();
      
      const response = await makeCalendarRequest(
        accessToken,
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`
      );

      return await response.json() as GoogleCalendarEvent;
    }
  );

  /**
   * Check for time conflicts
   */
  const checkTimeConflicts = withErrorHandling(
    'checking conflicts',
    async (start: Date, end: Date): Promise<GoogleCalendarEvent[]> => {
      const events = await listEvents({
        timeMin: start,
        timeMax: end,
      });
      
      return events.filter(event => hasTimeOverlap(event, start, end));
    }
  );

  /**
   * Get free/busy information
   */
  const getFreeBusy = withErrorHandling(
    'getting free/busy',
    async (
      timeMin: Date,
      timeMax: Date,
      calendars?: string[]
    ): Promise<FreeBusyResponse> => {
      const accessToken = await getAuthenticatedToken();
      
      const items = calendars?.map(cal => ({ id: cal })) || [];

      if (items.length === 0) {
        return { calendars: {} };
      }

      const response = await makeCalendarRequest(
        accessToken,
        '/freeBusy',
        {
          method: 'POST',
          body: JSON.stringify({
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            items,
          }),
        }
      );

      return await response.json() as FreeBusyResponse;
    }
  );

  /**
   * Create a new calendar
   */
  const createCalendar = withErrorHandling(
    'creating calendar',
    async (options: CreateCalendarOptions): Promise<GoogleCalendarResponse> => {
      const accessToken = await getAuthenticatedToken();
      
      const calendarData = {
        summary: options.summary,
        description: options.description,
        timeZone: options.timeZone || 'America/New_York',
        location: options.location,
      };

      const response = await makeCalendarRequest(
        accessToken,
        '/calendars',
        {
          method: 'POST',
          body: JSON.stringify(calendarData),
        }
      );

      const createdCalendar = await response.json() as GoogleCalendarResponse;
      console.log('Calendar created:', createdCalendar);
      return createdCalendar;
    }
  );

  /**
   * Get a single calendar by ID
   */
  const getCalendar = withErrorHandling(
    'getting calendar',
    async (calendarIdToGet: string): Promise<GoogleCalendarResponse> => {
      const accessToken = await getAuthenticatedToken();
      
      const response = await makeCalendarRequest(
        accessToken,
        `/calendars/${encodeURIComponent(calendarIdToGet)}`
      );

      return await response.json() as GoogleCalendarResponse;
    }
  );

  return {
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    getEvent,
    checkTimeConflicts,
    getFreeBusy,
    createCalendar,
    getCalendar,
  };
};
