
export interface Task {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  completed: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface TimerSettings {
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
}

export interface DailyStats {
  date: string;
  completedPomodoros: number;
  totalFocusTime: number; // in seconds
}

export interface TaskStats {
  taskId: string;
  taskName: string;
  completedPomodoros: number;
  totalFocusTime: number; // in seconds
}
