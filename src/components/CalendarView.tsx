import { useTaskStore } from "@/store/useTaskStore";
import { Task } from "@/types/todo";
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfToday,
  subDays,
} from "date-fns";
import React, {
  forwardRef,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { TaskItem } from "./TaskItem";

interface CalendarViewProps {
  onTaskClick: (taskId: string) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  tasks?: Task[];
}

export interface CalendarViewHandle {
  scrollToToday: () => void;
}

// 每次加载的天数
const LOAD_BATCH_SIZE = 7;
// 初始加载范围：过去3天 + 未来30天
const INITIAL_PAST_DAYS = 3;
const INITIAL_FUTURE_DAYS = 30;
// 虚拟化缓冲区：额外渲染的天数（超出视口的缓冲）
const VIRTUAL_BUFFER_DAYS = 2;
// 触发重新计算可见区域的滚动阈值（像素）
const SCROLL_THRESHOLD = 100;

export const CalendarView = forwardRef<CalendarViewHandle, CalendarViewProps>(
  ({ onTaskClick, scrollRef, tasks: propTasks }, ref) => {
    const { tasks: storeTasks, addTask, updateTask } = useTaskStore();
    const tasks = propTasks ?? storeTasks;

    // 预计算任务分组，避免在渲染循环中过滤
    const tasksByDate = useMemo(() => {
      const map = new Map<string, Task[]>();
      tasks.forEach((task) => {
        if (!task.dueDate || task.status === "completed") return;
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
      });
      return map;
    }, [tasks]);

    const getTasksForDate = useCallback(
      (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return tasksByDate.get(dateKey) || [];
      },
      [tasksByDate],
    );

    // 日期范围状态
    const [startDate, setStartDate] = useState<Date>(() =>
      subDays(startOfToday(), INITIAL_PAST_DAYS),
    );
    const [endDate, setEndDate] = useState<Date>(() =>
      addDays(startOfToday(), INITIAL_FUTURE_DAYS),
    );

    // 可见日期范围（虚拟化）
    const [visibleStartIndex, setVisibleStartIndex] = useState(0);
    const [visibleEndIndex, setVisibleEndIndex] = useState(
      INITIAL_PAST_DAYS + INITIAL_FUTURE_DAYS + 1,
    );

    // 引用
    const containerRef = useRef<HTMLDivElement>(null);
    const leftSentinelRef = useRef<HTMLDivElement>(null);
    const rightSentinelRef = useRef<HTMLDivElement>(null);
    const isLoadingRef = useRef(false);
    const dayColumnWidthRef = useRef(0);
    const lastScrollLeftRef = useRef(0);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      scrollToToday: () => {
        const today = startOfToday();
        const todayIndex = allDates.findIndex((d) => isSameDay(d, today));

        if (todayIndex !== -1 && scrollRef.current) {
          // 1. 强制更新可见范围以包含今天
          const startIdx = Math.max(0, todayIndex - 2);
          const endIdx = Math.min(allDates.length - 1, todayIndex + 2);

          setVisibleStartIndex(startIdx);
          setVisibleEndIndex(endIdx);

          // 2. 等待 DOM 更新后滚动
          requestAnimationFrame(() => {
            if (!scrollRef.current) return;

            // 临时禁用 snap 以避免干扰
            const style = scrollRef.current.style;
            const originalSnapType = style.scrollSnapType;
            style.scrollSnapType = "none";

            // 重新计算尺寸，确保准确
            const isMobile = window.innerWidth < 640;
            const colWidth = isMobile ? window.innerWidth * 0.85 : 300;
            const containerWidth = scrollRef.current.clientWidth;
            const sentinelWidth = 16; // w-4 = 16px

            // 计算目标位置：居中
            const elementLeft = sentinelWidth + todayIndex * colWidth;
            const targetScrollLeft =
              elementLeft - containerWidth / 2 + colWidth / 2;

            // 立即滚动
            scrollRef.current.scrollTo({
              left: Math.max(0, targetScrollLeft),
              behavior: "auto",
            });

            // 恢复 snap
            setTimeout(() => {
              if (scrollRef.current) {
                style.scrollSnapType = originalSnapType;
              }
            }, 50);
          });
        }
      },
    }));

    // 监听窗口大小变化以更新列宽
    useEffect(() => {
      const updateColumnWidth = () => {
        const isMobile = window.innerWidth < 640; // sm breakpoint
        dayColumnWidthRef.current = isMobile ? window.innerWidth * 0.85 : 300;
        // 强制更新一次可见范围
        updateVisibleRange();
      };

      updateColumnWidth();
      window.addEventListener("resize", updateColumnWidth);
      return () => window.removeEventListener("resize", updateColumnWidth);
    }, []);

    // 生成所有日期
    const allDates = useMemo(() => {
      const days: Date[] = [];
      const totalDays =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      for (let i = 0; i < totalDays; i++) {
        days.push(addDays(startDate, i));
      }
      return days;
    }, [startDate, endDate]);

    // 计算可见日期（虚拟化）
    const visibleDates = useMemo(() => {
      return allDates.slice(visibleStartIndex, visibleEndIndex + 1);
    }, [allDates, visibleStartIndex, visibleEndIndex]);

    // 虚拟化：根据滚动位置计算可见日期范围
    const updateVisibleRange = useCallback(() => {
      if (!containerRef.current || !scrollRef.current) return;

      const scrollContainer = scrollRef.current;
      const scrollLeft = scrollContainer.scrollLeft;
      const containerWidth = scrollContainer.clientWidth;

      // 如果滚动距离小于阈值，不重新计算
      if (Math.abs(scrollLeft - lastScrollLeftRef.current) < SCROLL_THRESHOLD) {
        return;
      }
      lastScrollLeftRef.current = scrollLeft;

      // 使用预计算的列宽，如果未初始化则回退到估算值
      const colWidth = dayColumnWidthRef.current || 300;

      // 计算可见范围索引
      const startIndex = Math.max(
        0,
        Math.floor(scrollLeft / colWidth) - VIRTUAL_BUFFER_DAYS,
      );
      const endIndex = Math.min(
        allDates.length - 1,
        Math.ceil((scrollLeft + containerWidth) / colWidth) +
          VIRTUAL_BUFFER_DAYS,
      );

      setVisibleStartIndex(startIndex);
      setVisibleEndIndex(endIndex);
    }, [allDates.length, scrollRef]);

    // 加载更多历史日期
    const loadMorePast = useCallback(() => {
      if (isLoadingRef.current) return;

      // 限制范围：不能早于今天前3天
      const limitDate = subDays(startOfToday(), INITIAL_PAST_DAYS);
      if (startDate <= limitDate) return;

      isLoadingRef.current = true;

      setStartDate((prev) => {
        const newStart = subDays(prev, LOAD_BATCH_SIZE);
        // 调整可见起始索引，因为我们在前面添加了日期
        setVisibleStartIndex((idx) => idx + LOAD_BATCH_SIZE);
        return newStart;
      });

      // 短暂延迟后重置加载状态
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }, []);

    // 加载更多未来日期
    const loadMoreFuture = useCallback(() => {
      if (isLoadingRef.current) return;

      // 限制范围：不能晚于今天后30天
      const limitDate = addDays(startOfToday(), INITIAL_FUTURE_DAYS);
      if (endDate >= limitDate) return;

      isLoadingRef.current = true;

      setEndDate((prev) => addDays(prev, LOAD_BATCH_SIZE));

      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }, []);

    // 使用 IntersectionObserver 检测边界
    useEffect(() => {
      if (
        !leftSentinelRef.current ||
        !rightSentinelRef.current ||
        !scrollRef.current
      )
        return;

      const options = {
        root: scrollRef.current,
        rootMargin: "100px",
        threshold: 0,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === leftSentinelRef.current) {
              loadMorePast();
            } else if (entry.target === rightSentinelRef.current) {
              loadMoreFuture();
            }
          }
        });
      }, options);

      observer.observe(leftSentinelRef.current);
      observer.observe(rightSentinelRef.current);

      return () => observer.disconnect();
    }, [loadMorePast, loadMoreFuture, scrollRef]);

    // 监听滚动事件以更新可见范围（节流）
    useEffect(() => {
      const scrollContainer = scrollRef.current;
      if (!scrollContainer) return;

      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            updateVisibleRange();
            ticking = false;
          });
          ticking = true;
        }
      };

      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, [updateVisibleRange, scrollRef]);

    // 初始化时滚动到今天并设置初始可见范围
    useEffect(() => {
      if (scrollRef.current) {
        const today = startOfToday();
        const todayIndex = allDates.findIndex((d) => isSameDay(d, today));

        if (todayIndex !== -1) {
          // 设置可见范围包含今天
          const startIdx = Math.max(0, todayIndex - VIRTUAL_BUFFER_DAYS - 3);
          const endIdx = Math.min(
            allDates.length - 1,
            todayIndex + VIRTUAL_BUFFER_DAYS + 3,
          );
          setVisibleStartIndex(startIdx);
          setVisibleEndIndex(endIdx);

          // 滚动到今天
          const todayEl = scrollRef.current.querySelector(
            '[data-is-today="true"]',
          );
          if (todayEl) {
            todayEl.scrollIntoView({ inline: "center", behavior: "auto" });
          }
        }
      }
    }, []); // 只在挂载时执行

    // 当日期范围变化时，重新计算可见范围
    useEffect(() => {
      if (scrollRef.current && allDates.length > 0) {
        updateVisibleRange();
      }
    }, [allDates.length, updateVisibleRange, scrollRef]);

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

    // 计算左右占位符宽度
    const leftPlaceholderWidth = useMemo(() => {
      return visibleStartIndex * (dayColumnWidthRef.current || 300);
    }, [visibleStartIndex]);

    const rightPlaceholderWidth = useMemo(() => {
      const remainingCols = allDates.length - visibleEndIndex - 1;
      return Math.max(0, remainingCols * (dayColumnWidthRef.current || 300));
    }, [allDates.length, visibleEndIndex]);

    return (
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar snap-x snap-mandatory bg-gray-50/50"
        ref={scrollRef as React.RefObject<HTMLDivElement>}
      >
        <div className="flex h-full" ref={containerRef}>
          {/* 左边界触发器 */}
          <div
            ref={leftSentinelRef}
            className="flex-shrink-0 w-4 h-full"
            aria-hidden="true"
          />

          {/* 左占位符（虚拟化） */}
          {visibleStartIndex > 0 && (
            <div
              className="flex-shrink-0 h-full"
              style={{ width: `${leftPlaceholderWidth}px` }}
              aria-hidden="true"
            />
          )}

          {/* 可见日期列 */}
          {visibleDates.map((date) => {
            const dayTasks = getTasksForDate(date);
            const isDayToday = isToday(date);
            const actualIndex = allDates.findIndex((d) => isSameDay(d, date));

            return (
              <div
                key={date.toISOString()}
                className="min-w-[85vw] sm:min-w-[300px] h-full border-r border-slate-100 p-4 snap-center flex flex-col bg-white first:border-l transition-colors hover:bg-slate-50/50"
                data-is-today={isDayToday}
                data-date-index={actualIndex}
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
                      onTaskClick={onTaskClick}
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

          {/* 右占位符（虚拟化） */}
          {visibleEndIndex < allDates.length - 1 && (
            <div
              className="flex-shrink-0 h-full"
              style={{ width: `${rightPlaceholderWidth}px` }}
              aria-hidden="true"
            />
          )}

          {/* 右边界触发器 */}
          <div
            ref={rightSentinelRef}
            className="flex-shrink-0 w-4 h-full"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  },
);
