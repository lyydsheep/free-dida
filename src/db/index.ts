import { Task } from "@/types/todo";
import Dexie, { Table } from "dexie";
import { z } from "zod";

export const SubTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  done: z.boolean(),
});

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "completed"]),
  isInProgress: z.boolean().optional(),
  priority: z.enum(["p0", "p1", "p2", "none"]).default("none"),
  order: z.number(),
  dueDate: z.number().optional(),
  isAllDay: z.boolean().optional(),
  checklist: z.array(SubTaskSchema).optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().optional(),
});

export class FreeDidaDB extends Dexie {
  tasks!: Table<Task, string>;

  constructor() {
    super("FreeDidaDB");
    this.version(1).stores({
      tasks:
        "id, title, status, priority, dueDate, *tags, createdAt, updatedAt, completedAt",
    });
  }
}

export const db = new FreeDidaDB();
