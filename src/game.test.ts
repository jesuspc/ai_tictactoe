import { expect } from "chai";
import * as O from "fp-ts/lib/Option";
import { winner } from "./game";
import { pipe } from "fp-ts/lib/pipeable";
import { Board } from "./board";

describe("Game test", () => {
  describe("winner", () => {
    it("works for empty", () => {
      const board: Board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });

    it("works for first row true", () => {
      const board: Board = [
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.true;

      pipe(
        win,
        O.fold(
          () => {
            throw new Error("absurd");
          },
          v => {
            expect(v).to.equals(1);
          }
        )
      );
    });

    it("works for first row false", () => {
      const board: Board = [
        [1, 1, -1],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });

    it("works for last row true", () => {
      const board: Board = [
        [0, 0, 0],
        [0, 0, 0],
        [1, 1, 1]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.true;

      pipe(
        win,
        O.fold(
          () => {
            throw new Error("absurd");
          },
          v => {
            expect(v).to.equals(1);
          }
        )
      );
    });

    it("works for last row false", () => {
      const board: Board = [
        [0, 0, 0],
        [0, 0, 0],
        [-1, 1, 1]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });

    it("works for first col true", () => {
      const board: Board = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.true;

      pipe(
        win,
        O.fold(
          () => {
            throw new Error("absurd");
          },
          v => {
            expect(v).to.equals(1);
          }
        )
      );
    });

    it("works for first col false", () => {
      const board: Board = [
        [1, 0, 0],
        [1, 0, 0],
        [0, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });

    it("works for last col true", () => {
      const board: Board = [
        [0, 0, -1],
        [0, 0, -1],
        [0, 0, -1]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.true;

      pipe(
        win,
        O.fold(
          () => {
            throw new Error("absurd");
          },
          v => {
            expect(v).to.equals(-1);
          }
        )
      );
    });

    it("works for last col false", () => {
      const board: Board = [
        [0, 0, 1],
        [0, 0, -1],
        [0, 0, 1]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });

    it("works for first diag true", () => {
      const board: Board = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.true;
      pipe(
        win,
        O.fold(
          () => {
            throw new Error("absurd");
          },
          v => {
            expect(v).to.equals(1);
          }
        )
      );
    });

    it("works for first diag false", () => {
      const board: Board = [
        [1, 0, 0],
        [0, -1, 0],
        [0, 0, 1]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });

    it("works for last diag true", () => {
      const board: Board = [
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.true;
      pipe(
        win,
        O.fold(
          () => {
            throw new Error("absurd");
          },
          v => {
            expect(v).to.equals(1);
          }
        )
      );
    });

    it("works for last diag false", () => {
      const board: Board = [
        [0, 0, 1],
        [0, -1, 0],
        [-1, 0, 0]
      ];

      const win = winner(board);

      expect(O.isSome(win)).to.be.false;
    });
  });
});
