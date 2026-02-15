import { MatrixView as MatrixViewComponent } from "@/components/MatrixView";
import { useTaskStore } from "@/store/useTaskStore";
import { useCallback, useMemo } from "react";

export function MatrixView() {
  const { tasks, searchQuery, setSelectedTaskId } = useTaskStore();

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
    <MatrixViewComponent onTaskClick={handleTaskClick} tasks={filteredTasks} />
  );
}
