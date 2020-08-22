import * as tf from "@tensorflow/tfjs";

export const mkModel = (boardDim: number): tf.Sequential => {
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
