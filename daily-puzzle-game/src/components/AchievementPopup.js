import { motion } from "framer-motion";

const achievementMap = {
  "7_DAY_STREAK": "🔥 7 Day Streak!",
  "30_DAY_STREAK": "💎 30 Day Streak!",
  "100_COMPLETED": "🏆 100 Puzzles Completed!",
  "PERFECT_MONTH": "🌟 Perfect Month!"
};

function AchievementPopup({ achievement, onClose }) {
  if (!achievement) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-5 bg-yellow-400 text-black px-6 py-3 rounded-xl shadow-xl font-bold z-50"
    >
      {achievementMap[achievement]}
      <button
        onClick={onClose}
        className="ml-4 text-sm font-normal"
      >
        ✖
      </button>
    </motion.div>
  );
}

export default AchievementPopup;
