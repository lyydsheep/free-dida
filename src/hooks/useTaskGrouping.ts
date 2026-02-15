import { Task } from "@/types/todo";
import { format, isToday, isTomorrow } from "date-fns";
import { useMemo } from "react";

type GroupBy = "priority" | "date";

export function useTaskGrouping(tasks: Task[], groupBy: GroupBy) {
  return useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    const todoTasks = tasks.filter(
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
  }, [tasks, groupBy]);
}
