import * as tf from "@tensorflow/tfjs";
import { Board } from "./board";
import * as BoardM from "./board";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";

type QValues = Array<number>;
type Model = tf.Sequential;

type Error = "training_error";

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
      tf.layers.dense({ units: boardDim ** 3, activation: "softmax" })
    ]
  });

  model.compile({
    optimizer: "sgd",
    loss: "mean_squared_error"
  });

  return model;
};

export const train = (
  b: Board,
  qvalues: QValues,
  model: Model
): TaskEither<Error, Model> => {
  return TE.tryCatch(
    () =>
      model
        .fit(tf.tensor(BoardM.toBinaryArray(b)), tf.tensor(qvalues), {
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
