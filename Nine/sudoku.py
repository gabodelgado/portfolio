"""Sudoku engine: solver, solution counter and puzzle generator.

The board is a flat list of 81 ints (0 = empty). Candidates are tracked with 9-bit masks
per row, column and box, and the solver always branches on the cell with the fewest
candidates (the "minimum remaining values" heuristic), which keeps even hard puzzles fast.
"""

import random

ALL = 0x1FF  # bits 0..8 → digits 1..9


def box_of(r, c):
    return (r // 3) * 3 + c // 3


def bit(v):
    return 1 << (v - 1)


def popcount(x):
    return bin(x).count("1")


def digits_in(mask):
    return [d for d in range(1, 10) if mask & bit(d)]


class Masks:
    """Row/column/box usage masks for a board, kept in sync while solving."""

    def __init__(self, board):
        self.rows = [0] * 9
        self.cols = [0] * 9
        self.boxes = [0] * 9
        self.valid = True
        for i, v in enumerate(board):
            if v:
                r, c = divmod(i, 9)
                b = bit(v)
                if self.rows[r] & b or self.cols[c] & b or self.boxes[box_of(r, c)] & b:
                    self.valid = False
                self.place(r, c, v)

    def candidates(self, r, c):
        return ALL & ~(self.rows[r] | self.cols[c] | self.boxes[box_of(r, c)])

    def place(self, r, c, v):
        b = bit(v)
        self.rows[r] |= b
        self.cols[c] |= b
        self.boxes[box_of(r, c)] |= b

    def remove(self, r, c, v):
        b = ~bit(v)
        self.rows[r] &= b
        self.cols[c] &= b
        self.boxes[box_of(r, c)] &= b


def conflicts(board):
    """Indexes of cells whose value repeats in their row, column or box."""
    bad = set()
    groups = []
    for k in range(9):
        groups.append([k * 9 + c for c in range(9)])
        groups.append([r * 9 + k for r in range(9)])
        br, bc = (k // 3) * 3, (k % 3) * 3
        groups.append([(br + r) * 9 + bc + c for r in range(3) for c in range(3)])
    for group in groups:
        seen = {}
        for i in group:
            v = board[i]
            if v:
                seen.setdefault(v, []).append(i)
        for cells in seen.values():
            if len(cells) > 1:
                bad.update(cells)
    return bad


def _best_cell(board, masks):
    """Empty cell with the fewest candidates, or (None, 0) when the board is full."""
    best, best_mask, best_count = None, 0, 10
    for i in range(81):
        if board[i] == 0:
            r, c = divmod(i, 9)
            m = masks.candidates(r, c)
            n = popcount(m)
            if n < best_count:
                best, best_mask, best_count = i, m, n
                if n <= 1:
                    break
    return best, best_mask


def solve(board, shuffle=False):
    """Return a solved copy of the board, or None if it has no solution."""
    board = list(board)
    masks = Masks(board)
    if not masks.valid:
        return None

    def backtrack():
        i, mask = _best_cell(board, masks)
        if i is None:
            return True
        r, c = divmod(i, 9)
        options = digits_in(mask)
        if shuffle:
            random.shuffle(options)
        for v in options:
            board[i] = v
            masks.place(r, c, v)
            if backtrack():
                return True
            masks.remove(r, c, v)
            board[i] = 0
        return False

    return board if backtrack() else None


def count_solutions(board, limit=2):
    """Count solutions up to `limit` (2 is enough to know if a puzzle is unique)."""
    board = list(board)
    masks = Masks(board)
    if not masks.valid:
        return 0
    found = 0

    def backtrack():
        nonlocal found
        i, mask = _best_cell(board, masks)
        if i is None:
            found += 1
            return found >= limit
        r, c = divmod(i, 9)
        for v in digits_in(mask):
            board[i] = v
            masks.place(r, c, v)
            if backtrack():
                return True
            masks.remove(r, c, v)
            board[i] = 0
        return False

    backtrack()
    return found


def solve_steps(board):
    """Generator for the animated solver.

    Yields ("place", index, value) and ("remove", index, 0) as the backtracking search
    runs, then ("done", None, solved) — or ("fail", None, None) if there is no solution.
    """
    board = list(board)
    masks = Masks(board)
    if not masks.valid:
        yield ("fail", None, None)
        return
    stack = []  # (index, remaining candidate digits)
    i, mask = _best_cell(board, masks)
    if i is None:
        yield ("done", None, board)
        return
    stack.append((i, digits_in(mask)))
    while stack:
        i, options = stack[-1]
        r, c = divmod(i, 9)
        if board[i]:
            masks.remove(r, c, board[i])
            board[i] = 0
            yield ("remove", i, 0)
        if not options:
            stack.pop()
            continue
        v = options.pop(0)
        board[i] = v
        masks.place(r, c, v)
        yield ("place", i, v)
        nxt, nmask = _best_cell(board, masks)
        if nxt is None:
            yield ("done", None, board)
            return
        stack.append((nxt, digits_in(nmask)))
    yield ("fail", None, None)


# Target number of clues per difficulty. Fewer clues, more deduction needed.
CLUES = {"easy": 40, "medium": 32, "hard": 26}


def generate(difficulty="medium", attempts=12):
    """Build a puzzle with exactly one solution. Returns (puzzle, solution).

    Some random grids can't be thinned down to the target, so a few attempts are made
    and the one with the fewest clues wins.
    """
    best = None
    for _ in range(attempts):
        puzzle, solution = _carve(difficulty)
        if best is None or puzzle.count(0) > best[0].count(0):
            best = (puzzle, solution)
        if 81 - puzzle.count(0) <= CLUES[difficulty]:
            break
    return best


def _carve(difficulty):
    solution = solve([0] * 81, shuffle=True)
    puzzle = list(solution)
    target = CLUES[difficulty]
    # remove cells in symmetric pairs so the puzzle looks hand-made
    cells = list(range(41))
    random.shuffle(cells)
    clues = 81
    for i in cells:
        if clues <= target:
            break
        j = 80 - i
        pair = {i, j}
        saved = {k: puzzle[k] for k in pair}
        for k in pair:
            puzzle[k] = 0
        if count_solutions(puzzle) == 1:
            clues -= len(pair)
        else:
            for k, v in saved.items():
                puzzle[k] = v
    return puzzle, solution
