import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { constant } from "fp-ts/lib/function";
import * as BoardM from "./board";
import { Board, Pos } from "./board";

export type Score = number;
export type Move = {
  score: number;
  idx: number;
  player: 1 | -1;
  pos: Pos;
};
export type MoveFn = (
  board: Board,
  player: 1 | -1
) => { move: Move; scores: Array<Score> };
export type GameHistory = Array<{
  board: Board;
  move: Move;
  scores: Array<Score>;
}>;
export type GameState = {
  board: Board;
  winner: Option<1 | -1>;
  history: GameHistory;
};

export const run = (
  b: Board,
  currentTurn: 1 | -1,
  move: { p1: MoveFn; p2: MoveFn }
): GameState =>
  pipe(
    runStep(b, currentTurn, [], move),
    O.getOrElse(() => {
      throw new Error("Game execution failed");
    })
  );

export const runStep = (
  b: Board,
  currentTurn: 1 | -1,
  history: GameHistory,
  moveFns: { p1: MoveFn; p2: MoveFn }
): Option<GameState> => {
  // TODO Thread this in
  if (A.isEmpty(BoardM.emptyCellPositions(b))) {
    return O.some({ board: b, winner: winner(b), history });
  }

  const { move, scores } =
    currentTurn === 1 ? moveFns.p1(b, currentTurn) : moveFns.p2(b, currentTurn);

  return pipe(
    O.fromEither(BoardM.setCellAtPos(b)(move.pos, currentTurn)),
    O.chain(newB => {
      const historyItem = {
        board: b,
        scores,
        move
      };
      const newHistory = history.concat([historyItem]);

      // console.log(BoardM.show(newB));
      // console.log("\n");

      return pipe(
        winner(newB),
        O.fold(
          () => runStep(newB, currentTurn === 1 ? -1 : 1, newHistory, moveFns),
          winner =>
            O.some({
              board: newB,
              winner: O.some(winner),
              history: newHistory
            })
        )
      );
    })
  );
};

export const winner = (b: Board): Option<1 | -1> => {
  const { rows } = BoardM.dim(b);
  const xs = BoardM.toArray(b);

  return pipe(
    xs,
    A.reduceWithIndex<BoardM.Cell, Option<1 | -1>>(O.none, (i, acc, _v) => {
      if (O.isSome(acc)) {
        return acc;
      }

      const quotient = Math.floor(i / rows);
      const remainder = i % rows;

      return pipe(
        guard(quotient === 0, () => testColumn(xs, rows, remainder)),
        chainNone(() =>
          guard(remainder === 0, () => testRow(xs, rows, quotient))
        ),
        chainNone(() =>
          guard(
            quotient === 0 && (remainder === 0 || remainder === rows - 1),
            () => testDiagonal(xs, rows, remainder === 0)
          )
        )
      );
    })
  );
};

const testIndices = (
  xs: Array<BoardM.Cell>,
  acc: Array<number>
): Option<1 | -1> => {
  return pipe(
    acc,
    A.lookup(0),
    O.chain(i => pipe(xs, A.lookup(i))),
    O.chain(initial => {
      if (initial === 0) {
        return O.none;
      }
      return pipe(
        acc.slice(1),
        A.takeLeftWhile(i =>
          pipe(
            xs,
            A.lookup(i),
            O.fold(constant(false), v => v === initial)
          )
        ),
        ys => (ys.length === acc.length - 1 ? O.some(initial) : O.none)
      );
    })
  );
};

const testColumn = (
  xs: Array<BoardM.Cell>,
  dim: number,
  colNum: number
): Option<1 | -1> => {
  const acc: Array<number> = [];

  let i = colNum;
  while (i < dim ** 2) {
    acc.push(i);
    i = i + dim;
  }

  return testIndices(xs, acc);
};

const testRow = (
  xs: Array<BoardM.Cell>,
  dim: number,
  rowNum: number
): Option<1 | -1> => {
  const acc: Array<number> = [];

  const initial = rowNum * dim;
  let i = initial;
  while (i - initial < dim) {
    acc.push(i);
    i = i + 1;
  }

  return testIndices(xs, acc);
};

const testDiagonal = (
  xs: Array<BoardM.Cell>,
  dim: number,
  left: boolean
): Option<1 | -1> => {
  if (left) {
    const acc: Array<number> = [];

    let i = 0;
    while (i < dim ** 2) {
      acc.push(i);
      i = i + dim + 1;
    }

    return testIndices(xs, acc);
  } else {
    const acc: Array<number> = [];

    let i = dim - 1;
    while (i < dim ** 2 - 1) {
      acc.push(i);
      i = i + dim - 1;
    }

    return testIndices(xs, acc);
  }
};

const guard = <A>(cond: boolean, fn: () => Option<A>): Option<A> =>
  cond ? fn() : O.none;

const chainNone = <A>(fn: () => Option<A>) => (o: Option<A>) =>
  O.isNone(o) ? fn() : o;
