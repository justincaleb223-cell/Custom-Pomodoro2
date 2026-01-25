
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Task, TimerSettings } from '@/types';
import { settingsAPI } from '@/services/api';
import { saveSessionWithRetry, retryQueuedSessions } from '@/utils/sessionQueue';

type TimerMode = 'focus' | 'break' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface PomodoroContextType {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  timerMode: TimerMode;
  timerStatus: TimerStatus;
  timeRemaining: number;
  totalTime: number;
  sessionsCompleted: number;
  settings: TimerSettings;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  updateSettings: (settings: TimerSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [settings, setSettings] = useState<TimerSettings>({
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const backgroundTimeRef = useRef<Date | null>(null);
  const isCompletingRef = useRef(false);
  const selectedTaskRef = useRef<Task | null>(null);
  // Store session data at START time (survives backgrounding/app switching)
  const sessionDataRef = useRef<{
    taskId: string;
    taskName: string;
    startTime: Date;
    totalDuration: number;
    actualEndTime?: Date; // For cases where timer completed while app was closed
  } | null>(null);

  // Keep a ref of the latest selected task to avoid stale-closure issues
  // (the timer interval callback can capture older state).
  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadTimerState();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [timerStatus, timeRemaining]);

  // Retry queued sessions when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground - retry any queued sessions
        const retried = await retryQueuedSessions();
        if (retried > 0) {
          console.log(`[Pomodoro] Retried and saved ${retried} queued sessions`);
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' && timerStatus === 'running') {
      backgroundTimeRef.current = new Date();
      await saveTimerState();
    } else if (nextAppState === 'active' && timerStatus === 'running' && backgroundTimeRef.current) {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - backgroundTimeRef.current.getTime()) / 1000);
      const newTimeRemaining = Math.max(0, timeRemaining - elapsedSeconds);
      setTimeRemaining(newTimeRemaining);
      
      if (newTimeRemaining === 0) {
        handleTimerComplete();
      }
      
      backgroundTimeRef.current = null;
    }
  };

  const loadSettings = async () => {
    const loadedSettings = await settingsAPI.getSettings();
    setSettings(loadedSettings);
    setTimeRemaining(loadedSettings.focusDuration * 60);
    setTotalTime(loadedSettings.focusDuration * 60);
  };

  const saveTimerState = async () => {
    try {
      const state = {
        selectedTask,
        timerMode,
        timerStatus,
        timeRemaining,
        totalTime,
        sessionsCompleted,
        startTime: startTimeRef.current?.toISOString(),
        // CRITICAL: Save session data so it survives app kill/restart
        sessionData: sessionDataRef.current ? {
          taskId: sessionDataRef.current.taskId,
          taskName: sessionDataRef.current.taskName,
          startTime: sessionDataRef.current.startTime.toISOString(),
          totalDuration: sessionDataRef.current.totalDuration,
          actualEndTime: sessionDataRef.current.actualEndTime?.toISOString(),
        } : null,
      };
      await AsyncStorage.setItem('timerState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  };

  const loadTimerState = async () => {
    try {
      const stateStr = await AsyncStorage.getItem('timerState');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        if (state.timerStatus === 'running' && state.startTime) {
          const now = new Date();
          const startTime = new Date(state.startTime);
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          const newTimeRemaining = Math.max(0, state.timeRemaining - elapsedSeconds);
          
          setSelectedTask(state.selectedTask);
          setTimerMode(state.timerMode);
          setTimeRemaining(newTimeRemaining);
          setTotalTime(state.totalTime);
          setSessionsCompleted(state.sessionsCompleted);
          
          // CRITICAL: Restore session data if it exists (survives app kill/restart)
          if (state.sessionData) {
            sessionDataRef.current = {
              taskId: state.sessionData.taskId,
              taskName: state.sessionData.taskName,
              startTime: new Date(state.sessionData.startTime),
              totalDuration: state.sessionData.totalDuration,
              actualEndTime: state.sessionData.actualEndTime ? new Date(state.sessionData.actualEndTime) : undefined,
            };
            console.log('[Pomodoro] Restored session data from storage:', sessionDataRef.current);
          } else if (state.selectedTask && state.timerMode === 'focus') {
            // Fallback: Reconstruct session data from saved state if sessionData is missing
            // This handles cases where app was killed before sessionData was saved
            sessionDataRef.current = {
              taskId: state.selectedTask.id,
              taskName: state.selectedTask.name,
              startTime: startTime,
              totalDuration: state.totalTime,
            };
            console.log('[Pomodoro] Reconstructed session data from saved state:', sessionDataRef.current);
          }
          
          if (newTimeRemaining > 0) {
            setTimerStatus('running');
            startTimeRef.current = startTime;
          } else {
            // Timer completed while app was closed - ensure sessionData is available
            if (!sessionDataRef.current && state.selectedTask && state.timerMode === 'focus') {
              // Reconstruct from saved state - calculate when timer actually completed
              const actualEndTime = new Date(startTime.getTime() + (state.totalTime * 1000));
              sessionDataRef.current = {
                taskId: state.selectedTask.id,
                taskName: state.selectedTask.name,
                startTime: startTime,
                totalDuration: state.totalTime,
                // Store when it actually completed (for accurate session saving)
                actualEndTime: actualEndTime,
              };
              console.log('[Pomodoro] Reconstructed session data for completed timer:', sessionDataRef.current);
            }
            // Timer already completed - handle completion immediately
            handleTimerComplete();
          }
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  };

  const startTimer = () => {
    if (timerStatus === 'idle') {
      const task = selectedTaskRef.current;
      const startTime = new Date();
      
      // CRITICAL: Capture session data at START time (survives backgrounding)
      if (timerMode === 'focus' && task) {
        sessionDataRef.current = {
          taskId: task.id,
          taskName: task.name,
          startTime: startTime,
          totalDuration: totalTime,
        };
        console.log('[Pomodoro] Captured session data at start:', sessionDataRef.current);
        // Immediately save to AsyncStorage so it survives app kill
        saveTimerState();
      }
      
      setTimerStatus('running');
      startTimeRef.current = startTime;
      startInterval();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const pauseTimer = () => {
    if (timerStatus === 'running') {
      setTimerStatus('paused');
      stopInterval();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      saveTimerState();
    }
  };

  const resumeTimer = () => {
    if (timerStatus === 'paused') {
      setTimerStatus('running');
      startTimeRef.current = new Date();
      startInterval();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const resetTimer = () => {
    stopInterval();
    setTimerStatus('idle');
    // Always clear the selected task so the user must choose again for the next focus run
    setSelectedTask(null);
    sessionDataRef.current = null; // Clear session data on reset
    const duration = timerMode === 'focus' 
      ? settings.focusDuration 
      : timerMode === 'break' 
      ? settings.breakDuration 
      : settings.longBreakDuration;
    setTimeRemaining(duration * 60);
    setTotalTime(duration * 60);
    startTimeRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    saveTimerState();
  };

  const skipBreak = () => {
    // Only meaningful during break/longBreak; safe no-op otherwise
    if (timerMode === 'focus') return;
    stopInterval();
    setTimerMode('focus');
    setTimerStatus('idle');
    setTimeRemaining(settings.focusDuration * 60);
    setTotalTime(settings.focusDuration * 60);
    startTimeRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    saveTimerState();
  };

  const startInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleTimerComplete = async () => {
    // Guard: completion can be triggered multiple times (interval tick + app state resume).
    // We only want to process it once.
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    stopInterval();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      if (timerMode === 'focus') {
        // Use session data captured at START time (survives backgrounding/app switching)
        const sessionData = sessionDataRef.current;
        const endTime = new Date();

        if (!sessionData) {
          // Fallback: try to use current refs or saved state (for edge cases like app kill)
          const taskAtCompletion = selectedTaskRef.current || selectedTask;
          const startAtCompletion = startTimeRef.current;
          
          if (!taskAtCompletion || !startAtCompletion) {
            console.error('[Pomodoro] No session data available at completion');
            // Even without full data, try to queue what we can
            // Check if we have any task info in AsyncStorage
            try {
              const savedState = await AsyncStorage.getItem('timerState');
              if (savedState) {
                const state = JSON.parse(savedState);
                if (state.selectedTask && state.startTime) {
                  // Reconstruct from saved state
                  const result = await saveSessionWithRetry(
                    state.selectedTask.id,
                    new Date(state.startTime),
                    endTime,
                    state.totalTime || totalTime,
                    true
                  );
                  if (result.queued) {
                    Alert.alert(
                      'Session queued',
                      'Your session was saved locally and will be synced when the backend is available.'
                    );
                    return; // Exit early since we handled it
                  }
                }
              }
            } catch (err) {
              console.error('[Pomodoro] Error trying to recover session from storage:', err);
            }
            
            Alert.alert(
              'Session not saved',
              'Session data was lost. This can happen if the app was closed. The session will be queued for retry when possible.'
            );
          } else {
            // Use fallback data
            const result = await saveSessionWithRetry(
              taskAtCompletion.id,
              startAtCompletion,
              endTime,
              totalTime,
              true
            );
            if (!result.success && result.queued) {
              Alert.alert(
                'Session queued',
                'Your session was saved locally and will be synced when the backend is available.'
              );
            }
          }
        } else {
          // Use captured session data (reliable even after backgrounding)
          // If timer completed while app was closed, use actualEndTime instead of "now"
          const sessionEndTime = sessionData.actualEndTime || endTime;
          console.log('[Pomodoro] Saving session with captured data:', sessionData, 'endTime:', sessionEndTime);
          const result = await saveSessionWithRetry(
            sessionData.taskId,
            sessionData.startTime,
            sessionEndTime,
            sessionData.totalDuration,
            true
          );
          
          if (result.success) {
            console.log('[Pomodoro] Session saved successfully');
          } else if (result.queued) {
            console.log('[Pomodoro] Session queued for retry');
            Alert.alert(
              'Session queued',
              'Your session was saved locally and will be synced when the backend is available.'
            );
          }
        }

        // Clear session data and selected task
        sessionDataRef.current = null;
        setSelectedTask(null);

        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);

        // Determine next mode
        if (newSessionsCompleted % settings.sessionsUntilLongBreak === 0) {
          setTimerMode('longBreak');
          setTimeRemaining(settings.longBreakDuration * 60);
          setTotalTime(settings.longBreakDuration * 60);
        } else {
          setTimerMode('break');
          setTimeRemaining(settings.breakDuration * 60);
          setTotalTime(settings.breakDuration * 60);
        }
      } else {
        // Break completed, switch to focus
        setTimerMode('focus');
        setTimeRemaining(settings.focusDuration * 60);
        setTotalTime(settings.focusDuration * 60);
      }

      setTimerStatus('idle');
      startTimeRef.current = null;
      await saveTimerState();
    } finally {
      isCompletingRef.current = false;
    }
  };

  const updateSettings = async (newSettings: TimerSettings) => {
    setSettings(newSettings);
    await settingsAPI.saveSettings(newSettings);
    
    // Update timer if idle
    if (timerStatus === 'idle') {
      const duration = timerMode === 'focus' 
        ? newSettings.focusDuration 
        : timerMode === 'break' 
        ? newSettings.breakDuration 
        : newSettings.longBreakDuration;
      setTimeRemaining(duration * 60);
      setTotalTime(duration * 60);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        selectedTask,
        setSelectedTask,
        timerMode,
        timerStatus,
        timeRemaining,
        totalTime,
        sessionsCompleted,
        settings,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipBreak,
        updateSettings,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
