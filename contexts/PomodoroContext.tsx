
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Task, TimerSettings } from '@/types';
import { settingsAPI, sessionsAPI } from '@/services/api';

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
          
          if (newTimeRemaining > 0) {
            setTimerStatus('running');
            startTimeRef.current = startTime;
          } else {
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
      setTimerStatus('running');
      startTimeRef.current = new Date();
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
        // Capture values at the moment of completion (state can change during async work).
        const taskAtCompletion = selectedTaskRef.current;
        const startAtCompletion = startTimeRef.current;
        const endTime = new Date();

        // Save completed focus session to backend (this drives Statistics)
        if (!taskAtCompletion) {
          Alert.alert(
            'Session not saved',
            'No task was selected for this focus session, so it cannot be saved. Please select a task before starting.'
          );
        } else if (!startAtCompletion) {
          Alert.alert(
            'Session not saved',
            'Could not determine session start time, so it cannot be saved. Please try again.'
          );
        } else {
          try {
            await sessionsAPI.createSession(
              taskAtCompletion.id,
              startAtCompletion,
              endTime,
              totalTime,
              true
            );
          } catch (error) {
            console.error('Error saving session:', error);
            Alert.alert(
              'Session not saved',
              'Your focus session could not be saved to the backend, so stats will not update. Please check your connection and backend.'
            );
          }
        }

        // Clear the selected task so each focus session requires an explicit choice
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
