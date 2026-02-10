import BasePuzzle from "./BasePuzzle";

class LogicPuzzle extends BasePuzzle {
  constructor() {
    const puzzles = [
      { q: "A farmer has 17 sheep. All but 9 die. How many left?", a: "9" },
      { q: "If you drop a red stone in blue sea, what happens?", a: "It gets wet" },
    ];

    const today = new Date().toISOString().split("T")[0];
    const seed = today.charCodeAt(3) + today.charCodeAt(7);

    const selected = puzzles[seed % puzzles.length];

    super(selected.q, selected.a);
  }
}

export default LogicPuzzle;
