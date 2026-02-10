import BasePuzzle from "./BasePuzzle";

class MathPuzzle extends BasePuzzle {
  constructor() {
    const today = new Date().toISOString().split("T")[0];

    // simple seed from date
    let seed = 0;
    for (let i = 0; i < today.length; i++) {
      seed += today.charCodeAt(i);
    }

    const a = seed % 10;
    const b = (seed * 2) % 10;

    super(`What is ${a} + ${b}?`, (a + b).toString());
  }
}

export default MathPuzzle;
