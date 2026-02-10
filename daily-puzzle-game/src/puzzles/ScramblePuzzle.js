import BasePuzzle from "./BasePuzzle";

class ScramblePuzzle extends BasePuzzle {
  constructor() {
    const puzzles = [
      { q: "Unscramble: TCAER", a: "REACT" },
      { q: "Unscramble: AVAJ", a: "JAVA" },
      { q: "Unscramble: TPIRCSAVAJ", a: "JAVASCRIPT" },
    ];

    const today = new Date().toISOString().split("T")[0];
    const seed = today.charCodeAt(4) + today.charCodeAt(8);

    const selected = puzzles[seed % puzzles.length];

    super(selected.q, selected.a);
  }
}

export default ScramblePuzzle;
