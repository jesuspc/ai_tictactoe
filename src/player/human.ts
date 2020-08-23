import { Move, Score } from "../game";
import { Board, Pos } from "../board";
import * as BoardM from "../board";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import * as Read from "readline";

export const move = (
  b: Board,
  player: 1 | -1
): TaskEither<"move_error", { move: Move; scores: Array<Score> }> => {
  console.log("\n");
  console.log(BoardM.show(b));
  console.log("\n");
  console.log("Input location in format row col, 0 indexed");

  const rl = Read.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  return TE.tryCatch(
    () =>
      new Promise((resolve, reject) => {
        rl.on("line", line => {
          const [i, j] = line.split(" ");
          const pos: Pos = [Number(i), Number(j)];

          const available = BoardM.emptyCellPositions(b);

          if (
            available.filter(([a, b]) => a === pos[0] && b === pos[1]).length >
            0
          ) {
            rl.close();

            return resolve({
              move: { idx: 0, pos, score: 1, player },
              scores: []
            });
          } else {
            console.log("Invalid position, try again...");
          }
        });
      }),
    _err => "move_error"
  );
};
