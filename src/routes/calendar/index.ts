import { Hono } from 'hono';
import { zodValidator } from '../../middleware/zod.validator';
import { CreateEventSchema, GetCalendarSchema, CreateCalendarSchema, GetFreeBusySchema, ListEventsSchema, GetEventSchema, UpdateEventSchema, DeleteEventSchema } from './calendar.schema';
import { createCalendarEvent, getCalendar, createCalendar, getFreeBusy, listEvents, getEvent, updateEvent, deleteEvent } from './calendar.handler';
import type { Env } from '../../bindings';

const calendar = new Hono<{ Bindings: Env }>();

calendar.get('/', zodValidator('query', GetCalendarSchema), getCalendar);
calendar.post('/events', zodValidator('json', CreateEventSchema), createCalendarEvent);
calendar.post('/calendars', zodValidator('json', CreateCalendarSchema), createCalendar);
calendar.get('/free-busy', zodValidator('query', GetFreeBusySchema), getFreeBusy);

calendar.get('/events', zodValidator('query', ListEventsSchema), listEvents);
calendar.get('/events/:calendarId/:eventId', zodValidator('param', GetEventSchema), getEvent);
calendar.put('/events/:calendarId/:eventId', zodValidator('param', GetEventSchema), zodValidator('json', UpdateEventSchema), updateEvent);
calendar.delete('/events/:calendarId/:eventId', zodValidator('param', DeleteEventSchema), deleteEvent);

export default calendar;
