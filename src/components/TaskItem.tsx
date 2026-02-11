import { useTaskStore } from "@/store/useTaskStore";
import { Task } from "@/types/todo";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { format, isToday, isTomorrow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";

interface TaskItemProps {
  task: Task;
  onClick?: () => void;
  isSortable?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(
  ({ task, onClick, isSortable = false }) => {
    const { toggleTaskStatus, updateTask } = useTaskStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: task.id,
      disabled: !isSortable || isEditing,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);

    const handleBlur = () => {
      setIsEditing(false);
      if (editTitle.trim() !== task.title) {
        updateTask(task.id, { title: editTitle });
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleBlur();
      } else if (e.key === "Escape") {
        setIsEditing(false);
        setEditTitle(task.title);
      }
    };

    const getPriorityColor = (p: string) => {
      switch (p) {
        case "p0":
          return "bg-red-500";
        case "p1":
          return "bg-orange-500";
        case "p2":
          return "bg-blue-500";
        default:
          return "bg-slate-300";
      }
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={clsx(
          "flex items-center py-3.5 group bg-white transition-shadow",
          isDragging &&
            "shadow-lg ring-2 ring-blue-400 z-50 opacity-90 scale-[1.02]",
          "active:cursor-grabbing",
        )}
      >
        {isSortable && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing -ml-2 mr-1 p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="4" cy="4" r="2" />
              <circle cx="12" cy="4" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        )}

        <label className="relative flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={task.status === "completed"}
            onChange={() => toggleTaskStatus(task.id)}
          />
          <div className="w-[22px] h-[22px] rounded-full border border-slate-200 transition-all flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500">
            {task.status === "completed" && (
              <span className="material-symbols-outlined text-white text-[14px] font-bold">
                check
              </span>
            )}
          </div>
        </label>

        <div
          className="flex-1 ml-4 flex items-center border-b border-slate-100 pb-3.5 group-last:border-none cursor-pointer"
          onClick={() => {
            if (!isEditing) {
              onClick?.();
            }
          }}
        >
          <div
            className={clsx(
              "w-[2px] h-4 mr-3 rounded-full",
              getPriorityColor(task.priority),
            )}
          ></div>

          {isEditing ? (
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-transparent border-none p-0 text-[16px] font-normal text-slate-800 focus:ring-0 outline-none"
            />
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "text-[16px] font-normal text-slate-800 flex-1 select-none",
                    task.status === "completed" &&
                      "line-through text-slate-400",
                  )}
                  onDoubleClick={() => {
                    setIsEditing(true);
                  }}
                >
                  {task.title}
                </span>
                {task.dueDate && (
                  <span
                    className={clsx(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      task.dueDate < Date.now() && task.status !== "completed"
                        ? "text-red-600 bg-red-50"
                        : "text-slate-400 bg-slate-100",
                    )}
                  >
                    {isToday(task.dueDate)
                      ? "今天"
                      : isTomorrow(task.dueDate)
                        ? "明天"
                        : format(task.dueDate, "MM/dd")}
                  </span>
                )}
              </div>
              {task.checklist && task.checklist.length > 0 && (
                <span className="text-xs text-slate-400 mt-0.5">
                  {task.checklist.filter((t) => t.done).length}/
                  {task.checklist.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);
