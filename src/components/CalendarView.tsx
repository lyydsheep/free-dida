import { useTaskStore } from "@/store/useTaskStore";
import { addDays, format, isToday, startOfToday, subDays } from "date-fns";
import React, { RefObject, useEffect } from "react";
import { TaskItem } from "./TaskItem";

interface CalendarViewProps {
  onTaskClick: (taskId: string) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onTaskClick,
  scrollRef,
}) => {
  const { tasks, addTask, updateTask } = useTaskStore();

  // 生成日期范围：过去 7 天 + 未来 14 天
  const today = startOfToday();
  const days = Array.from({ length: 21 }, (_, i) =>
    addDays(subDays(today, 7), i),
  );

  useEffect(() => {
    // 组件挂载时滚动到今天
    if (scrollRef.current) {
      const todayEl = scrollRef.current.querySelector('[data-is-today="true"]');
      if (todayEl) {
        todayEl.scrollIntoView({ inline: "center", behavior: "auto" });
      }
    }
  }, []);

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear() &&
        task.status !== "completed"
      );
    });
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTask(taskId, { dueDate: date.getTime() });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar snap-x snap-mandatory bg-gray-50/50"
      ref={scrollRef}
    >
      <div className="flex h-full">
        {days.map((date) => {
          const dayTasks = getTasksForDate(date);
          const isDayToday = isToday(date);

          return (
            <div
              key={date.toISOString()}
              className="min-w-[85vw] sm:min-w-[300px] h-full border-r border-slate-100 p-4 snap-center flex flex-col bg-white first:border-l transition-colors hover:bg-slate-50/50"
              data-is-today={isDayToday}
              onDrop={(e) => handleDrop(e, date)}
              onDragOver={handleDragOver}
            >
              <header className="mb-4 flex items-center justify-between">
                <h3
                  className={`text-lg font-semibold ${isDayToday ? "text-blue-600" : "text-slate-800"}`}
                >
                  {format(date, "EEE, MMM d")}
                </h3>
                {isDayToday && (
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    今天
                  </span>
                )}
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pb-20">
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                    isSortable={false}
                  />
                ))}

                {dayTasks.length === 0 && (
                  <div className="h-32 flex items-center justify-center text-slate-300 text-sm italic pointer-events-none">
                    暂无任务
                  </div>
                )}
              </div>

              <button
                onClick={() => addTask({ dueDate: date.getTime() })}
                className="mt-auto w-full py-3 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
                  add
                </span>
                添加任务
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
