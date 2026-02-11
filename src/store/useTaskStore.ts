import { SubTask, Task } from "@/types/todo";
import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

// 简单的 UUID 生成器
const generateId = () => crypto.randomUUID();

// 自定义 IndexedDB 存储适配器
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface TaskState {
  tasks: Task[];
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  cleanupCompletedTasks: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => {
        const newTask: Task = {
          id: generateId(),
          title: task.title || "New Task",
          status: "todo",
          priority: task.priority || "none",
          order: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          checklist: [],
          ...task,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: Date.now() }
              : task,
          ),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      toggleTaskStatus: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === id) {
              const newStatus = task.status === "todo" ? "completed" : "todo";
              return {
                ...task,
                status: newStatus,
                completedAt: newStatus === "completed" ? Date.now() : undefined,
                updatedAt: Date.now(),
              };
            }
            return task;
          }),
        }));
      },
      addSubTask: (taskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              const newSubTask: SubTask = {
                id: generateId(),
                title,
                done: false,
              };
              return {
                ...task,
                checklist: [...(task.checklist || []), newSubTask],
                updatedAt: Date.now(),
              };
            }
            return task;
          }),
        }));
      },
      toggleSubTask: (taskId, subTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              const newChecklist = (task.checklist || []).map((st) =>
                st.id === subTaskId ? { ...st, done: !st.done } : st,
              );

              // Check if all subtasks are done
              const allDone =
                newChecklist.length > 0 && newChecklist.every((st) => st.done);
              const shouldComplete = allDone && task.status === "todo";

              return {
                ...task,
                checklist: newChecklist,
                status: shouldComplete ? "completed" : task.status,
                completedAt: shouldComplete ? Date.now() : task.completedAt,
                updatedAt: Date.now(),
              };
            }
            return task;
          }),
        }));
      },
      deleteSubTask: (taskId, subTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                checklist: (task.checklist || []).filter(
                  (st) => st.id !== subTaskId,
                ),
                updatedAt: Date.now(),
              };
            }
            return task;
          }),
        }));
      },
      reorderTasks: (taskIds) => {
        set((state) => {
          const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
          const reordered = taskIds
            .map((id) => taskMap.get(id))
            .filter((t): t is Task => !!t);
          const otherTasks = state.tasks.filter((t) => !taskIds.includes(t.id));
          return {
            tasks: [...reordered, ...otherTasks],
          };
        });
      },
      cleanupCompletedTasks: () => {
        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
        set((state) => ({
          tasks: state.tasks.filter((task) => {
            if (task.status === "completed" && task.completedAt) {
              return task.completedAt > twoDaysAgo;
            }
            return true;
          }),
        }));
      },
    }),
    {
      name: "task-storage",
      storage: createJSONStorage(() => storage),
    },
  ),
);
