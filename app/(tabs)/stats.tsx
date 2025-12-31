
import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Dimensions,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { sessionsAPI } from '@/services/api';
import { DailyStats, PomodoroSession, TaskStats } from '@/types';
import { colors } from '@/styles/commonStyles';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskStats | null>(null);
  const [taskSessionsLoading, setTaskSessionsLoading] = useState(false);
  const [taskSessions, setTaskSessions] = useState<PomodoroSession[]>([]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  const loadStats = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [daily, tasks] = await Promise.all([
        sessionsAPI.getDailyStats(),
        sessionsAPI.getTaskStats(),
      ]);
      setDailyStats(daily);
      setTaskStats(tasks);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Surface the error so it's obvious why stats are empty
      Alert.alert(
        'Could not load statistics',
        (error as any)?.message ||
          'Please make sure you are logged in and the backend is running.'
      );
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reload whenever user navigates back to this tab (important for tabs: component may stay mounted)
  useFocusEffect(
    useCallback(() => {
      loadStats({ silent: true });
    }, [loadStats])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadStats({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadStats]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatHours = (seconds: number) => {
    const hours = seconds / 3600;
    // Keep it easy to scan: show 1 decimal when >= 1h, else show minutes
    if (hours >= 1) return `${hours.toFixed(1)}h`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const openTaskAnalytics = async (task: TaskStats) => {
    setSelectedTask(task);
    setTaskModalVisible(true);
    setTaskSessions([]);
    setTaskSessionsLoading(true);
    try {
      const sessions = await sessionsAPI.getSessionsByTask(task.taskId);
      setTaskSessions(sessions);
    } catch (error) {
      console.error('Error loading task sessions:', error);
      setTaskSessions([]);
    } finally {
      setTaskSessionsLoading(false);
    }
  };

  const closeTaskAnalytics = () => {
    setTaskModalVisible(false);
    setSelectedTask(null);
    setTaskSessions([]);
    setTaskSessionsLoading(false);
  };

  const getTotalStats = () => {
    const totalPomodoros = taskStats.reduce((sum, stat) => sum + stat.completedPomodoros, 0);
    const totalTime = taskStats.reduce((sum, stat) => sum + stat.totalFocusTime, 0);
    return { totalPomodoros, totalTime };
  };

  const { totalPomodoros, totalTime } = getTotalStats();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.textSecondary}
        />
      }
    >
      <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>

      <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Overall Progress</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>
              {totalPomodoros}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total Pomodoros
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.secondary }]}>
              {formatTime(totalTime)}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
              Total Focus Time
            </Text>
          </View>
        </View>
      </View>

      {dailyStats.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Progress</Text>
          {dailyStats.slice(0, 7).map((stat, index) => (
            <View key={index} style={styles.statRow}>
              <Text style={[styles.statDate, { color: theme.text }]}>
                {new Date(stat.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <View style={styles.statBar}>
                <View
                  style={[
                    styles.statBarFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${Math.min((stat.completedPomodoros / 10) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.statValue, { color: theme.textSecondary }]}>
                {stat.completedPomodoros}
              </Text>
            </View>
          ))}
        </View>
      )}

      {taskStats.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Task Breakdown</Text>
          {taskStats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.taskStatRow}
              activeOpacity={0.8}
              onPress={() => openTaskAnalytics(stat)}
            >
              <View style={styles.taskStatInfo}>
                <Text style={[styles.taskStatName, { color: theme.text }]}>
                  {stat.taskName}
                </Text>
                <Text style={[styles.taskStatDetail, { color: theme.textSecondary }]}>
                  {stat.completedPomodoros} sessions • {formatHours(stat.totalFocusTime)} total
                </Text>
              </View>
              <View style={styles.taskStatRight}>
                <View
                  style={[
                    styles.taskStatBadge,
                    { backgroundColor: `${theme.primary}20` },
                  ]}
                >
                  <Text style={[styles.taskStatBadgeText, { color: theme.primary }]}>
                    {stat.completedPomodoros}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!loading && dailyStats.length === 0 && taskStats.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No statistics yet. Complete some Pomodoro sessions to see your progress!
          </Text>
        </View>
      )}

      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeTaskAnalytics}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {selectedTask?.taskName || 'Task analytics'}
                </Text>
                {!!selectedTask && (
                  <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                    {selectedTask.completedPomodoros} sessions • {formatTime(selectedTask.totalFocusTime)} total
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={closeTaskAnalytics}
                style={[styles.modalCloseButton, { backgroundColor: `${theme.border}80` }]}
              >
                <Text style={[styles.modalCloseButtonText, { color: theme.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {!!selectedTask && (
              <View style={[styles.analyticsGrid, { borderColor: theme.border }]}>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Total sessions</Text>
                  <Text style={[styles.analyticsValue, { color: theme.text }]}>
                    {selectedTask.completedPomodoros}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Total time</Text>
                  <Text style={[styles.analyticsValue, { color: theme.text }]}>
                    {formatHours(selectedTask.totalFocusTime)}
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsLabel, { color: theme.textSecondary }]}>Avg / session</Text>
                  <Text style={[styles.analyticsValue, { color: theme.text }]}>
                    {selectedTask.completedPomodoros > 0
                      ? formatTime(Math.floor(selectedTask.totalFocusTime / selectedTask.completedPomodoros))
                      : '—'}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent sessions</Text>
            {taskSessionsLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading…</Text>
              </View>
            ) : taskSessions.length === 0 ? (
              <Text style={[styles.emptyModalText, { color: theme.textSecondary }]}>
                No sessions found for this task yet.
              </Text>
            ) : (
              <ScrollView style={styles.sessionList} contentContainerStyle={styles.sessionListContent}>
                {taskSessions.slice(0, 20).map((s) => (
                  <View
                    key={s.id}
                    style={[styles.sessionRow, { borderBottomColor: theme.border }]}
                  >
                    <View style={styles.sessionRowLeft}>
                      <Text style={[styles.sessionDate, { color: theme.text }]}>
                        {new Date(s.startTime).toLocaleString()}
                      </Text>
                      <Text style={[styles.sessionMeta, { color: theme.textSecondary }]}>
                        Duration: {formatTime(s.duration)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.sessionPill,
                        { backgroundColor: `${(s.completed ? theme.primary : theme.error)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionPillText,
                          { color: s.completed ? theme.primary : theme.error },
                        ]}
                      >
                        {s.completed ? 'Completed' : 'Not completed'}
                      </Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statDate: {
    width: 60,
    fontSize: 14,
    fontWeight: '500',
  },
  statBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statValue: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  taskStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskStatInfo: {
    flex: 1,
  },
  taskStatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 2,
  },
  taskStatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskStatDetail: {
    fontSize: 14,
  },
  taskStatBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  taskStatBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 650,
    borderRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  analyticsGrid: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  analyticsItem: {
    flex: 1,
  },
  analyticsLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  analyticsValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyModalText: {
    fontSize: 14,
    paddingVertical: 6,
  },
  sessionList: {
    flexGrow: 0,
  },
  sessionListContent: {
    paddingBottom: 8,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  sessionRowLeft: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionMeta: {
    fontSize: 12,
  },
  sessionPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  sessionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
