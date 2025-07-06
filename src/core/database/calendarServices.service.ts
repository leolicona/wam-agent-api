import type { Database } from './connection';
import { calendarServices } from './schema';
import { eq } from 'drizzle-orm';
import { generateId } from './id.generator';

export const createCalendarService = async (
  db: Database,
  data: Omit<typeof calendarServices.$inferInsert, 'id'>
): Promise<typeof calendarServices.$inferSelect> => {
  const id = generateId('cal'); // Assuming 'cal' is the prefix for calendar services
  const newCalendarService = {
    id,
    ...data,
  };
  const [result] = await db.insert(calendarServices).values(newCalendarService).returning();
  return result;
};

export const getCalendarServiceById = async (
  db: Database,
  id: string
): Promise<typeof calendarServices.$inferSelect | null> => {
  const result = await db
    .select()
    .from(calendarServices)
    .where(eq(calendarServices.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
};

export const getCalendarServiceByGoogleCalendarId = async (
  db: Database,
  googleCalendarId: string
): Promise<typeof calendarServices.$inferSelect | null> => {
  const result = await db
    .select()
    .from(calendarServices)
    .where(eq(calendarServices.googleCalendarId, googleCalendarId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
};
