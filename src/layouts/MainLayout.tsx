import { CalendarViewHandle } from "@/components/CalendarView";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskSearch } from "@/components/TaskSearch";
import { useTaskStore } from "@/store/useTaskStore";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import {
    Outlet,
    useLocation,
    useNavigate,
    useOutletContext,
} from "react-router-dom";

export type MainLayoutContextType = {
  calendarViewRef: React.RefObject<CalendarViewHandle>;
};

export function useMainLayoutContext() {
  return useOutletContext<MainLayoutContextType>();
}

export function MainLayout() {
  const {
    searchQuery,
    selectedTaskId,
    setSelectedTaskId,
    groupBy,
    setGroupBy,
    loadTasks, // Add loadTasks
  } = useTaskStore();

  const location = useLocation();
  const navigate = useNavigate();
  const calendarViewRef = useRef<CalendarViewHandle>(null);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const isListView = location.pathname === "/" || location.pathname === "/list";
  const isCalendarView = location.pathname === "/calendar";
  const isMatrixView = location.pathname === "/matrix";

  const handleScrollToToday = () => {
    calendarViewRef.current?.scrollToToday();
  };

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 sm:py-10 font-sans text-slate-900">
      <div className="w-full sm:max-w-[400px] bg-white flex flex-col relative h-[100dvh] sm:h-[800px] sm:rounded-[3rem] overflow-hidden shadow-2xl sm:border-[8px] border-slate-900">
        <header className="sticky top-0 z-30 px-6 pt-14 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-50">
          <div className="flex items-end justify-between mb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {isListView ? "任务" : isCalendarView ? "日历" : "矩阵"}
            </h1>
            <div className="flex items-center gap-2 mb-1">
              {isListView && (
                <button
                  onClick={() =>
                    setGroupBy(groupBy === "priority" ? "date" : "priority")
                  }
                  className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  {groupBy === "priority" ? "按日期分组" : "按优先级分组"}
                </button>
              )}
              {isCalendarView && (
                <button
                  onClick={handleScrollToToday}
                  className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                >
                  返回今日
                </button>
              )}
            </div>
          </div>
          <TaskSearch />
        </header>

        <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative bg-white pb-[84px]">
          <Outlet context={{ calendarViewRef }} />
        </main>

        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 pt-3 pb-8 flex items-center justify-between z-30">
          <button
            onClick={() => navigate("/")}
            className={clsx(
              "nav-item flex flex-col items-center gap-1 transition-colors",
              isListView
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <span className="material-symbols-outlined text-[26px]">
              format_list_bulleted
            </span>
            <span className="text-[10px] font-medium">列表</span>
          </button>
          <button
            onClick={() => navigate("/calendar")}
            className={clsx(
              "nav-item flex flex-col items-center gap-1 transition-colors",
              isCalendarView
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <span className="material-symbols-outlined text-[26px]">
              calendar_today
            </span>
            <span className="text-[10px] font-medium">日历</span>
          </button>
          <button
            onClick={() => navigate("/matrix")}
            className={clsx(
              "nav-item flex flex-col items-center gap-1 transition-colors",
              isMatrixView
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <span className="material-symbols-outlined text-[26px]">
              grid_view
            </span>
            <span className="text-[10px] font-medium">矩阵</span>
          </button>
        </nav>

        {selectedTaskId && (
          <TaskDetail
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </div>
    </div>
  );
}
