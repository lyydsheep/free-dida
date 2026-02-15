import { useTaskStore } from "@/store/useTaskStore";
import { Task } from "@/types/todo";
import { DragEndEvent, DragOverEvent } from "@dnd-kit/core";

type GroupBy = "priority" | "date";

interface UseTaskDragProps {
  tasks: Task[];
  groupedTasks: { title: string; tasks: Task[] }[];
  groupBy: GroupBy;
}

export function useTaskDrag({
  tasks,
  groupedTasks,
  groupBy,
}: UseTaskDragProps) {
  const { moveTask, reorderTasks } = useTaskStore();

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

  return { handleDragOver, handleDragEnd };
}
