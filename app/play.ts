import * as GameM from "../src/game";
import * as BoardM from "../src/board";
import * as NN from "../src/player/neuralNetwork";
import * as HumanP from "../src/player/human";

const modelPath = process.argv[2];

NN.load(modelPath).then(model => {
  GameM.run(
    BoardM.mkEmpty(),
    1,
    { p1: NN.move(model), p2: HumanP.move },
    true
  )();
});
