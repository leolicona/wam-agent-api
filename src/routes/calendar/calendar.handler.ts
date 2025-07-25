import { Context } from 'hono';
import { createGoogleCalendarService, CalendarEvent, GoogleCalendarResponse } from '../../core/calendar/googleCalendar.service';
import { createDatabase } from '../../core/database/connection';
import { findBusinessById } from '../../core/database/business.service';
import { createCalendarService as registerCalendarService } from '../../core/database/calendarServices.service';

import { CreateEventSchema, parseEventDates, GetCalendarSchema, CreateCalendarSchema, GetFreeBusySchema, ListEventsSchema, GetEventSchema, UpdateEventSchema, DeleteEventSchema } from './calendar.schema';
import { z } from 'zod';
import type { Env } from '../../bindings';

export const getCalendar = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { calendarId } = c.req.valid('query') as z.infer<typeof GetCalendarSchema>;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId,
    });

    const calendar = await googleCalendarService.getCalendar(calendarId);
    return c.json(calendar);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const createCalendarEvent = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const validatedData = c.req.valid('json') as z.infer<typeof CreateEventSchema>;
    const eventData = parseEventDates(validatedData);
    const { calendarId, ...eventDetails } = eventData;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId,
    });

    const newEvent = await googleCalendarService.createEvent(eventDetails);
    return c.json(newEvent);
    
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const createCalendar = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, DB } = c.env;
  const db = createDatabase(c.env);

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { businessId, ...calendarData } = c.req.valid('json') as z.infer<typeof CreateCalendarSchema>;

    // 1. Validate businessId
    const business = await findBusinessById(db, businessId);
    if (!business) {
      return c.json({ message: 'Business not found' }, 404);
    }

    // 2. Create Google Calendar
    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId: '', // Not needed for creation
    });

    const newCalendar = await googleCalendarService.createCalendar(calendarData);

    if (!newCalendar.id) {
      return c.json({ message: 'Failed to create Google Calendar' }, 500);
    }

    // 3. Register calendar in the database
    const registeredCalendar = await registerCalendarService(db, {
      businessId: businessId,
      googleCalendarId: newCalendar.id,
      name: newCalendar.summary || 'Unnamed Calendar',
      description: newCalendar.description,
      settings: {}, // Add any default settings if necessary
    });

    return c.json(registeredCalendar, 201);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const getFreeBusy = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { timeMin, timeMax, calendarIds } = c.req.valid('query') as z.infer<typeof GetFreeBusySchema>;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId: '', // Not needed for free/busy query
    });

    const freeBusyResponse = await googleCalendarService.getFreeBusy(timeMin, timeMax, calendarIds);
    return c.json(freeBusyResponse);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const listEvents = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { timeMin, timeMax, maxResults, calendarId } = c.req.valid('query') as z.infer<typeof ListEventsSchema>;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId,
    });

    const events = await googleCalendarService.listEvents({ timeMin, timeMax, maxResults });
    return c.json(events);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const getEvent = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { calendarId, eventId } = c.req.valid('param') as z.infer<typeof GetEventSchema>;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId,
    });

    const event = await googleCalendarService.getEvent(eventId);
    return c.json(event);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const updateEvent = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { calendarId, eventId } = c.req.valid('param') as z.infer<typeof GetEventSchema>; // Re-using GetEventSchema for params
    const updates = c.req.valid('json') as z.infer<typeof UpdateEventSchema>;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId,
    });

    const updatedEvent = await googleCalendarService.updateEvent(eventId, updates);
    return c.json(updatedEvent);
  } catch (error: any) {
    return c.json({ message: error.message }, 500);
  }
};

export const deleteEvent = async (c: Context<{ Bindings: Env }>) => {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY } = c.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    return c.json({ message: 'Missing Google Calendar service account credentials' }, 500);
  }

  try {
    const { calendarId, eventId } = c.req.valid('param') as z.infer<typeof DeleteEventSchema>;

    const googleCalendarService = createGoogleCalendarService({
      serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
      calendarId,
    });

    await googleCalendarService.deleteEvent(eventId);
    return c.json({ message: 'Event deleted successfully' }, 204);
  } catch (error: any) {
    // Check if the error is due to the resource already being deleted (410 Gone)
    if (error.message && error.message.includes('410') && error.message.includes('Resource has been deleted')) {
      return c.json({ message: 'Event already deleted' }, 200); // Or 204 No Content
    }
    return c.json({ message: error.message }, 500);
  }
};
