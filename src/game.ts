import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { constant } from "fp-ts/lib/function";
import * as BoardM from "./board";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/lib/Either";
import { Board, Pos, SetCellError } from "./board";

export type Error = "move_error" | "game_execution_error" | SetCellError;

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
) => TaskEither<"move_error", { move: Move; scores: Array<Score> }>;
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
  move: { p1: MoveFn; p2: MoveFn },
  verbose = false
): TaskEither<Error, GameState> => {
  return TE.tryCatch(
    () => run_(b, currentTurn, [], move, verbose),
    _err => "game_execution_error"
  );
};

export const run_ = (
  b: Board,
  currentTurn: 1 | -1,
  history: GameHistory,
  moveFns: { p1: MoveFn; p2: MoveFn },
  verbose = false
): Promise<GameState> => {
  // TODO Thread this in
  if (A.isEmpty(BoardM.emptyCellPositions(b))) {
    if (verbose) {
      console.log("\n Game ended in a tie \n");
      console.log(BoardM.show(b));
    }
    return Promise.resolve({ board: b, winner: winner(b), history });
  }

  const moveFn = currentTurn === 1 ? moveFns.p1 : moveFns.p2;

  // TODO Had to stop using TaskEither due to an issue with fp-ts TE.chain
  return moveFn(b, currentTurn)().then(r => {
    return pipe(
      r,
      E.chain(({ move, scores }) =>
        pipe(
          BoardM.setCellAtPos(b)(move.pos, currentTurn),
          E.chain(newB =>
            E.right<Error, { newB: Board; move: Move; scores: Array<Score> }>({
              newB,
              move,
              scores
            })
          )
        )
      ),
      E.fold(
        err => Promise.reject(err),
        ({ newB, move, scores }) => {
          const historyItem = {
            board: b,
            scores,
            move
          };

          const newHistory = history.concat([historyItem]);

          return pipe(
            winner(newB),
            O.fold(
              () =>
                run_(
                  newB,
                  currentTurn === 1 ? -1 : 1,
                  newHistory,
                  moveFns,
                  verbose
                ),
              winner => {
                if (verbose) {
                  console.log("\n Winner is", winner === 1 ? "X" : "O", "\n");
                  console.log(BoardM.show(newB));
                }
                return Promise.resolve({
                  board: newB,
                  winner: O.some(winner),
                  history: newHistory
                });
              }
            )
          );
        }
      )
    );
  });
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
