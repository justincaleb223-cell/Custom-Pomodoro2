
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { tasksAPI } from '@/services/api';
import type { Task } from '@/types';

export default function TimerScreen() {
  const {
    selectedTask,
    setSelectedTask,
    timerMode,
    timerStatus,
    timeRemaining,
    totalTime,
    sessionsCompleted,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipBreak,
  } = usePomodoro();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const [taskPickerVisible, setTaskPickerVisible] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;

  const getModeColor = () => {
    if (timerMode === 'focus') return theme.primary;
    if (timerMode === 'break') return theme.secondary;
    return theme.accent;
  };

  const getModeText = () => {
    if (timerMode === 'focus') return 'Focus Time';
    if (timerMode === 'break') return 'Short Break';
    return 'Long Break';
  };

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const data = await tasksAPI.getTasks();
      setTasks(data);
    } catch (error: any) {
      console.error('Error loading tasks for picker:', error);
      Alert.alert(
        'Could not load tasks',
        error?.message || 'Please make sure you are logged in and the backend is running.'
      );
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const openTaskPicker = useCallback(async () => {
    setTaskPickerVisible(true);
    await loadTasks();
  }, [loadTasks]);

  const onPressStart = useCallback(async () => {
    // Focus mode requires a task; if none selected, prompt user to choose.
    if (timerMode === 'focus' && !selectedTask) {
      await openTaskPicker();
      return;
    }
    startTimer();
  }, [openTaskPicker, selectedTask, startTimer, timerMode]);

  const onSelectTaskAndStart = useCallback(
    (task: Task) => {
      setSelectedTask(task);
      setTaskPickerVisible(false);
      startTimer();
    },
    [setSelectedTask, startTimer]
  );

  const taskPickerTitle = useMemo(() => {
    if (timerMode === 'focus') return 'Select a task to focus on';
    return 'Select a task';
  }, [timerMode]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Pomodoro Timer</Text>
        <View style={styles.sessionBadge}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check_circle"
            size={20}
            color={theme.primary}
          />
          <Text style={[styles.sessionText, { color: theme.text }]}>
            {sessionsCompleted} sessions
          </Text>
        </View>
      </View>

      <View style={[styles.timerCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.modeText, { color: getModeColor() }]}>
          {getModeText()}
        </Text>

        {selectedTask && (
          <View style={styles.taskInfo}>
            <Text style={[styles.taskName, { color: theme.text }]}>
              {selectedTask.name}
            </Text>
            {selectedTask.description && (
              <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                {selectedTask.description}
              </Text>
            )}
          </View>
        )}

        <View style={styles.timerContainer}>
          <View style={[styles.progressRing, { borderColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  borderColor: getModeColor(),
                  borderWidth: 8,
                  transform: [{ rotate: `${progress * 360}deg` }],
                },
              ]}
            />
            <View style={styles.timerInner}>
              <Text style={[styles.timerText, { color: theme.text }]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {timerStatus === 'idle' && (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: getModeColor() }]}
                onPress={onPressStart}
              >
                <IconSymbol
                  ios_icon_name="play.fill"
                  android_material_icon_name="play_arrow"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.buttonText}>Start</Text>
              </TouchableOpacity>

              {timerMode !== 'focus' && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                  onPress={skipBreak}
                >
                  <IconSymbol
                    ios_icon_name="forward.end"
                    android_material_icon_name="skip_next"
                    size={24}
                    color={theme.text}
                  />
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Skip Break
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {timerStatus === 'running' && (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                onPress={pauseTimer}
              >
                <IconSymbol
                  ios_icon_name="pause.fill"
                  android_material_icon_name="pause"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.buttonText}>Pause</Text>
              </TouchableOpacity>

              {timerMode !== 'focus' && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                  onPress={skipBreak}
                >
                  <IconSymbol
                    ios_icon_name="forward.end"
                    android_material_icon_name="skip_next"
                    size={24}
                    color={theme.text}
                  />
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Skip Break
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {timerStatus === 'paused' && (
            <>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: getModeColor() }]}
                onPress={resumeTimer}
              >
                <IconSymbol
                  ios_icon_name="play.fill"
                  android_material_icon_name="play_arrow"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.buttonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.border }]}
                onPress={resetTimer}
              >
                <IconSymbol
                  ios_icon_name="arrow.clockwise"
                  android_material_icon_name="refresh"
                  size={24}
                  color={theme.text}
                />
                <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                  Reset
                </Text>
              </TouchableOpacity>

              {timerMode !== 'focus' && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                  onPress={skipBreak}
                >
                  <IconSymbol
                    ios_icon_name="forward.end"
                    android_material_icon_name="skip_next"
                    size={24}
                    color={theme.text}
                  />
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                    Skip Break
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {!selectedTask && timerMode === 'focus' && (
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            Tap Start to choose a task
          </Text>
        )}
      </View>

      <Modal
        visible={taskPickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{taskPickerTitle}</Text>

            {tasksLoading ? (
              <Text style={[styles.modalHint, { color: theme.textSecondary }]}>
                Loading tasks...
              </Text>
            ) : tasks.length === 0 ? (
              <>
                <Text style={[styles.modalHint, { color: theme.textSecondary }]}>
                  No tasks found. Create one first.
                </Text>
                <TouchableOpacity
                  style={[styles.modalPrimaryButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setTaskPickerVisible(false);
                    router.push('/(tabs)/tasks');
                  }}
                >
                  <IconSymbol
                    ios_icon_name="list.bullet"
                    android_material_icon_name="list"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.modalPrimaryButtonText}>Go to Tasks</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.taskOption,
                      {
                        backgroundColor: theme.background,
                        borderColor: selectedTask?.id === task.id ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => onSelectTaskAndStart(task)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.taskOptionText}>
                      <Text style={[styles.taskOptionTitle, { color: theme.text }]}>
                        {task.name}
                      </Text>
                      {!!task.description && (
                        <Text style={[styles.taskOptionSubtitle, { color: theme.textSecondary }]}>
                          {task.description}
                        </Text>
                      )}
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={22}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => setTaskPickerVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              {!tasksLoading && tasks.length > 0 && (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.primary }]}
                  onPress={loadTasks}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timerCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  modeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  timerContainer: {
    marginVertical: 32,
  },
  progressRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  timerInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    fontFamily: 'SpaceMono',
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  modalList: {
    flexGrow: 0,
  },
  modalListContent: {
    paddingBottom: 8,
  },
  taskOption: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskOptionText: {
    flex: 1,
    paddingRight: 12,
  },
  taskOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskOptionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
