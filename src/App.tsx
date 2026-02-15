import { CalendarView, CalendarViewHandle } from "@/components/CalendarView";
import { MatrixView } from "@/components/MatrixView";
import { TaskDetail } from "@/components/TaskDetail";
import { TaskInput } from "@/components/TaskInput";
import { TaskItem } from "@/components/TaskItem";
import { TaskSearch } from "@/components/TaskSearch";
import { useTaskStore } from "@/store/useTaskStore";
import { Task } from "@/types/todo";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import clsx from "clsx";
import { format, isToday, isTomorrow } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type GroupBy = "priority" | "date";
type View = "list" | "calendar" | "matrix";

function App() {
  const {
    tasks,
    reorderTasks,
    updateTask,
    moveTask,
    cleanupCompletedTasks,
    searchQuery,
  } = useTaskStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("priority");
  const [view, setView] = useState<View>("list");
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const calendarViewRef = useRef<CalendarViewHandle>(null);

  // Memoize task click handler to prevent unnecessary re-renders of TaskItem
  const handleTaskClick = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
  }, []);

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase().trim();
    return tasks.filter((task) => task.title.toLowerCase().includes(query));
  }, [tasks, searchQuery]);

  useEffect(() => {
    cleanupCompletedTasks();
  }, [cleanupCompletedTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    const todoTasks = filteredTasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress",
    );

    todoTasks.forEach((task) => {
      let key = "其他";
      const isTaskInProgress =
        task.status === "in_progress" ||
        (task.status === "todo" && task.isInProgress);

      if (isTaskInProgress) {
        key = "处理中";
      } else if (groupBy === "priority") {
        switch (task.priority) {
          case "p0":
            key = "紧急";
            break;
          case "p1":
            key = "高优先级";
            break;
          case "p2":
            key = "普通";
            break;
          default:
            key = "无优先级";
        }
      } else {
        if (task.dueDate) {
          const date = new Date(task.dueDate);
          if (isToday(date)) key = "今天";
          else if (isTomorrow(date)) key = "明天";
          else key = format(date, "MMM d");
        } else {
          key = "无日期";
        }
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "处理中") return -1;
      if (b === "处理中") return 1;

      if (groupBy === "priority") {
        const order = ["紧急", "高优先级", "普通", "无优先级"];
        return order.indexOf(a) - order.indexOf(b);
      } else {
        if (a === "今天") return -1;
        if (b === "今天") return 1;
        if (a === "明天") return -1;
        if (b === "明天") return 1;
        if (a === "无日期") return 1;
        if (b === "无日期") return -1;
        return 0;
      }
    });

    return sortedKeys.map((key) => ({ title: key, tasks: groups[key] }));
  }, [filteredTasks, groupBy]);

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask || !overTask) return;

    let updates: Partial<Task> | undefined;

    if (groupBy === "priority") {
      if (activeTask.priority !== overTask.priority) {
        updates = { priority: overTask.priority };
      }
    } else {
      if (activeTask.dueDate !== overTask.dueDate) {
        updates = { dueDate: overTask.dueDate };
      }
    }

    if (updates) {
      const currentVisualIds = groupedTasks.flatMap((g) =>
        g.tasks.map((t) => t.id),
      );
      const oldIndex = currentVisualIds.indexOf(activeId);
      const newIndex = currentVisualIds.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrderIds = [...currentVisualIds];
        newOrderIds.splice(oldIndex, 1);
        newOrderIds.splice(newIndex, 0, activeId);

        const completedTaskIds = tasks
          .filter((t) => t.status === "completed")
          .map((t) => t.id);

        const allNewOrderIds = [...newOrderIds, ...completedTaskIds];

        moveTask(activeId, allNewOrderIds, updates);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);

    if (!activeTask || !overTask) return;

    // Calculate new order
    const currentVisualIds = groupedTasks.flatMap((g) =>
      g.tasks.map((t) => t.id),
    );
    const oldIndex = currentVisualIds.indexOf(activeId);
    const newIndex = currentVisualIds.indexOf(overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrderIds = [...currentVisualIds];
      newOrderIds.splice(oldIndex, 1);
      newOrderIds.splice(newIndex, 0, activeId);

      const completedTaskIds = tasks
        .filter((t) => t.status === "completed")
        .map((t) => t.id);

      const allNewOrderIds = [...newOrderIds, ...completedTaskIds];

      // Handle property updates and reordering in a single action
      let updates: Partial<Task> | undefined;
      if (groupBy === "priority") {
        if (activeTask.priority !== overTask.priority) {
          updates = { priority: overTask.priority };
        }
      } else {
        if (activeTask.dueDate !== overTask.dueDate) {
          updates = { dueDate: overTask.dueDate };
        }
      }

      if (updates) {
        moveTask(activeId, allNewOrderIds, updates);
      } else {
        reorderTasks(allNewOrderIds);
      }
    }
  };

  const handleScrollToToday = () => {
    calendarViewRef.current?.scrollToToday();
  };

  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const hasNoResults = filteredTasks.length === 0 && searchQuery.trim() !== "";

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 sm:py-10 font-sans text-slate-900">
      <div className="w-full sm:max-w-[400px] bg-white flex flex-col relative h-[100dvh] sm:h-[800px] sm:rounded-[3rem] overflow-hidden shadow-2xl sm:border-[8px] border-slate-900">
        <header className="sticky top-0 z-30 px-6 pt-14 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-50">
          <div className="flex items-end justify-between mb-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {view === "list" ? "任务" : view === "calendar" ? "日历" : "矩阵"}
            </h1>
            <div className="flex items-center gap-2 mb-1">
              {view === "list" && (
                <button
                  onClick={() =>
                    setGroupBy((g) => (g === "priority" ? "date" : "priority"))
                  }
                  className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 transition-colors"
                >
                  {groupBy === "priority" ? "按日期分组" : "按优先级分组"}
                </button>
              )}
              {view === "calendar" && (
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

        <main className="flex-1 overflow-hidden flex flex-col relative bg-white">
          {hasNoResults ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">
                search_off
              </span>
              <p className="text-slate-500 text-sm">
                未找到包含 "{searchQuery}" 的任务
              </p>
              <p className="text-slate-400 text-xs mt-1">请尝试其他关键词</p>
            </div>
          ) : view === "list" ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-2 pb-32">
                {groupedTasks.map((group) => (
                  <section key={group.title} className="mt-6">
                    <header className="flex items-center justify-between mb-2">
                      <h2 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.05em]">
                        {group.title}
                      </h2>
                      <span className="text-[12px] text-slate-400 font-medium">
                        {group.tasks.length}
                      </span>
                    </header>
                    <SortableContext
                      items={group.tasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1">
                        {group.tasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onTaskClick={handleTaskClick}
                            isSortable
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </section>
                ))}

                {completedTasks.length > 0 && (
                  <section className="mt-8">
                    <header className="flex items-center justify-between mb-2">
                      <h2 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.05em]">
                        已完成
                      </h2>
                      <span className="text-[12px] text-slate-400 font-medium">
                        {completedTasks.length}
                      </span>
                    </header>
                    <div className="space-y-1">
                      {completedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onTaskClick={handleTaskClick}
                          isSortable={false}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </DndContext>
          ) : view === "calendar" ? (
            <CalendarView
              ref={calendarViewRef}
              onTaskClick={handleTaskClick}
              scrollRef={calendarScrollRef}
              tasks={filteredTasks}
            />
          ) : (
            <MatrixView onTaskClick={handleTaskClick} tasks={filteredTasks} />
          )}
        </main>

        {view === "list" && <TaskInput />}

        <nav className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-8 pt-3 pb-8 flex items-center justify-between z-30">
          <button
            onClick={() => setView("list")}
            className={clsx(
              "nav-item flex flex-col items-center gap-1 transition-colors",
              view === "list"
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
            onClick={() => setView("calendar")}
            className={clsx(
              "nav-item flex flex-col items-center gap-1 transition-colors",
              view === "calendar"
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
            onClick={() => setView("matrix")}
            className={clsx(
              "nav-item flex flex-col items-center gap-1 transition-colors",
              view === "matrix"
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

export default App;
