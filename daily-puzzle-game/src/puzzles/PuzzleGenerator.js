import EmojiPuzzle from "./EmojiPuzzle";
import CodePuzzle from "./CodePuzzle";
import LogicPuzzle from "./LogicPuzzle";
import ScramblePuzzle from "./ScramblePuzzle";
import PatternPuzzle from "./PatternPuzzle";

const puzzleTypes = [
  EmojiPuzzle,
  CodePuzzle,
  LogicPuzzle,
  ScramblePuzzle,
  PatternPuzzle,
];

export function getDailyPuzzle() {
  const today = new Date().toISOString().split("T")[0];

  let seed = 0;
  for (let i = 0; i < today.length; i++) {
    seed += today.charCodeAt(i);
  }

  const index = seed % puzzleTypes.length;
  const SelectedPuzzle = puzzleTypes[index];

  return new SelectedPuzzle();
}
