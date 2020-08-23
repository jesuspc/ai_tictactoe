import * as tf from "@tensorflow/tfjs-node";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/pipeable";
import { Board } from "../board";
import { Score, Move } from "../game";
import * as BoardM from "../board";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";

type Targets = Array<Score>;
export type Model = tf.Sequential;

export type Error = "training_error";

export const mkModel = ({
  boardDimension
}: {
  boardDimension: number;
}): Model => {
  const model = tf.sequential({
    layers: [
      // Receives the binary-encoded representation of each cell
      tf.layers.dense({
        inputShape: [boardDimension ** 2 * 3],
        units: boardDimension ** 2 * 9 * 3,
        activation: "relu"
      }),
      // Returns the Q-value of each cell
      tf.layers.dense({
        units: boardDimension ** 2,
        activation: null
      })
    ]
  });

  model.compile({
    optimizer: "sgd",
    loss: "meanSquaredError",
    metrics: ["accuracy"]
  });

  return model;
};

export const train = (
  xs: Array<{ board: Board; targets: Targets }>,
  model: Model
): TaskEither<Error, Model> => {
  const inputs = tf.tensor(
    pipe(
      xs,
      A.map(({ board }) => BoardM.toBinaryArray(board))
    )
  );

  const targets = tf.tensor(
    pipe(
      xs,
      A.map(({ targets }) => targets)
    )
  );

  return TE.tryCatch(
    () =>
      model
        .fit(inputs, targets, {
          shuffle: true,
          epochs: 20,
          verbose: 0,
          callbacks: {
            onEpochEnd: (_epoch, _logs) => {
              // console.log("Epoch " + epoch);
              // console.log("Loss: " + logs.loss + " accuracy: " + logs.acc);
            }
          }
        })
        .then(() => model),
    err => {
      console.log("[ERROR] Training error", err);
      return "training_error";
    }
  );
};

export const qValues = (model: Model, b: Board): Array<Score> => {
  const xs = tf.tensor([BoardM.toBinaryArray(b)]);
  const predRaw = model.predict(xs);
  const pred = Array.isArray(predRaw) ? predRaw[0] : predRaw;

  return Array.from(pred.dataSync());
};

export const move = (model: Model) => (
  board: Board,
  player: 1 | -1
): { move: Move; scores: Array<Score> } => {
  const dim = BoardM.dim(board).rows;

  const xs = qValues(model, board);
  const [probIdx, pred] = pipe(
    A.zipWith(xs, BoardM.toArray(board), (prob, real) =>
      real === 0 ? prob : -1
    ),
    A.reduceWithIndex([0, -1], (i, acc, v) => (v > acc[1] ? [i, v] : acc))
  );

  return {
    move: {
      score: pred,
      idx: probIdx,
      player,
      pos: BoardM.posFromArray(dim, probIdx)
    },
    scores: xs
  };
};
