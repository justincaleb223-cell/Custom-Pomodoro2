import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionsAPI } from '@/services/api';

const QUEUE_KEY = 'pendingSessions';

export interface PendingSession {
  id: string; // unique ID for this pending session
  taskId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number;
  completed: boolean;
  retryCount: number;
  createdAt: string; // when it was queued
}

/**
 * Save a session to the offline queue for retry later
 */
export async function queueSession(
  taskId: string,
  startTime: Date,
  endTime: Date,
  duration: number,
  completed: boolean
): Promise<void> {
  try {
    const pending: PendingSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      completed,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const existing = await getQueuedSessions();
    existing.push(pending);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));
    console.log('[SessionQueue] Queued session:', pending.id);
  } catch (error) {
    console.error('[SessionQueue] Error queueing session:', error);
  }
}

/**
 * Get all queued sessions
 */
export async function getQueuedSessions(): Promise<PendingSession[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[SessionQueue] Error getting queued sessions:', error);
    return [];
  }
}

/**
 * Remove a session from the queue (after successful save)
 */
export async function removeQueuedSession(sessionId: string): Promise<void> {
  try {
    const sessions = await getQueuedSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    console.log('[SessionQueue] Removed session from queue:', sessionId);
  } catch (error) {
    console.error('[SessionQueue] Error removing queued session:', error);
  }
}

/**
 * Retry saving all queued sessions (with exponential backoff)
 */
export async function retryQueuedSessions(): Promise<number> {
  const sessions = await getQueuedSessions();
  if (sessions.length === 0) return 0;

  console.log(`[SessionQueue] Retrying ${sessions.length} queued sessions...`);

  let successCount = 0;
  const maxRetries = 5;

  for (const session of sessions) {
    // Skip if already retried too many times
    if (session.retryCount >= maxRetries) {
      console.log(`[SessionQueue] Skipping session ${session.id} (max retries reached)`);
      continue;
    }

    try {
      await sessionsAPI.createSession(
        session.taskId,
        new Date(session.startTime),
        new Date(session.endTime),
        session.duration,
        session.completed
      );

      // Success! Remove from queue
      await removeQueuedSession(session.id);
      successCount++;
      console.log(`[SessionQueue] Successfully saved session: ${session.id}`);
    } catch (error) {
      // Failed again - increment retry count
      const updated = {
        ...session,
        retryCount: session.retryCount + 1,
      };
      const allSessions = await getQueuedSessions();
      const index = allSessions.findIndex((s) => s.id === session.id);
      if (index !== -1) {
        allSessions[index] = updated;
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(allSessions));
      }
      console.log(`[SessionQueue] Failed to save session ${session.id}, retry count: ${updated.retryCount}`);
    }

    // Small delay between retries to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return successCount;
}

/**
 * Try to save a session immediately, queue it if it fails
 */
export async function saveSessionWithRetry(
  taskId: string,
  startTime: Date,
  endTime: Date,
  duration: number,
  completed: boolean
): Promise<{ success: boolean; queued: boolean }> {
  try {
    // Try immediate save first
    await sessionsAPI.createSession(taskId, startTime, endTime, duration, completed);
    console.log('[SessionQueue] Session saved immediately');
    return { success: true, queued: false };
  } catch (error) {
    console.log('[SessionQueue] Immediate save failed, queueing for retry:', error);
    // Queue for retry
    await queueSession(taskId, startTime, endTime, duration, completed);
    return { success: false, queued: true };
  }
}
