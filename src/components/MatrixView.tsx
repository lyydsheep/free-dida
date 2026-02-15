import { useTaskStore } from "@/store/useTaskStore";
import { Task, TaskPriority } from "@/types/todo";
import { isPast, isToday } from "date-fns";
import React from "react";
import { TaskItem } from "./TaskItem";

interface MatrixViewProps {
  onTaskClick: (taskId: string) => void;
  tasks?: Task[];
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  onTaskClick,
  tasks: propTasks,
}) => {
  const { tasks: storeTasks } = useTaskStore();
  const tasks = propTasks ?? storeTasks;
  const todoTasks = tasks.filter((t) => t.status === "todo");

  const isUrgent = (task: Task) => {
    if (task.priority === "p0" || task.priority === "p2") return true;
    if (!task.dueDate) return false;
    const date = new Date(task.dueDate);
    return isToday(date) || isPast(date);
  };

  const isImportant = (task: Task) => {
    return task.priority === "p0" || task.priority === "p1";
  };

  const priorityWeight: Record<TaskPriority, number> = {
    p0: 4,
    p1: 3,
    p2: 2,
    none: 1,
  };

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      const weightA = priorityWeight[a.priority] ?? 0;
      const weightB = priorityWeight[b.priority] ?? 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      const dateA = a.dueDate ?? Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ?? Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
  };

  const q1 = sortTasks(todoTasks.filter((t) => isImportant(t) && isUrgent(t))); // Important & Urgent
  const q2 = sortTasks(todoTasks.filter((t) => isImportant(t) && !isUrgent(t))); // Important & Not Urgent
  const q3 = sortTasks(todoTasks.filter((t) => !isImportant(t) && isUrgent(t))); // Not Important & Urgent
  const q4 = sortTasks(
    todoTasks.filter((t) => !isImportant(t) && !isUrgent(t)),
  ); // Not Important & Not Urgent

  const Quadrant = ({
    title,
    tasks,
    color,
    borderColor,
  }: {
    title: string;
    tasks: Task[];
    color: string;
    borderColor: string;
  }) => (
    <div
      className={`flex-1 flex flex-col p-4 overflow-hidden ${color} relative`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${borderColor}`}></div>
      <header className="mb-2 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs font-medium text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </header>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <div className="flex-1 flex border-b border-slate-100">
        <Quadrant
          title="立即执行"
          tasks={q1}
          color="bg-red-50/30"
          borderColor="bg-red-400"
        />
        <div className="w-px bg-slate-100"></div>
        <Quadrant
          title="计划安排"
          tasks={q2}
          color="bg-blue-50/30"
          borderColor="bg-blue-400"
        />
      </div>
      <div className="flex-1 flex">
        <Quadrant
          title="委派他人"
          tasks={q3}
          color="bg-orange-50/30"
          borderColor="bg-orange-400"
        />
        <div className="w-px bg-slate-100"></div>
        <Quadrant
          title="尽量不做"
          tasks={q4}
          color="bg-slate-50/30"
          borderColor="bg-slate-400"
        />
      </div>
    </div>
  );
};
