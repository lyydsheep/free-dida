import { TaskInput } from "@/components/TaskInput";
import { TaskItem } from "@/components/TaskItem";
import { useTaskDrag } from "@/hooks/useTaskDrag";
import { useTaskGrouping } from "@/hooks/useTaskGrouping";
import { useTaskStore } from "@/store/useTaskStore";
import {
    closestCenter,
    DndContext,
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
import { useCallback, useEffect, useMemo } from "react";
import { GroupedVirtuoso } from "react-virtuoso";

export function ListView() {
  const {
    tasks,
    cleanupCompletedTasks,
    searchQuery,
    groupBy,
    setSelectedTaskId,
  } = useTaskStore();

  // Memoize task click handler to prevent unnecessary re-renders of TaskItem
  const handleTaskClick = useCallback(
    (taskId: string) => {
      setSelectedTaskId(taskId);
    },
    [setSelectedTaskId],
  );

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

  const groupedTasks = useTaskGrouping(filteredTasks, groupBy);
  const { handleDragOver, handleDragEnd } = useTaskDrag({
    tasks,
    groupedTasks,
    groupBy,
  });

  const completedTasks = filteredTasks.filter((t) => t.status === "completed");
  const hasNoResults = filteredTasks.length === 0 && searchQuery.trim() !== "";

  const allTasks = useMemo(() => {
    return [...groupedTasks.flatMap((g) => g.tasks), ...completedTasks];
  }, [groupedTasks, completedTasks]);

  const groupCounts = useMemo(() => {
    const counts = groupedTasks.map((g) => g.tasks.length);
    if (completedTasks.length > 0) {
      counts.push(completedTasks.length);
    }
    return counts;
  }, [groupedTasks, completedTasks]);

  const groupTitles = useMemo(() => {
    const titles = groupedTasks.map((g) => g.title);
    if (completedTasks.length > 0) {
      titles.push("已完成");
    }
    return titles;
  }, [groupedTasks, completedTasks]);

  if (hasNoResults) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <span className="material-symbols-outlined text-[48px] text-slate-300 mb-3">
          search_off
        </span>
        <p className="text-slate-500 text-sm">
          未找到包含 "{searchQuery}" 的任务
        </p>
        <p className="text-slate-400 text-xs mt-1">请尝试其他关键词</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={allTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <GroupedVirtuoso
            style={{ height: "100%", flex: 1 }}
            className="custom-scrollbar pb-32"
            groupCounts={groupCounts}
            groupContent={(index) => (
              <div className="bg-white pt-6 pb-2 px-6">
                <header className="flex items-center justify-between">
                  <h2 className="text-[12px] font-semibold text-slate-400 uppercase tracking-[0.05em]">
                    {groupTitles[index]}
                  </h2>
                  <span className="text-[12px] text-slate-400 font-medium">
                    {groupCounts[index]}
                  </span>
                </header>
              </div>
            )}
            itemContent={(index) => {
              const task = allTasks[index];
              const isSortable = task.status !== "completed";
              return (
                <div className="px-6 py-0.5">
                  <TaskItem
                    key={task.id}
                    task={task}
                    onTaskClick={handleTaskClick}
                    isSortable={isSortable}
                  />
                </div>
              );
            }}
          />
        </SortableContext>
      </DndContext>
      <TaskInput />
    </>
  );
}
