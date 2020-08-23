import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import { constant } from "fp-ts/lib/function";
import * as BoardM from "./board";
import { Board, Pos } from "./board";

// import * as B from "./src/board"; import * as G from "./src/game";
// var game = G.runGame(B.mkEmpty(), 1, { p1: G.moveRandom, p2: G.moveRandom }); console.log(B.show(game.board)); console.log(game.winner);

export type Move = {
  score: number;
  player: 1 | -1;
  pos: Pos;
};
export type MoveFn = (board: Board, player: 1 | -1) => Move;
export type GameHistory = Array<{ board: Board; move: Move }>;
type GameState = {
  board: Board;
  winner: Option<1 | -1>;
  history: GameHistory;
};

export const moveRandom = (b: Board, player: 1 | -1): Move => {
  const available = BoardM.emptyCellPositions(b);
  const index = Math.floor(Math.random() * available.length);
  const pos = pipe(
    available,
    A.lookup(index),
    O.getOrElse(() => {
      throw new Error("Impossible access of array possition");
    })
  );

  return { pos, score: 1, player };
};

export const runGame = (
  b: Board,
  currentTurn: 1 | -1,
  move: { p1: MoveFn; p2: MoveFn }
): GameState =>
  pipe(
    runGame_(b, currentTurn, [], move),
    O.getOrElse(() => {
      throw new Error("Game execution failed");
    })
  );

const runGame_ = (
  b: Board,
  currentTurn: 1 | -1,
  history: GameHistory,
  move: { p1: MoveFn; p2: MoveFn }
): Option<GameState> => {
  // TODO Thread this in
  if (A.isEmpty(BoardM.emptyCellPositions(b))) {
    return O.some({ board: b, winner: winner(b), history });
  }

  const { pos, score, player } =
    currentTurn === 1 ? move.p1(b, currentTurn) : move.p2(b, currentTurn);

  return pipe(
    O.fromEither(BoardM.setCellAtPos(b)(pos, currentTurn)),
    O.chain(newB => {
      const historyItem = {
        board: newB,
        move: { score, player, pos }
      };
      const newHistory = history.concat([historyItem]);

      return pipe(
        winner(newB),
        O.fold(
          () => runGame_(newB, currentTurn === 1 ? -1 : 1, newHistory, move),
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
