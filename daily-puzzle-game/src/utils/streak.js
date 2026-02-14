import dayjs from "dayjs";

export const calculateStreak = (activityList) => {
  const activityMap = {};

  activityList.forEach((entry) => {
    activityMap[entry.date] = entry;
  });

  let streak = 0;
  let current = dayjs();

  while (activityMap[current.format("YYYY-MM-DD")]?.solved) {
    streak++;
    current = current.subtract(1, "day");
  }

  return streak;
};
