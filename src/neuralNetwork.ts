import * as tf from "@tensorflow/tfjs-node";
import * as A from "fp-ts/lib/Array";
import { pipe } from "fp-ts/lib/pipeable";
import { Board } from "./board";
import { Move } from "./game";
import * as BoardM from "./board";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";

type Targets = Array<number>;
export type Model = tf.Sequential;

export type Error = "training_error";

export const mkModel = (boardDim: number): Model => {
  const model = tf.sequential({
    layers: [
      // Receives the binary-encoded representation of each cell
      tf.layers.dense({
        inputShape: [boardDim ** 2 * 3],
        units: boardDim ** 2 * 9,
        activation: "relu"
      }),
      // Returns the Q-value of each cell
      tf.layers.dense({ units: boardDim ** 2, activation: "softmax" })
    ]
  });

  model.compile({
    optimizer: "sgd",
    loss: "meanSquaredError"
  });

  return model;
};

export const train = (
  b: Board,
  targets: Targets,
  model: Model
): TaskEither<Error, Model> => {
  return TE.tryCatch(
    () =>
      model
        .fit(tf.tensor([BoardM.toBinaryArray(b)]), tf.tensor([targets]), {
          shuffle: true,
          epochs: 20,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              console.log("Epoch " + epoch);
              console.log("Loss: " + logs.loss + " accuracy: " + logs.acc);
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

export const probs = (model: Model, b: Board): Array<number> => {
  const xs = tf.tensor([BoardM.toBinaryArray(b)]);
  const predRaw = model.predict(xs);
  const pred = Array.isArray(predRaw) ? predRaw[0] : predRaw;

  return Array.from(pred.dataSync());
};

export const move = (model: Model) => (
  board: Board,
  player: 1 | -1
): { move: Move; prediction: Array<number> } => {
  const dim = BoardM.dim(board).rows;

  const prediction = probs(model, board);
  const validProbs = A.zipWith(
    prediction,
    BoardM.toArray(board),
    (prob, real) => (real === 0 ? prob : -1)
  );

  const [probIdx, prob] = pipe(
    validProbs,
    A.reduceWithIndex([0, -1], (i, acc, v) => (v > acc[1] ? [i, v] : acc))
  );

  const row = Math.floor(probIdx / dim);
  const col = Math.floor(probIdx % dim);

  return {
    move: { score: prob, idx: probIdx, player, pos: [row, col] },
    prediction
  };
};
