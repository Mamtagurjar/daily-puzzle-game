import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { getAllActivity } from "../utils/activityDB";

const intensityMap = {
  0: "bg-gray-200",
  1: "bg-green-200",
  2: "bg-green-400",
  3: "bg-green-600",
  4: "bg-green-800",
};

function Heatmap() {
  const [activity, setActivity] = useState({});
  const [hoverData, setHoverData] = useState(null);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    const data = await getAllActivity();
    const map = {};
    data.forEach(item => {
      map[item.date] = item;
    });
    setActivity(map);
  };

  const days = useMemo(() => {
    const startOfYear = dayjs().startOf("year");
    const list = [];
    for (let i = 0; i < 365; i++) {
      list.push(startOfYear.add(i, "day"));
    }
    return list;
  }, []);

  const getIntensity = (date) => {
    const item = activity[date];
    if (!item || !item.solved) return 0;

    if (item.score >= 10) return 4;
    return 2;
  };

  return (
    <div className="mt-10">

      {/* Title */}
      <h2 className="text-xl font-bold mb-4 text-center">
        📊 Activity Heatmap
      </h2>

      {/* Grid */}
      <div className="grid grid-cols-53 gap-1 overflow-x-auto">

        {days.map((day, index) => {
          const dateStr = day.format("YYYY-MM-DD");
          const intensity = getIntensity(dateStr);

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 300 }}
              onMouseEnter={() =>
                setHoverData({
                  date: dateStr,
                  data: activity[dateStr],
                })
              }
              onMouseLeave={() => setHoverData(null)}
              className={`w-4 h-4 rounded-sm cursor-pointer ${intensityMap[intensity]}`}
            />
          );
        })}

      </div>

      {/* Tooltip */}
      {hoverData && (
        <div className="mt-4 text-center text-sm bg-black/40 p-2 rounded-lg">
          <p>{hoverData.date}</p>
          {hoverData.data?.solved ? (
            <>
              <p>Score: {hoverData.data.score}</p>
              <p>Time: {hoverData.data.timeTaken}s</p>
              <p>Difficulty: {hoverData.data.difficulty}</p>
            </>
          ) : (
            <p>Not Played</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center items-center gap-2 mt-4 text-sm">
        <span>Less</span>
        {Object.values(intensityMap).map((color, i) => (
          <div key={i} className={`w-4 h-4 ${color} rounded-sm`} />
        ))}
        <span>More</span>
      </div>

    </div>
  );
}

export default Heatmap;
