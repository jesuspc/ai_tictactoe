import * as NN from "./neuralNetwork";
import * as BoardM from "./board";

// import { runOne } from "./src/run";
// runOne()
export const runOne = () => {
  const board = BoardM.mkEmpty();
  const model = NN.mkModel(BoardM.dim(board).rows);

  const newBoard = NN.move(model, board, 1);
};
