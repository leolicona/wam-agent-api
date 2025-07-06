import { z } from 'zod';

export const CalendarSchema = z.object({
  id: z.string(),
  summary: z.string(),
});

export const GetCalendarSchema = z.object({
  calendarId: z.string().min(1, 'Calendar ID is required'),
});

// Single schema that validates string dates and works with zodValidator
export const CreateEventSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  start: z.string().datetime('Invalid start date format'),
  end: z.string().datetime('Invalid end date format'),
  attendees: z.array(z.object({ email: z.string().email('Invalid email format') })).optional(),
  location: z.string().optional(),
  calendarId: z.string().min(1, 'Calendar ID is required'),
});

// Helper function to convert validated data to Date objects
export const parseEventDates = (data: z.infer<typeof CreateEventSchema>) => ({
  ...data,
  start: new Date(data.start),
  end: new Date(data.end),
});

export const CreateCalendarSchema = z.object({
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  timeZone: z.string().optional(),
  location: z.string().optional(),
  businessId: z.string().min(1, 'Business ID is required'),
});

export const GetFreeBusySchema = z.object({
  timeMin: z.string().datetime('Invalid timeMin date format').transform((str) => new Date(str)),
  timeMax: z.string().datetime('Invalid timeMax date format').transform((str) => new Date(str)),
  calendarIds: z.array(z.string()).optional(),
});

export const ListEventsSchema = z.object({
  timeMin: z.string().datetime('Invalid timeMin date format').optional().transform((str) => str ? new Date(str) : undefined),
  timeMax: z.string().datetime('Invalid timeMax date format').optional().transform((str) => str ? new Date(str) : undefined),
  maxResults: z.string().optional().transform((str) => str ? parseInt(str, 10) : undefined),
  calendarId: z.string().min(1, 'Calendar ID is required'),
});

export const GetEventSchema = z.object({
  calendarId: z.string().min(1, 'Calendar ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
});

export const UpdateEventSchema = z.object({
  summary: z.string().min(1, 'Summary is required').optional(),
  description: z.string().optional(),
  start: z.string().datetime('Invalid start date format').optional().transform((str) => str ? new Date(str) : undefined),
  end: z.string().datetime('Invalid end date format').optional().transform((str) => str ? new Date(str) : undefined),
  attendees: z.array(z.object({ email: z.string().email('Invalid email format') })).optional(),
  location: z.string().optional(),
}).partial(); // Allow partial updates

export const DeleteEventSchema = z.object({
  calendarId: z.string().min(1, 'Calendar ID is required'),
  eventId: z.string().min(1, 'Event ID is required'),
});
