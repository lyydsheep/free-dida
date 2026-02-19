import { useTaskStore } from "@/store/useTaskStore";
import { parseTaskInput } from "@/utils/nlp";
import React, { useState } from "react";

export const TaskInput: React.FC = () => {
  const { addTask } = useTaskStore();
  const [title, setTitle] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim()) {
      const parsed = parseTaskInput(title.trim());
      addTask(parsed);
      setTitle("");
    }
  };

  return (
    <div>
      <div className="flex items-center bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        <span className="material-symbols-outlined text-slate-400 mr-2">
          add
        </span>
        <input
          className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] py-3 placeholder:text-slate-400 font-normal outline-none"
          placeholder="添加任务... (例如: 买牛奶 !p1 明天)"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
