import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { Option } from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";
import * as BoardM from "./board";
import { Board, Pos } from "./board";

// import * as B from "./src/board"
// import * as G from "./src/game"
// console.log(B.show(G.runGame(B.mkEmpty(), 1)))

export const runGame = (b: Board, currentTurn: 1 | -1): Board =>
  pipe(
    runGame_(b, currentTurn, BoardM.emptyCellPositions(b)),
    O.getOrElse(() => {
      throw new Error("Game execution failed");
    })
  );

const runGame_ = (
  b: Board,
  currentTurn: 1 | -1,
  available: Array<Pos>
): Option<Board> => {
  if (A.isEmpty(available)) {
    return O.some(b);
  }

  const index = Math.floor(Math.random() * available.length);

  return pipe(
    available,
    A.lookup(index),
    O.chain(pos =>
      pipe(
        available,
        A.deleteAt(index),
        O.chain(newAvailable =>
          pipe(
            O.fromEither(BoardM.setCellAtPos(b)(pos, currentTurn)),
            O.chain(newB =>
              runGame_(newB, currentTurn === 1 ? -1 : 1, newAvailable)
            )
          )
        )
      )
    )
  );
};
