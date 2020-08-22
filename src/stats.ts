import * as B from "./board";
import * as G from "./game";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";

// import * as Stats from "./src/stats";
// var stats = Stats.runMany(10);

type Total = {
  runs: number;
  xs: number;
  os: number;
  ties: number;
};
type Stats = {
  total: Total;
  totalRatio: { xs: number; os: number; ties: number };
};

export const runMany = (n: number): Stats => {
  const total = pipe(
    A.range(1, n),
    A.reduce({ runs: 0, xs: 0, os: 0, ties: 0 }, acc => {
      const run = G.runGame(B.mkEmpty(), 1);

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

  return {
    total,
    totalRatio: {
      xs: total.xs / total.runs,
      os: total.os / total.runs,
      ties: total.ties / total.runs
    }
  };
};