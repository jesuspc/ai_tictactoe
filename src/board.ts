import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import * as E from "fp-ts/lib/Either";
import { Option } from "fp-ts/lib/Option";
import { Either } from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/pipeable";
import { identity } from "fp-ts/lib/function";

// [
//   [1, 0, -1]
//   [1, 1, -1]
//   [1, 0, -1]
// ]
export type Cell = 1 | 0 | -1;
export type Board = Array<Array<Cell>>;
export type Pos = [number, number];

const showCell = (c: Cell): string => {
  switch (c) {
    case 1:
      return "X";
    case 0:
      return " ";
    case -1:
      return "O";
  }
};

export const show = (b: Board): string => {
  return pipe(
    b,
    A.map(v =>
      pipe(
        v,
        A.map(showCell)
      ).join(" | ")
    )
  ).join("\n---------\n");
};

export const mkEmpty = (): Board => [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

export const getCellAtPos = (b: Board) => ([i, j]: Pos): Option<Cell> =>
  pipe(
    b,
    A.lookup(i),
    O.chain(A.lookup(j))
  );

type SetCellError = "non-empty-cell" | "position-out-of-bounds";

export const setCellAtPos = (b: Board) => (
  [i, j]: Pos,
  val: Cell
): Either<SetCellError, Board> => {
  let error: SetCellError | null;
  return pipe(
    b,
    A.modifyAt(i, row =>
      pipe(
        row,
        A.modifyAt(j, cell => {
          if (cell === 0) {
            return val;
          } else {
            error = "non-empty-cell";
            return cell;
          }
        }),
        O.fold(() => {
          error = "position-out-of-bounds";
          return row;
        }, identity)
      )
    ),
    O.getOrElse(() => {
      error = "position-out-of-bounds";
      return b;
    }),
    newB => (error ? E.left(error) : E.right(newB))
  );
};

export const emptyCellPositions = (b: Board): Array<Pos> =>
  pipe(
    b,
    A.reduceWithIndex<Array<Cell>, Array<Pos>>([], (i, acc1, row) => [
      ...acc1,
      ...pipe(
        row,
        A.reduceWithIndex<Cell, Array<Pos>>([], (j, acc2, cell) =>
          cell === 0 ? [...acc2, [i, j]] : acc2
        )
      )
    ])
  );
