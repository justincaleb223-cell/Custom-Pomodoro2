
import { useState, useEffect } from 'react';
import { supabase, Task } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (name: string, description?: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ name, description, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setTasks([data, ...tasks]);
    }

    return { data, error };
  };

  const updateTask = async (id: string, name: string, description?: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setTasks(tasks.map(t => t.id === id ? data : t));
    }

    return { data, error };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
    }

    return { error };
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchTasks,
  };
}
