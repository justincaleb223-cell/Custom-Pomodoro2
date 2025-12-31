
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  useColorScheme,
  Modal,
} from 'react-native';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { tasksAPI } from '@/services/api';
import { Task } from '@/types';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const { selectedTask, setSelectedTask } = usePomodoro();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? colors.dark : colors.light;

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await tasksAPI.getTasks();
      setTasks(data);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks. Using offline mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async () => {
    if (!taskName.trim()) {
      Alert.alert('Error', 'Task name is required');
      return;
    }

    try {
      if (editingTask) {
        const updated = await tasksAPI.updateTask(
          editingTask.id,
          taskName,
          taskDescription
        );
        setTasks(tasks.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const newTask = await tasksAPI.createTask(taskName, taskDescription);
        setTasks([...tasks, newTask]);
      }
      closeModal();
    } catch (error: any) {
      console.error('Error saving task:', error);
      Alert.alert('Error', error.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await tasksAPI.deleteTask(task.id);
            setTasks(tasks.filter((t) => t.id !== task.id));
            if (selectedTask?.id === task.id) {
              setSelectedTask(null);
            }
          } catch (error: any) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const openModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskName(task.name);
      setTaskDescription(task.description || '');
    } else {
      setEditingTask(null);
      setTaskName('');
      setTaskDescription('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    setTaskName('');
    setTaskDescription('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>My Tasks</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => openModal()}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Loading tasks...
          </Text>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No tasks yet. Create your first task!
            </Text>
          </View>
        ) : (
          tasks.map((task, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.taskCard,
                {
                  backgroundColor: theme.card,
                  borderColor: selectedTask?.id === task.id ? theme.primary : theme.border,
                  borderWidth: selectedTask?.id === task.id ? 2 : 1,
                },
              ]}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.taskContent}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskName, { color: theme.text }]}>
                    {task.name}
                  </Text>
                  {selectedTask?.id === task.id && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={16}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </View>
                {task.description && (
                  <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                    {task.description}
                  </Text>
                )}
              </View>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openModal(task)}
                >
                  <IconSymbol
                    ios_icon_name="pencil"
                    android_material_icon_name="edit"
                    size={20}
                    color={theme.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteTask(task)}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={20}
                    color={theme.error}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Task name"
              placeholderTextColor={theme.textSecondary}
              value={taskName}
              onChangeText={setTaskName}
            />

            <TextInput
              style={[styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Description (optional)"
              placeholderTextColor={theme.textSecondary}
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={closeModal}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={handleSaveTask}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
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
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
