"""Tests for Nine's sudoku engine. Run from the repository root: python -m unittest discover tests"""

import os
import random
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "Nine"))

import sudoku  # noqa: E402

INKALA = [int(c) for c in "800000000003600000070090200050007000000045700000100030001000068008500010090000400"]


def is_complete(board):
    return 0 not in board and not sudoku.conflicts(board)


class SolverTests(unittest.TestCase):
    def test_solves_the_hardest_known_puzzle(self):
        solution = sudoku.solve(INKALA)
        self.assertTrue(is_complete(solution))
        # the clues are kept
        self.assertTrue(all(c == 0 or c == s for c, s in zip(INKALA, solution)))

    def test_rejects_boards_with_repeated_numbers(self):
        board = list(INKALA)
        board[1] = 8  # a second 8 in the first row
        self.assertIsNone(sudoku.solve(board))
        self.assertEqual(sudoku.conflicts(board), {0, 1})

    def test_reports_unsolvable_boards(self):
        board = [1, 2, 3, 4, 5, 6, 7, 8, 0] + [0] * 8 + [9] + [0] * 63
        self.assertIsNone(sudoku.solve(board))

    def test_counts_solutions_up_to_the_limit(self):
        self.assertEqual(sudoku.count_solutions(INKALA), 1)
        self.assertEqual(sudoku.count_solutions([0] * 81), 2)

    def test_animated_solver_ends_on_the_same_solution(self):
        steps = list(sudoku.solve_steps(INKALA))
        kind, _, board = steps[-1]
        self.assertEqual(kind, "done")
        self.assertEqual(board, sudoku.solve(INKALA))
        self.assertEqual(sum(1 for s in steps if s[0] == "place"), 13810)


class GeneratorTests(unittest.TestCase):
    def setUp(self):
        random.seed(2026)

    def test_every_level_has_one_solution(self):
        for level in ("easy", "medium", "hard"):
            with self.subTest(level=level):
                puzzle, solution = sudoku.generate(level)
                self.assertTrue(is_complete(solution))
                self.assertEqual(sudoku.count_solutions(puzzle), 1)
                self.assertTrue(all(p == 0 or p == s for p, s in zip(puzzle, solution)))

    def test_harder_levels_give_fewer_clues(self):
        clues = {level: 81 - sudoku.generate(level)[0].count(0) for level in ("easy", "medium", "hard")}
        self.assertGreater(clues["easy"], clues["medium"])
        self.assertGreater(clues["medium"], clues["hard"])
        self.assertLessEqual(clues["hard"], sudoku.CLUES["hard"] + 1)


if __name__ == "__main__":
    unittest.main()
