import * as NN from "./neuralNetwork";
import * as BoardM from "./board";
import * as GameM from "./game";
import { GameHistory } from "./game";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/pipeable";

// import { runOne } from "./src/run";
// runOne()
export const runOne = () => {
  const board = BoardM.mkEmpty();
  const model = NN.mkModel(BoardM.dim(board).rows);

  const game = GameM.runGame(BoardM.mkEmpty(), 1, {
    p1: NN.move(model),
    p2: NN.move(model)
  });

  const p1h = pipe(
    game.history,
    A.filter(e => e.move.player === 1)
  );

  const p2h = pipe(
    game.history,
    A.filter(e => e.move.player === 1)
  );

  const p1 = pipe(p1h, A.zip([...p1h.slice(1)]));
};

// Pick a single elm from the history, and the score + total probs from the one after
// amend the one that was chosen
const trainData = ({
  winValue = 1,
  drawValue = 0,
  lossValue = -1,
  discount = 0.95
}) => (xs: GameHistory, finalScore: number) => {
  const targets = [
    ...pipe(
      xs.slice(1),
      A.map(e => e.move.score)
    ),
    finalScore
  ];

  const inputs = pipe(
    xs,
    A.map(b => b.board)
  );
};
