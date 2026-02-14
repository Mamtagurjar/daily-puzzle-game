import dayjs from "dayjs";

export const evaluateAchievements = (activityList) => {
  const achievements = [];

  const sorted = [...activityList]
    .filter(a => a.solved)
    .sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix());

  const totalCompleted = sorted.length;

  // 🔥 7 Day Streak
  if (calculateStreak(sorted) >= 7) {
    achievements.push("7_DAY_STREAK");
  }

  // 🔥 30 Day Streak
  if (calculateStreak(sorted) >= 30) {
    achievements.push("30_DAY_STREAK");
  }

  // 🔥 100 Total Completions
  if (totalCompleted >= 100) {
    achievements.push("100_COMPLETED");
  }

  // 🔥 Perfect Month
  const currentMonth = dayjs().format("YYYY-MM");
  const monthEntries = sorted.filter(a =>
    a.date.startsWith(currentMonth)
  );

  const daysInMonth = dayjs().daysInMonth();

  if (monthEntries.length === daysInMonth) {
    achievements.push("PERFECT_MONTH");
  }

  return achievements;
};

// Simple streak helper
const calculateStreak = (list) => {
  let streak = 0;
  let current = dayjs();

  const map = {};
  list.forEach(a => {
    map[a.date] = true;
  });

  while (map[current.format("YYYY-MM-DD")]) {
    streak++;
    current = current.subtract(1, "day");
  }

  return streak;
};
