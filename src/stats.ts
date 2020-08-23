import * as B from "./board";
import * as G from "./game";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";
import { MoveFn } from "./game";

// import * as Stats from "./src/stats"; import * as G from "./src/game"; import * as NN from "./src/player/neuralNetwork"; import * as RandomP from "./src/player/random";
// var nn = null as any; NN.load("file://models/nn-3-10000/model.json").then(n => nn = n);
// var stats = Stats.runMany(10, { p1: NN.move(nn), p2: G.moveRandom });

export type Total = {
  runs: number;
  xs: number;
  os: number;
  ties: number;
};
export type Ratio = {
  xs: number;
  os: number;
  ties: number;
};
export type Stats = {
  total: Total;
  totalRatio: Ratio;
};

export const toRatios = (total: Total): Ratio => {
  return {
    xs: total.xs / total.runs,
    os: total.os / total.runs,
    ties: total.ties / total.runs
  };
};

export const runMany = (
  n: number,
  move: { p1: MoveFn; p2: MoveFn }
): TaskEither<G.Error, Stats> => {
  const initial: TaskEither<G.Error, Total> = TE.right({
    runs: 0,
    xs: 0,
    os: 0,
    ties: 0
  });

  return pipe(
    A.range(1, n),
    A.reduce(initial, accum => {
      return pipe(
        accum,
        TE.chain(acc => {
          return pipe(
            G.run(B.mkEmpty(), 1, move),
            TE.map(run => {
              acc.runs += 1;

              pipe(
                run.winner,
                O.fold(
                  () => {
                    acc.ties += 1;
                  },
                  v => {
                    v === 1 ? (acc.xs += 1) : (acc.os += 1);
                  }
                )
              );

              return acc;
            })
          );
        })
      );
    }),
    TE.map(total => {
      return {
        total,
        totalRatio: toRatios(total)
      };
    })
  );
};
