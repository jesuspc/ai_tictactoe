import * as NN from "./neuralNetwork";
import { Model } from "./neuralNetwork";
import * as BoardM from "./board";
import { Board } from "./board";
import { Total, Stats } from "./stats";
import * as GameM from "./game";
import { GameHistory, GameState } from "./game";
import * as A from "fp-ts/lib/Array";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";

// import * as NN from "./src/neuralNetwork"; import { execute, runOne, runMany } from "./src/run";
// execute(runMany(NN.mkModel(3), 1))

type Execution = TaskEither<NN.Error, { stats: Stats; model: Model }>;
export const execute = (ex: Execution) => {
  return ex().then(res => {
    pipe(
      res,
      E.fold(
        err => {
          console.log("[ERROR] Execution error:", err);
        },
        succ => {
          console.log("[SUCCESS] Execution success:", succ.stats);
        }
      )
    );
  });
};

type ExecuteOne = TaskEither<NN.Error, { game: GameState; model: Model }>;
export const runOne = (m: Model): ExecuteOne => {
  const board = BoardM.mkEmpty();
  const model = NN.mkModel(BoardM.dim(board).rows);
  const trainData = mkTrainData({
    winValue: 1,
    drawValue: 0,
    lossValue: -1,
    discount: 0.95
  });

  const game = GameM.runGame(BoardM.mkEmpty(), 1, {
    p1: NN.move(model),
    p2: GameM.moveRandom
  });

  return pipe(
    NN.train(trainData(game, 1), m),
    TE.map(model => ({ game, model }))
  );
};

export const runMany = (m: Model, n: number): Execution => {
  return pipe(
    A.range(1, n),
    A.reduce(
      TE.right<NN.Error, { total: Total; model: Model }>({
        total: { runs: 0, xs: 0, os: 0, ties: 0 },
        model: m
      }),
      acc => {
        return pipe(
          acc,
          TE.chain(({ model, total }) =>
            pipe(
              runOne(model),
              TE.map(run => {
                total.runs += 1;

                pipe(
                  run.game.winner,
                  O.fold(
                    () => {
                      total.ties += 1;
                    },
                    v => {
                      v === 1 ? (total.xs += 1) : (total.os += 1);
                    }
                  )
                );

                return { total, model: run.model };
              })
            )
          )
        );
      }
    ),
    TE.map(({ total, model }) => {
      return {
        model,
        stats: {
          total: total,
          totalRatio: {
            xs: total.xs / total.runs,
            os: total.os / total.runs,
            ties: total.ties / total.runs
          }
        }
      };
    })
  );
};

const mkTrainData = ({
  winValue = 1,
  drawValue = 0,
  lossValue = -1,
  discount = 0.95
}) => (
  g: GameState,
  player: 1 | -1
): Array<{ board: Board; targets: Array<number> }> => {
  const xs = pipe(
    g.history,
    A.filter(e => e.move.player === player)
  );

  const finalScore = pipe(
    xs,
    A.last,
    O.chain(() => g.winner),
    O.fold(
      () => drawValue,
      p => (p === player ? winValue : lossValue)
    )
  );

  const nextProbs = [
    ...pipe(
      xs.slice(1),
      A.map(e => e.move.score)
    ),
    finalScore
  ];

  return pipe(
    xs,
    A.zip(nextProbs),
    A.map(([b, pp1]) => ({
      targets: pipe(
        b.prediction,
        A.mapWithIndex((i, p) => (i === b.move.idx ? discount * pp1 : p))
      ),
      board: b.board
    }))
  );
};
