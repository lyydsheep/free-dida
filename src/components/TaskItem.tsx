import { useTaskStore } from "@/store/useTaskStore";
import { Task } from "@/types/todo";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { format, isToday, isTomorrow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";

interface TaskItemProps {
  task: Task;
  onTaskClick?: (taskId: string) => void;
  isSortable?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(
  ({ task, onTaskClick, isSortable = false }) => {
    const { toggleTaskStatus, updateTask, setTaskStatus, toggleSubTask } =
      useTaskStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [isExpanded, setIsExpanded] = useState(false);
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

    const handleStatusClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTaskStatus(task.id);
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

    const isTaskInProgress = task.isInProgress;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={clsx(
          "flex flex-col py-3 group bg-white transition-shadow",
          isDragging &&
            "shadow-lg ring-2 ring-blue-400 z-50 opacity-90 scale-[1.02]",
          "active:cursor-grabbing",
        )}
      >
        <div className="flex items-center w-full">
          {isSortable && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing -ml-2 mr-1 p-1.5 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <circle cx="4" cy="4" r="2" />
                <circle cx="12" cy="4" r="2" />
                <circle cx="4" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
          )}

          {/* Expansion Toggle */}
          {task.checklist && task.checklist.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mr-2 p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px] block">
                {isExpanded ? "expand_more" : "chevron_right"}
              </span>
            </button>
          ) : (
            <div className="w-[24px] mr-2 flex-shrink-0"></div> // Placeholder for alignment
          )}

          <div
            className="relative flex items-center cursor-pointer group/status flex-shrink-0"
            onClick={handleStatusClick}
          >
            <div
              className={clsx(
                "w-[22px] h-[22px] rounded-full border transition-all flex items-center justify-center",
                task.status === "completed"
                  ? "bg-blue-500 border-blue-500"
                  : "border-slate-200 group-hover/status:border-blue-400",
              )}
            >
              {task.status === "completed" && (
                <span className="material-symbols-outlined text-white text-[14px] font-bold">
                  check
                </span>
              )}
            </div>
          </div>

          <div
            className="flex-1 ml-2 md:ml-4 flex items-center border-b border-slate-100 py-1 group-last:border-none cursor-pointer"
            onClick={() => {
              if (!isEditing) {
                onTaskClick?.(task.id);
              }
            }}
          >
            <div
              className={clsx(
                "w-[2px] h-4 mr-2 md:mr-3 rounded-full flex-shrink-0",
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
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span
                  className={clsx(
                    "text-[16px] font-normal text-slate-800 truncate select-none flex-1",
                    task.status === "completed" &&
                      "line-through text-slate-400",
                  )}
                  title={task.title}
                  onDoubleClick={() => {
                    setIsEditing(true);
                  }}
                >
                  {task.title}
                </span>

                {/* Tags - Now inline */}
                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium whitespace-nowrap"
                      >
                        {tag}
                      </span>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 whitespace-nowrap">
                        +{task.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Checklist Count - Now inline */}
                {task.checklist && task.checklist.length > 0 && (
                  <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                    {task.checklist.filter((t) => t.done).length}/
                    {task.checklist.length}
                  </span>
                )}

                {/* In Progress Indicator / Toggle */}
                {task.status !== "completed" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTask(task.id, {
                        isInProgress: !task.isInProgress,
                      });
                    }}
                    className={clsx(
                      "flex items-center justify-center rounded transition-all flex-shrink-0",
                      task.isInProgress
                        ? "text-[10px] px-1.5 py-0.5 font-medium text-orange-600 bg-orange-50 border border-orange-100 hover:bg-orange-100 whitespace-nowrap"
                        : "w-5 h-5 text-slate-300 hover:text-orange-500 opacity-0 group-hover:opacity-100",
                    )}
                    title={task.isInProgress ? "暂停" : "开始处理"}
                  >
                    {task.isInProgress ? (
                      "进行中"
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">
                        play_arrow
                      </span>
                    )}
                  </button>
                )}

                {task.dueDate && (
                  <span
                    className={clsx(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 whitespace-nowrap",
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
            )}
          </div>
        </div>

        {/* Subtasks List */}
        {isExpanded && task.checklist && task.checklist.length > 0 && (
          <div className="w-full pl-[52px] pr-4 mt-1 space-y-1">
            {task.checklist.map((subTask) => (
              <div
                key={subTask.id}
                className="flex items-center gap-3 py-1 group/sub"
              >
                <label className="relative flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={subTask.done}
                    onChange={() => toggleSubTask(task.id, subTask.id)}
                  />
                  <div className="w-[16px] h-[16px] rounded border border-slate-300 transition-all flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500">
                    {subTask.done && (
                      <span className="material-symbols-outlined text-white text-[10px] font-bold">
                        check
                      </span>
                    )}
                  </div>
                </label>
                <span
                  className={clsx(
                    "text-sm text-slate-600 flex-1",
                    subTask.done && "line-through text-slate-400",
                  )}
                >
                  {subTask.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
