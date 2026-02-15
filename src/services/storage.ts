import { db, TaskSchema } from "@/db";
import { Task } from "@/types/todo";
import { get } from "idb-keyval";

export const storageService = {
  async getAllTasks(): Promise<Task[]> {
    const tasks = await db.tasks.toArray();
    // Validate tasks with Zod
    return tasks.filter((task) => {
      const result = TaskSchema.safeParse(task);
      if (!result.success) {
        console.error("Invalid task data:", result.error, task);
        return false;
      }
      return true;
    });
  },

  async addTask(task: Task): Promise<void> {
    await db.tasks.add(task);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    await db.tasks.update(id, updates);
  },

  async deleteTask(id: string): Promise<void> {
    await db.tasks.delete(id);
  },

  async bulkPutTasks(tasks: Task[]): Promise<void> {
    await db.tasks.bulkPut(tasks);
  },

  async migrateFromLocalStorage(): Promise<void> {
    // Check if migration is already done or if DB is not empty
    const count = await db.tasks.count();
    if (count > 0) {
      return;
    }

    const tasksJson = await get("task-storage");
    if (tasksJson) {
      try {
        // idb-keyval stores the stringified JSON directly if using default storage,
        // but zustand persist middleware might store it differently.
        // Let's assume it's the standard zustand persist format.
        // Actually, useTaskStore uses a custom storage adapter that uses idb-keyval.
        // The value stored in idb-keyval by zustand persist is a JSON string: { state: { ... }, version: ... }

        // However, the custom storage adapter in useTaskStore.ts:
        // setItem: async (name: string, value: string) => await set(name, value)
        // So 'value' is the stringified state.

        // But wait, 'get' from idb-keyval returns the value as is.
        // If it was stored as a string, it returns a string.

        let parsed;
        if (typeof tasksJson === "string") {
          parsed = JSON.parse(tasksJson);
        } else {
          parsed = tasksJson;
        }

        const tasks = parsed?.state?.tasks;

        if (Array.isArray(tasks)) {
          const validTasks = tasks.filter((task: any) => {
            const result = TaskSchema.safeParse(task);
            return result.success;
          });

          if (validTasks.length > 0) {
            await db.tasks.bulkPut(validTasks);
            console.log(
              `Migrated ${validTasks.length} tasks from localStorage/IndexedDB-keyval.`,
            );
          }
        }
      } catch (e) {
        console.error("Failed to migrate tasks:", e);
      }
    }
  },
};
