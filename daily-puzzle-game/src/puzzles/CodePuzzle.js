import BasePuzzle from "./BasePuzzle";

class CodePuzzle extends BasePuzzle {
  constructor() {
    const puzzles = [
      { q: 'What is output? console.log(2 + "2")', a: "22" },
      { q: "What is output? [1,2,3].length", a: "3" },
      { q: "What is typeof null?", a: "object" },
    ];

    const today = new Date().toISOString().split("T")[0];
    const seed = today.charCodeAt(2) + today.charCodeAt(6);

    const selected = puzzles[seed % puzzles.length];

    super(selected.q, selected.a);
  }
}

export default CodePuzzle;
