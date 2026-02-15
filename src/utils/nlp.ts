import { TaskPriority } from "@/types/todo";
import { addDays, Day, nextDay, startOfToday, startOfTomorrow } from "date-fns";

interface ParsedTask {
  title: string;
  priority?: TaskPriority;
  dueDate?: number;
}

const PRIORITY_REGEX = /!(p[0-2])/i;

const WEEK_DAYS: { [key: string]: Day } = {
  周日: 0,
  星期日: 0,
  周一: 1,
  星期一: 1,
  周二: 2,
  星期二: 2,
  周三: 3,
  星期三: 3,
  周四: 4,
  星期四: 4,
  周五: 5,
  星期五: 5,
  周六: 6,
  星期六: 6,
};

export const parseTaskInput = (input: string): ParsedTask => {
  let title = input;
  let priority: TaskPriority | undefined;
  let dueDate: number | undefined;

  // Parse Priority (!p0, !p1, !p2)
  const priorityMatch = title.match(PRIORITY_REGEX);
  if (priorityMatch) {
    priority = priorityMatch[1].toLowerCase() as TaskPriority;
    title = title.replace(priorityMatch[0], "").trim();
  }

  // Parse Date (明天, 后天, 周一...周日)
  // 简单的中文日期解析
  const today = startOfToday();

  if (title.includes("明天")) {
    dueDate = startOfTomorrow().getTime();
    title = title.replace("明天", "").trim();
  } else if (title.includes("后天")) {
    dueDate = addDays(today, 2).getTime();
    title = title.replace("后天", "").trim();
  } else if (title.includes("今天")) {
    dueDate = today.getTime();
    title = title.replace("今天", "").trim();
  } else {
    // 周X 解析
    for (const [key, val] of Object.entries(WEEK_DAYS)) {
      if (title.includes(key)) {
        dueDate = nextDay(today, val).getTime();
        title = title.replace(key, "").trim();
        break;
      }
    }
  }

  return { title, priority, dueDate };
};
