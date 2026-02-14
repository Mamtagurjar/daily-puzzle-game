import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { getAllActivity } from "../utils/activityDB";

const intensityMap = {
  0: "bg-gray-300",
  1: "bg-green-200",
  2: "bg-green-400",
  3: "bg-green-600",
  4: "bg-green-800"
};

function Heatmap() {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    const data = await getAllActivity();
    setActivity(data);
  };

  const activityMap = useMemo(() => {
    const map = {};
    activity.forEach(item => {
      map[item.date] = item;
    });
    return map;
  }, [activity]);

  const days = useMemo(() => {
    const start = dayjs().startOf("year");
    const totalDays = dayjs().isLeapYear() ? 366 : 365;

    const arr = [];
    for (let i = 0; i < totalDays; i++) {
      arr.push(start.add(i, "day"));
    }
    return arr;
  }, []);

  const getIntensity = (date) => {
    const formatted = date.format("YYYY-MM-DD");
    const entry = activityMap[formatted];

    if (!entry || !entry.solved) return 0;

    if (entry.score >= 10 && entry.timeTaken < 15) return 4;
    if (entry.score >= 10 && entry.timeTaken < 30) return 3;
    if (entry.score >= 10) return 2;
    return 1;
  };

  // Group by week
  const weeks = [];
  days.forEach((day) => {
    const weekIndex = Math.floor(day.diff(days[0], "day") / 7);
    if (!weeks[weekIndex]) weeks[weekIndex] = [];
    weeks[weekIndex].push(day);
  });

  return (
    <div className="mt-10 w-full max-w-5xl">
      <h2 className="text-xl font-bold mb-4 text-center">
        📊 Activity Heatmap
      </h2>

      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((day, dayIndex) => {
              const intensity = getIntensity(day);

              return (
                <div
                  key={dayIndex}
                  title={day.format("YYYY-MM-DD")}
                  className={`w-4 h-4 rounded-sm ${intensityMap[intensity]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Heatmap;
