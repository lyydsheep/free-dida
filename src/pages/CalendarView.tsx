import { CalendarView as CalendarViewComponent } from "@/components/CalendarView";
import { useMainLayoutContext } from "@/layouts/MainLayout";
import { useTaskStore } from "@/store/useTaskStore";
import { useCallback, useMemo, useRef } from "react";

export function CalendarView() {
  const { tasks, searchQuery, setSelectedTaskId } = useTaskStore();
  const { calendarViewRef } = useMainLayoutContext();
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  const handleTaskClick = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId);
    },
    [setSelectedTaskId],
  );

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase().trim();
    return tasks.filter((task) => task.title.toLowerCase().includes(query));
  }, [tasks, searchQuery]);

  return (
    <CalendarViewComponent
      ref={calendarViewRef}
      onTaskClick={handleTaskClick}
      scrollRef={calendarScrollRef}
      tasks={filteredTasks}
    />
  );
}
