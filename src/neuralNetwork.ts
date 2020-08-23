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
        units: boardDim ** 2 * 9 * 3,
        activation: "relu"
      }),
      // Returns the Q-value of each cell
      tf.layers.dense({
        units: boardDim ** 2,
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
  const xxs = pipe(
    xs,
    A.map(({ board }) => BoardM.toBinaryArray(board))
  );
  const inputs = tf.tensor(xxs);

  const ys = pipe(
    xs,
    A.map(({ targets }) => targets)
  );
  const targets = tf.tensor(ys);

  console.log("[Inputs]", xxs);
  console.log("[Targets]", ys);

  // const targets = tf.tensor(
  //   pipe(
  //     xs,
  //     A.map(e => [1, 0, 0, 0, 0, 0, 0, 0, 0])
  //   )
  // );

  return TE.tryCatch(
    () =>
      model
        .fit(inputs, targets, {
          // shuffle: true,
          // epochs: 20,
          epochs: 1,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
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

export const preds = (model: Model, b: Board): Array<number> => {
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

  const prediction = preds(model, board);
  const probs = Array.from(
    tf
      .tensor(prediction)
      .softmax()
      .dataSync()
  );
  console.log("[Preds]", prediction);
  console.log("[Probs]", probs);
  const validProbs = A.zipWith(probs, BoardM.toArray(board), (prob, real) =>
    real === 0 ? prob : -1
  );
  console.log("[Valid Probs]", validProbs);

  const [probIdx, prob, pred] = pipe(
    validProbs,
    A.reduceWithIndex([0, -1, -1], (i, acc, v) =>
      v > acc[1] ? [i, v, prediction[i]] : acc
    )
  );

  console.log("[RES]", probIdx, prob, pred);

  const row = Math.floor(probIdx / dim);
  const col = Math.floor(probIdx % dim);

  return {
    move: { score: pred, idx: probIdx, player, pos: [row, col] },
    prediction
  };
};
