import { storageService } from "@/services/storage";
import { SubTask, Task } from "@/types/todo";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// 简单的 UUID 生成器
const generateId = () => crypto.randomUUID();

type GroupBy = "priority" | "date";

interface TaskState {
  tasks: Task[];
  searchQuery: string;
  selectedTag: string | null;
  selectedTaskId: string | null;
  groupBy: GroupBy; // Add groupBy
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  setTaskStatus: (id: string, status: Task["status"]) => void;
  addSubTask: (taskId: string, title: string) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  deleteSubTask: (taskId: string, subTaskId: string) => void;
  reorderTasks: (taskIds: string[]) => void;
  moveTask: (
    taskId: string,
    newOrderIds: string[],
    updates?: Partial<Task>,
  ) => void;
  cleanupCompletedTasks: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  setGroupBy: (groupBy: GroupBy) => void; // Add setGroupBy
  addTaskTag: (taskId: string, tag: string) => void;
  removeTaskTag: (taskId: string, tag: string) => void;
  setTaskTags: (taskId: string, tags: string[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    immer((set, get) => ({
      tasks: [],
      searchQuery: "",
      selectedTag: null,
      selectedTaskId: null,
      groupBy: "priority",

      loadTasks: async () => {
        await storageService.migrateFromLocalStorage();
        const tasks = await storageService.getAllTasks();
        set((state) => {
          state.tasks = tasks;
        });
      },

      addTask: async (task) => {
        const newTask: Task = {
          id: generateId(),
          title: task.title || "New Task",
          status: "todo",
          isInProgress: false,
          priority: task.priority || "none",
          order: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          checklist: [],
          ...task,
        };
        await storageService.addTask(newTask);
        set((state) => {
          state.tasks.push(newTask);
        });
      },

      updateTask: async (id, updates) => {
        const timestamp = Date.now();
        const newUpdates = { ...updates, updatedAt: timestamp };
        await storageService.updateTask(id, newUpdates);
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (task) {
            Object.assign(task, newUpdates);
          }
        });
      },

      deleteTask: async (id) => {
        await storageService.deleteTask(id);
        set((state) => {
          const index = state.tasks.findIndex((t) => t.id === id);
          if (index !== -1) {
            state.tasks.splice(index, 1);
          }
        });
      },

      toggleTaskStatus: async (id) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (task) {
          const newStatus = task.status === "completed" ? "todo" : "completed";
          const updates = {
            status: newStatus,
            isInProgress: false,
            completedAt: newStatus === "completed" ? Date.now() : undefined,
            updatedAt: Date.now(),
          };
          await storageService.updateTask(id, updates);
          set((state) => {
            const t = state.tasks.find((t) => t.id === id);
            if (t) Object.assign(t, updates);
          });
        }
      },

      setTaskStatus: async (id, status) => {
        let newStatus = status;
        let newIsInProgress = false;

        if (status === "in_progress") {
          newStatus = "todo";
          newIsInProgress = true;
        }

        const updates = {
          status: newStatus,
          isInProgress: newIsInProgress,
          completedAt: newStatus === "completed" ? Date.now() : undefined,
          updatedAt: Date.now(),
        };

        await storageService.updateTask(id, updates);
        set((state) => {
          const t = state.tasks.find((t) => t.id === id);
          if (t) Object.assign(t, updates);
        });
      },

      addSubTask: async (taskId, title) => {
        const newSubTask: SubTask = {
          id: generateId(),
          title,
          done: false,
        };

        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          const newChecklist = [...(task.checklist || []), newSubTask];
          const updates = { checklist: newChecklist, updatedAt: Date.now() };
          await storageService.updateTask(taskId, updates);
          set((state) => {
            const t = state.tasks.find((t) => t.id === taskId);
            if (t) {
              t.checklist = newChecklist;
              t.updatedAt = updates.updatedAt;
            }
          });
        }
      },

      toggleSubTask: async (taskId, subTaskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          const newChecklist = (task.checklist || []).map((st) =>
            st.id === subTaskId ? { ...st, done: !st.done } : st,
          );

          // Check if all subtasks are done
          const allDone =
            newChecklist.length > 0 && newChecklist.every((st) => st.done);
          const anyDone = newChecklist.some((st) => st.done);

          let newStatus = task.status;
          let newIsInProgress = task.isInProgress;

          if (allDone) {
            newStatus = "completed";
            newIsInProgress = false;
          } else if (anyDone) {
            newStatus = "todo";
            newIsInProgress = true;
          } else if (!anyDone && task.status === "completed") {
            newStatus = "todo";
            newIsInProgress = false;
          }

          const updates = {
            checklist: newChecklist,
            status: newStatus,
            isInProgress: newIsInProgress,
            completedAt: newStatus === "completed" ? Date.now() : undefined,
            updatedAt: Date.now(),
          };

          await storageService.updateTask(taskId, updates);
          set((state) => {
            const t = state.tasks.find((t) => t.id === taskId);
            if (t) Object.assign(t, updates);
          });
        }
      },

      deleteSubTask: async (taskId, subTaskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          const newChecklist = (task.checklist || []).filter(
            (st) => st.id !== subTaskId,
          );
          const updates = { checklist: newChecklist, updatedAt: Date.now() };
          await storageService.updateTask(taskId, updates);
          set((state) => {
            const t = state.tasks.find((t) => t.id === taskId);
            if (t) {
              t.checklist = newChecklist;
              t.updatedAt = updates.updatedAt;
            }
          });
        }
      },

      reorderTasks: (taskIds) => {
        set((state) => {
          const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
          const reordered = taskIds
            .map((id) => taskMap.get(id))
            .filter((t): t is Task => !!t);
          const otherTasks = state.tasks.filter((t) => !taskIds.includes(t.id));
          state.tasks = [...reordered, ...otherTasks];
        });
      },

      moveTask: async (taskId, newOrderIds, updates) => {
        if (updates) {
          await storageService.updateTask(taskId, updates);
        }

        set((state) => {
          const taskMap = new Map(state.tasks.map((t) => [t.id, t]));
          const reordered = newOrderIds
            .map((id) => taskMap.get(id))
            .filter((t): t is Task => !!t);

          if (updates) {
            const movedTaskIndex = reordered.findIndex((t) => t.id === taskId);
            if (movedTaskIndex !== -1) {
              Object.assign(reordered[movedTaskIndex], updates, {
                updatedAt: Date.now(),
              });
            }
          }

          const otherTasks = state.tasks.filter(
            (t) => !newOrderIds.includes(t.id),
          );
          state.tasks = [...reordered, ...otherTasks];
        });
      },

      cleanupCompletedTasks: async () => {
        const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
        const state = get();
        const tasksToDelete = state.tasks.filter((task) => {
          if (task.status === "completed" && task.completedAt) {
            return task.completedAt <= twoDaysAgo;
          }
          return false;
        });

        for (const task of tasksToDelete) {
          await storageService.deleteTask(task.id);
        }

        set((state) => {
          state.tasks = state.tasks.filter(
            (t) => !tasksToDelete.find((d) => d.id === t.id),
          );
        });
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
      setGroupBy: (groupBy) => set({ groupBy }),

      addTaskTag: async (taskId, tag) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          const newTags = [...new Set([...(task.tags || []), tag.trim()])];
          const updates = { tags: newTags, updatedAt: Date.now() };
          await storageService.updateTask(taskId, updates);
          set((state) => {
            const t = state.tasks.find((t) => t.id === taskId);
            if (t) {
              t.tags = newTags;
              t.updatedAt = updates.updatedAt;
            }
          });
        }
      },

      removeTaskTag: async (taskId, tag) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          const newTags = (task.tags || []).filter((t) => t !== tag);
          const updates = { tags: newTags, updatedAt: Date.now() };
          await storageService.updateTask(taskId, updates);
          set((state) => {
            const t = state.tasks.find((t) => t.id === taskId);
            if (t) {
              t.tags = newTags;
              t.updatedAt = updates.updatedAt;
            }
          });
        }
      },

      setTaskTags: async (taskId, tags) => {
        const newTags = [...new Set(tags.map((t) => t.trim()))];
        const updates = { tags: newTags, updatedAt: Date.now() };
        await storageService.updateTask(taskId, updates);
        set((state) => {
          const t = state.tasks.find((t) => t.id === taskId);
          if (t) {
            t.tags = newTags;
            t.updatedAt = updates.updatedAt;
          }
        });
      },
    })),
    {
      name: "ui-storage",
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        groupBy: state.groupBy,
        selectedTag: state.selectedTag,
      }),
    },
  ),
);
