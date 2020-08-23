import { Move, Score } from "../game";
import { Board } from "../board";
import * as BoardM from "../board";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

export const move = (
  b: Board,
  player: 1 | -1
): TaskEither<"move_error", { move: Move; scores: Array<Score> }> => {
  const available = BoardM.emptyCellPositions(b);
  const index = Math.floor(Math.random() * available.length);
  const pos = pipe(
    available,
    A.lookup(index),
    O.getOrElse(() => {
      throw new Error("Impossible access of array possition");
    })
  );

  return TE.right({ move: { idx: 0, pos, score: 1, player }, scores: [] });
};
