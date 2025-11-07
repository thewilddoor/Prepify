import Dexie, { type EntityTable } from 'dexie';
import type { Session } from '@/types';

// IndexedDB database for storing sessions
const db = new Dexie('AssignmentPrepAI') as Dexie & {
  sessions: EntityTable<Session, 'id'>;
};

// Schema definition
db.version(1).stores({
  sessions: 'id, timestamp, status, completedAt',
});

// Helper functions for session management
export const saveSession = async (session: Session): Promise<void> => {
  await db.sessions.put(session);
};

export const getSession = async (id: string): Promise<Session | undefined> => {
  return await db.sessions.get(id);
};

export const updateSession = async (
  id: string,
  updates: Partial<Session>
): Promise<void> => {
  await db.sessions.update(id, updates);
};

export const getAllSessions = async (): Promise<Session[]> => {
  return await db.sessions.orderBy('timestamp').reverse().toArray();
};

export const deleteSession = async (id: string): Promise<void> => {
  await db.sessions.delete(id);
};

// Clean up old sessions (>7 days)
export const cleanupOldSessions = async (): Promise<void> => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await db.sessions.where('timestamp').below(sevenDaysAgo).delete();
};

export { db };
