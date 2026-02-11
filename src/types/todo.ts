export type TaskStatus = "todo" | "completed";
export type TaskPriority = "p0" | "p1" | "p2" | "none"; // p0为最高优先级(红色)

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string; // UUID
  title: string; // 任务标题 (纯文本)
  description?: string; // 任务描述 (支持 Markdown)
  status: TaskStatus; // 状态
  priority: TaskPriority; // 优先级

  order: number; // 排序值

  // 时间相关
  dueDate?: number; // 截止时间 (时间戳，精确到毫秒)
  isAllDay?: boolean; // 是否为全天任务

  // 子任务
  checklist?: SubTask[];

  // 元数据
  createdAt: number;
  updatedAt: number;
  completedAt?: number; // 完成时间
}
