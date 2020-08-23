import { Move, Score } from "../game";
import { Board } from "../board";
import * as BoardM from "../board";
import * as A from "fp-ts/lib/Array";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/pipeable";

export const move = (
  b: Board,
  player: 1 | -1
): { move: Move; scores: Array<Score> } => {
  const stdin = process.openStdin();

  stdin.addListener("data", function(d) {
    console.log("you entered: [" + d.toString().trim() + "]");
  });

  return { move: { idx: 0, pos: [1, 1], score: 1, player }, scores: [] };
};
