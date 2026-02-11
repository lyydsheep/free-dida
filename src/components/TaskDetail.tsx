import { useTaskStore } from "@/store/useTaskStore";
import { TaskPriority } from "@/types/todo";
import clsx from "clsx";
import React, { useEffect, useState } from "react";

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ taskId, onClose }) => {
  const {
    tasks,
    updateTask,
    addSubTask,
    toggleSubTask,
    deleteSubTask,
    deleteTask,
    toggleTaskStatus,
  } = useTaskStore();
  const task = tasks.find((t) => t.id === taskId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    updateTask(taskId, { title, description });
  };

  const handleAddSubTask = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSubTaskTitle.trim()) {
      addSubTask(taskId, newSubTaskTitle.trim());
      setNewSubTaskTitle("");
    }
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
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.status === "completed"}
              onChange={() => toggleTaskStatus(taskId)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-500">标记为已完成</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-2xl font-semibold border-none p-0 focus:ring-0 placeholder:text-slate-300 outline-none"
              placeholder="任务标题"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              className="w-full min-h-[100px] text-sm text-slate-700 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              placeholder="添加详情..."
            />
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
              <span className="material-symbols-outlined text-slate-400 text-[20px]">
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
          <button
            onClick={() => {
              deleteTask(taskId);
              onClose();
            }}
            className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            删除任务
          </button>
        </footer>
      </div>
    </div>
  );
};
