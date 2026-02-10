class BasePuzzle {
  constructor(question, solution) {
    this.question = question;
    this.solution = solution;
  }

  validate(answer) {
    return answer.trim().toLowerCase() === 
           this.solution.toLowerCase();
  }
}

export default BasePuzzle;
