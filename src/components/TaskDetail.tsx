import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskPriority } from "@/types/todo";
import clsx from "clsx";
import { format } from "date-fns";
import React, { useEffect, useMemo, useRef, useState } from "react";

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

// 预定义标签颜色
const tagColors = [
  { bg: "bg-blue-50", text: "text-blue-600" },
  { bg: "bg-green-50", text: "text-green-600" },
  { bg: "bg-purple-50", text: "text-purple-600" },
  { bg: "bg-orange-50", text: "text-orange-600" },
  { bg: "bg-pink-50", text: "text-pink-600" },
  { bg: "bg-cyan-50", text: "text-cyan-600" },
  { bg: "bg-indigo-50", text: "text-indigo-600" },
  { bg: "bg-teal-50", text: "text-teal-600" },
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
};

export const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose }) => {
  const {
    tasks,
    updateTask,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    deleteTask,
    toggleTaskStatus,
    addTaskTag,
    removeTaskTag,
  } = useTaskStore();
  const task = tasks.find((t) => t.id === taskId);

  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 获取所有已存在的标签
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach((t) => {
      t.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // 过滤出未使用的标签
  const availableTags = useMemo(() => {
    const currentTags = new Set(task?.tags || []);
    return existingTags.filter((tag) => !currentTags.has(tag));
  }, [existingTags, task?.tags]);

  // 过滤标签（用于搜索）
  const filteredAvailableTags = useMemo(() => {
    if (!newTag.trim()) return availableTags;
    return availableTags.filter((tag) =>
      tag.toLowerCase().includes(newTag.toLowerCase()),
    );
  }, [availableTags, newTag]);

  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = "auto";
      titleTextareaRef.current.style.height =
        titleTextareaRef.current.scrollHeight + "px";
    }
  }, [task?.title]);

  if (!task) return null;

  const handleAddSubTask = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSubTaskTitle.trim()) {
      addSubTask(taskId, newSubTaskTitle.trim());
      setNewSubTaskTitle("");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      const trimmedTag = newTag.trim();
      if (!task?.tags?.includes(trimmedTag)) {
        addTaskTag(taskId, trimmedTag);
      }
      setNewTag("");
      e.preventDefault();
    }
  };

  const handleSelectExistingTag = (tag: string) => {
    addTaskTag(taskId, tag);
    setNewTag("");
  };

  const priorities: TaskPriority[] = ["p0", "p1", "p2", "none"];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer select-none group"
              onClick={() => toggleTaskStatus(taskId)}
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                  task.status === "completed"
                    ? "bg-blue-500 border-blue-500"
                    : "border-slate-300 group-hover:border-blue-400",
                )}
              >
                {task.status === "completed" && (
                  <span className="material-symbols-outlined text-white text-[12px] font-bold">
                    check
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  "text-sm font-medium",
                  task.status === "completed"
                    ? "text-slate-400"
                    : "text-slate-500",
                )}
              >
                {task.status === "completed" ? "已完成" : "完成"}
              </span>
            </div>

            <div className="w-px h-4 bg-slate-200"></div>

            <div
              className="flex items-center gap-2 cursor-pointer select-none group"
              onClick={() =>
                updateTask(taskId, { isInProgress: !task.isInProgress })
              }
            >
              <div
                className={clsx(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                  task.isInProgress
                    ? "bg-orange-50 border-orange-500"
                    : "border-slate-300 group-hover:border-orange-400",
                )}
              >
                {task.isInProgress && (
                  <span className="material-symbols-outlined text-orange-500 text-[12px] font-bold">
                    play_arrow
                  </span>
                )}
              </div>
              <span
                className={clsx(
                  "text-sm font-medium",
                  task.isInProgress ? "text-orange-600" : "text-slate-500",
                )}
              >
                {task.isInProgress ? "处理中" : "标记处理中"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">close</span>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <textarea
              ref={titleTextareaRef}
              value={task.title}
              onChange={(e) => updateTask(taskId, { title: e.target.value })}
              rows={1}
              className="w-full text-2xl font-semibold border-none p-0 focus:ring-0 placeholder:text-slate-300 outline-none resize-none overflow-hidden bg-transparent"
              placeholder="任务标题"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              描述
            </label>
            <textarea
              value={task.description || ""}
              onChange={(e) =>
                updateTask(taskId, { description: e.target.value })
              }
              className="w-full min-h-[100px] text-sm text-slate-700 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              placeholder="添加详情..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              标签
            </label>
            <div className="space-y-2">
              {/* Current tags */}
              <div className="flex flex-wrap gap-2">
                {task.tags?.map((tag) => {
                  const color = getTagColor(tag);
                  return (
                    <span
                      key={tag}
                      className={clsx(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                        color.bg,
                        color.text,
                      )}
                    >
                      {tag}
                      <button
                        onClick={() => removeTaskTag(taskId, tag)}
                        className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                      >
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 12 12"
                          fill="currentColor"
                        >
                          <path
                            d="M3 3L9 9M9 3L3 9"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
              {/* Tag input */}
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">
                    label
                  </span>
                  <input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleAddTag}
                    onFocus={() => setIsTagInputFocused(true)}
                    onBlur={() =>
                      setTimeout(() => setIsTagInputFocused(false), 200)
                    }
                    placeholder="添加标签，按回车确认"
                    className="flex-1 text-sm bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-400 outline-none"
                  />
                </div>
                {/* Available tags dropdown */}
                {isTagInputFocused && filteredAvailableTags.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    <div className="p-2">
                      <span className="text-xs text-slate-400 block mb-1.5 px-1">
                        已有标签
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {filteredAvailableTags.map((tag) => {
                          const color = getTagColor(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => handleSelectExistingTag(tag)}
                              className={clsx(
                                "px-2 py-1 rounded-full text-xs font-medium transition-all hover:scale-105",
                                color.bg,
                                color.text,
                              )}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              优先级
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => updateTask(taskId, { priority: p })}
                  className={clsx(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    task.priority === p
                      ? "bg-slate-800 text-white border-slate-800"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
                  )}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              截止日期
            </label>
            <div className="relative">
              <Input
                type="date"
                value={
                  task.dueDate
                    ? format(new Date(task.dueDate), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) => {
                  const date = e.target.value
                    ? new Date(e.target.value).getTime()
                    : undefined;
                  updateTask(taskId, { dueDate: date });
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              检查清单
            </label>
            <div className="space-y-2 mb-3">
              {task.checklist?.map((st) => (
                <div key={st.id} className="flex items-center gap-3 group">
                  <input
                    type="checkbox"
                    checked={st.done}
                    onChange={() => toggleSubTask(taskId, st.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span
                    className={clsx(
                      "flex-1 text-sm",
                      st.done && "line-through text-slate-400",
                    )}
                  >
                    {st.title}
                  </span>
                  <button
                    onClick={() => deleteSubTask(taskId, st.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400 text-[16px] w-4 h-4 flex items-center justify-center">
                add
              </span>
              <input
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                onKeyDown={handleAddSubTask}
                placeholder="添加子任务"
                className="flex-1 text-sm border-none p-0 focus:ring-0 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>
        </div>

        <footer className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="text-xs text-slate-400">
            创建于 {new Date(task.createdAt).toLocaleDateString("zh-CN")}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              deleteTask(taskId);
              onClose();
            }}
          >
            删除任务
          </Button>
        </footer>
      </div>
    </div>
  );
};
