import { expect } from "chai";
import { toBinaryArray, Board } from "./board";

describe("Board test", () => {
  describe("toBinaryArray", () => {
    it("works for a random sample", () => {
      const board: Board = [
        [1, 0, -1],
        [1, 1, -1],
        [1, 0, -1]
      ];

      expect(toBinaryArray(board)).to.deep.equal([
        true,
        false,
        false,
        true,
        true,
        false,
        true,
        false,
        false,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        false,
        true,
        false,
        true,
        false,
        false,
        false,
        false,
        false,
        true,
        false
      ]);
    });
  });
});
