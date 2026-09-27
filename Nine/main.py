"""Nine — play Sudoku, or type in any puzzle and watch it get solved.

Two ways to use it:
  • Play: generate a puzzle (easy / medium / hard) with a guaranteed unique solution.
  • Solve: start from an empty grid, type the puzzle you're stuck on, and press Solve —
    the backtracking search is animated so you can see how it thinks.

Controls
    Mouse / arrows   select a cell
    1–9              write a number
    0 / Backspace    erase
    H                hint        V   check
    S                solve       N   new puzzle
    Space / Esc      finish the solving animation instantly
    L                switch language (ES / EN)
"""

import json
import os
import time

import pygame
import sudoku

WIDTH, HEIGHT = 1000, 680
FPS = 60
CELL = 66
BOARD = CELL * 9
BOARD_X, BOARD_Y = 44, (HEIGHT - BOARD) // 2
PANEL_X = BOARD_X + BOARD + 44

# Sage and slate — calm colors for a thinking game
BG = (233, 239, 233)
PAPER = (251, 253, 251)
THIN = (197, 209, 200)
THICK = (46, 61, 56)
GIVEN = (31, 42, 39)
USER = (47, 125, 109)
SOLVER = (74, 120, 176)
CORAL = (214, 94, 80)
CORAL_BG = (251, 227, 223)
SELECTED = (201, 228, 217)
PEER = (238, 245, 240)
SAME = (217, 236, 228)
MUTED = (110, 128, 121)
WHITE = (255, 255, 255)

SAVE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")
DIFFICULTIES = ["easy", "medium", "hard"]

TEXT = {
    "es": {
        "tagline": "Juega o resuelve cualquier sudoku",
        "new_puzzle": "Nuevo sudoku",
        "easy": "Fácil", "medium": "Medio", "hard": "Difícil",
        "own": "Escribir el mío",
        "hint": "Pista", "check": "Verificar", "solve": "Resolver", "reset": "Reiniciar",
        "time": "Tiempo", "mistakes": "Errores", "best": "Mejor",
        "mode_play": "Modo juego · {level}",
        "mode_custom": "Modo resolver · escribe tu sudoku y toca Resolver",
        "welcome": "Elige un nivel para jugar, o «Escribir el mío» para resolver uno tuyo.",
        "won": "¡Resuelto en {time}!",
        "won_record": "¡Resuelto en {time}! Nuevo récord en {level}.",
        "check_ok": "Todo va bien hasta ahora.",
        "check_bad": "Hay {n} casillas incorrectas, marcadas en rojo.",
        "check_bad_one": "Hay 1 casilla incorrecta, marcada en rojo.",
        "conflict": "Hay números repetidos en una fila, columna o caja. Corrígelos primero.",
        "no_solution": "Este sudoku no tiene solución.",
        "multiple": "Resuelto. Ojo: este sudoku tiene más de una solución; esta es una de ellas.",
        "solved": "Resuelto por Nine en {steps} pasos.",
        "solving": "Resolviendo… {steps} pasos   (Espacio para terminar ya)",
        "too_few": "Escribe al menos 17 números — un sudoku con menos no puede tener solución única.",
        "hint_used": "Pista: casilla revelada.",
        "no_cell": "No quedan casillas vacías.",
        "keys": "1–9 escribir · 0 borrar · N nuevo · L idioma\nH pista · V verificar · S resolver",
    },
    "en": {
        "tagline": "Play or solve any sudoku",
        "new_puzzle": "New sudoku",
        "easy": "Easy", "medium": "Medium", "hard": "Hard",
        "own": "Enter my own",
        "hint": "Hint", "check": "Check", "solve": "Solve", "reset": "Reset",
        "time": "Time", "mistakes": "Mistakes", "best": "Best",
        "mode_play": "Play mode · {level}",
        "mode_custom": "Solve mode · type your sudoku and press Solve",
        "welcome": "Pick a level to play, or “Enter my own” to solve one of yours.",
        "won": "Solved in {time}!",
        "won_record": "Solved in {time}! New {level} record.",
        "check_ok": "Everything looks right so far.",
        "check_bad": "{n} cells are wrong, marked in red.",
        "check_bad_one": "1 cell is wrong, marked in red.",
        "conflict": "Some numbers repeat in a row, column or box. Fix them first.",
        "no_solution": "This sudoku has no solution.",
        "multiple": "Solved. Heads up: this sudoku has more than one solution; this is one of them.",
        "solved": "Solved by Nine in {steps} steps.",
        "solving": "Solving… {steps} steps   (Space to finish now)",
        "too_few": "Enter at least 17 numbers — a sudoku with fewer can't have a unique solution.",
        "hint_used": "Hint: cell revealed.",
        "no_cell": "No empty cells left.",
        "keys": "1–9 write · 0 erase · N new · L language\nH hint · V check · S solve",
    },
}


def load_save():
    try:
        with open(SAVE_PATH, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def write_save(data):
    try:
        with open(SAVE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except OSError:
        pass


def fmt_int(n, lang):
    text = f"{n:,}"
    return text.replace(",", ".") if lang == "es" else text


def fmt_time(seconds):
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def ui_font(size, bold=False):
    return pygame.font.SysFont("avenirnext,helveticaneue,helvetica,arial", size, bold=bold)


class Button:
    def __init__(self, key, rect, action, kind="normal"):
        self.key = key
        self.rect = pygame.Rect(rect)
        self.action = action
        self.kind = kind


class App:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Nine")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.fonts = {
            "title": pygame.font.SysFont("futura,avenirnext,helvetica", 46, bold=True),
            "digit": pygame.font.SysFont("avenirnext,helveticaneue,helvetica", 36, bold=True),
            "digit_light": pygame.font.SysFont("avenirnext,helveticaneue,helvetica", 36),
            "mid": ui_font(18, bold=True),
            "body": ui_font(15),
            "small": ui_font(13),
        }
        self.save = load_save()
        self.lang = self.save.get("lang") if self.save.get("lang") in TEXT else "es"
        best = self.save.get("best_times", {})
        self.best_times = {
            k: v for k, v in best.items() if k in DIFFICULTIES and isinstance(v, (int, float)) and v > 0
        } if isinstance(best, dict) else {}
        self.selected = 40
        self.solver = None
        self.solver_steps = 0
        self.message = ("welcome", {})
        self.message_color = MUTED
        self.build_buttons()
        self.new_puzzle(self.save.get("difficulty", "easy") if self.save.get("difficulty") in DIFFICULTIES else "easy")
        self.flash("welcome")

    # ---------- helpers ----------
    def t(self, key, **kwargs):
        value = TEXT[self.lang][key]
        if "steps" in kwargs:
            kwargs["steps"] = fmt_int(kwargs["steps"], self.lang)
        return value.format(**kwargs) if kwargs else value

    def persist(self):
        self.save.update({"lang": self.lang, "best_times": self.best_times, "difficulty": self.difficulty})
        write_save(self.save)

    def flash(self, key, color=MUTED, **kwargs):
        """Show a status message; kept as a key so it follows language changes."""
        self.message = (key, kwargs)
        self.message_color = color

    def message_text(self):
        key, kwargs = self.message
        # levels are stored as keys too, so they get translated at draw time
        kwargs = {k: self.t(v) if k == "level" else v for k, v in kwargs.items()}
        return self.t(key, **kwargs)

    def build_buttons(self):
        w = WIDTH - PANEL_X - 40
        y = 170
        third = (w - 16) // 3
        self.buttons = [
            Button("easy", (PANEL_X, y, third, 42), lambda: self.new_puzzle("easy"), "level"),
            Button("medium", (PANEL_X + third + 8, y, third, 42), lambda: self.new_puzzle("medium"), "level"),
            Button("hard", (PANEL_X + 2 * (third + 8), y, third, 42), lambda: self.new_puzzle("hard"), "level"),
            Button("own", (PANEL_X, y + 52, w, 42), self.custom_board, "ghost"),
            Button("hint", (PANEL_X, y + 150, (w - 8) // 2, 44), self.hint),
            Button("check", (PANEL_X + (w + 8) // 2, y + 150, (w - 8) // 2, 44), self.check),
            Button("reset", (PANEL_X, y + 202, (w - 8) // 2, 44), self.reset),
            Button("solve", (PANEL_X + (w + 8) // 2, y + 202, (w - 8) // 2, 44), self.start_solver, "primary"),
        ]

    # ---------- game state ----------
    def load_board(self, puzzle, solution, mode):
        self.puzzle = list(puzzle)
        self.board = list(puzzle)
        self.solution = solution
        self.givens = {i for i, v in enumerate(puzzle) if v}
        self.solver_cells = set()
        self.hinted = set()
        self.wrong = set()
        self.mode = mode
        self.mistakes = 0
        self.started = time.monotonic()
        self.finished_time = None
        self.solver = None

    def new_puzzle(self, difficulty):
        self.difficulty = difficulty
        puzzle, solution = sudoku.generate(difficulty)
        self.load_board(puzzle, solution, "play")
        self.selected = next((i for i in range(81) if not puzzle[i]), 0)
        self.flash("mode_play", level=difficulty)
        self.persist()

    def custom_board(self, board=None):
        self.load_board(board or [0] * 81, None, "custom")
        self.givens = set()  # everything typed in custom mode stays editable
        self.custom_input = list(self.board)
        if board is None:
            self.selected = 0
        self.flash("mode_custom")

    def reset(self):
        if self.mode == "custom":
            # after a solve, Reset brings back the puzzle you typed; pressed again, it clears the grid
            typed = getattr(self, "custom_input", None)
            restore = typed if typed and any(typed) and self.board != typed else None
            self.custom_board(restore)
        else:
            self.load_board(self.puzzle, self.solution, "play")
            self.flash("mode_play", level=self.difficulty)

    def elapsed(self):
        end = self.finished_time if self.finished_time is not None else time.monotonic()
        return end - self.started

    def is_locked(self, i):
        # in play mode the clues are fixed; in custom mode everything the user typed is editable
        return i in self.givens and self.mode == "play" or i in self.solver_cells or i in self.hinted

    def write(self, value):
        i = self.selected
        if self.solver or self.finished_time is not None or self.is_locked(i):
            return
        if self.board[i] == value:
            return
        self.board[i] = value
        self.wrong.discard(i)
        if self.mode == "play" and value and self.solution and value != self.solution[i]:
            self.mistakes += 1
        if self.mode == "play":
            self.check_win()

    def check_win(self):
        if 0 in self.board or self.board != self.solution:
            return
        self.finished_time = time.monotonic()
        took = self.elapsed()
        level = self.difficulty
        best = self.best_times.get(level)
        # hints don't count toward records
        if not self.hinted and (best is None or took < best):
            self.best_times[level] = round(took, 1)
            self.persist()
            self.flash("won_record", USER, time=fmt_time(took), level=level)
        else:
            self.flash("won", USER, time=fmt_time(took))

    def hint(self):
        if self.solver or self.finished_time is not None:
            return
        solution = self.solution
        if self.mode == "custom":
            if sudoku.conflicts(self.board):
                self.flash("conflict", CORAL)
                return
            solution = sudoku.solve(self.board)
            if solution is None:
                self.flash("no_solution", CORAL)
                return
        i = self.selected
        if self.board[i] == solution[i] and self.board[i]:
            # selected cell is already right — reveal the first empty or wrong one instead
            i = next((k for k in range(81) if self.board[k] != solution[k]), None)
            if i is None:
                self.flash("no_cell")
                return
        self.board[i] = solution[i]
        self.hinted.add(i)
        self.wrong.discard(i)
        self.selected = i
        self.flash("hint_used", SOLVER)
        if self.mode == "play":
            self.check_win()

    def check(self):
        if self.mode == "custom":
            bad = sudoku.conflicts(self.board)
            if bad:
                self.wrong = bad
                self.flash("conflict", CORAL)
            else:
                self.flash("check_ok", USER)
            return
        self.wrong = {i for i in range(81) if self.board[i] and self.board[i] != self.solution[i]}
        if self.wrong:
            n = len(self.wrong)
            self.flash("check_bad_one" if n == 1 else "check_bad", CORAL, n=n)
        else:
            self.flash("check_ok", USER)

    def start_solver(self):
        if self.solver or self.finished_time is not None:
            return
        base = list(self.board) if self.mode == "custom" else list(self.puzzle)
        if self.mode == "custom":
            self.custom_input = list(base)
            if sudoku.conflicts(base):
                self.wrong = sudoku.conflicts(base)
                self.flash("conflict", CORAL)
                return
            if 81 - base.count(0) < 17:
                self.flash("too_few", CORAL)
                return
            self.multiple = sudoku.count_solutions(base) > 1
        else:
            self.multiple = False
            self.hinted.clear()
        self.board = base
        self.wrong.clear()
        self.solver_base = {i for i, v in enumerate(base) if v}
        self.givens = set(self.solver_base) if self.mode == "custom" else self.givens
        self.solver = sudoku.solve_steps(base)
        self.solver_steps = 0

    def advance_solver(self, budget):
        for _ in range(budget):
            try:
                kind, i, value = next(self.solver)
            except StopIteration:
                kind, i, value = "fail", None, None
            if kind == "place":
                self.board[i] = value
                self.solver_cells.add(i)
                self.solver_steps += 1
            elif kind == "remove":
                self.board[i] = 0
                self.solver_cells.discard(i)
            elif kind == "done":
                self.board = value
                self.solver_cells = {k for k in range(81) if k not in self.solver_base}
                self.solver = None
                self.finished_time = time.monotonic()
                if self.multiple:
                    self.flash("multiple", SOLVER)
                else:
                    self.flash("solved", SOLVER, steps=self.solver_steps)
                return
            else:
                self.solver = None
                self.flash("no_solution", CORAL)
                return

    def finish_solver(self):
        while self.solver:
            self.advance_solver(5000)

    # ---------- input ----------
    def handle_key(self, event):
        key = event.key
        if key == pygame.K_l:
            self.lang = "en" if self.lang == "es" else "es"
            self.persist()
            return
        if self.solver:
            if key in (pygame.K_SPACE, pygame.K_ESCAPE, pygame.K_RETURN):
                self.finish_solver()
            return
        r, c = divmod(self.selected, 9)
        moves = {pygame.K_UP: (-1, 0), pygame.K_DOWN: (1, 0), pygame.K_LEFT: (0, -1), pygame.K_RIGHT: (0, 1)}
        if key in moves:
            dr, dc = moves[key]
            self.selected = ((r + dr) % 9) * 9 + (c + dc) % 9
        elif pygame.K_1 <= key <= pygame.K_9:
            self.write(key - pygame.K_0)
        elif pygame.K_KP1 <= key <= pygame.K_KP9:
            self.write(key - pygame.K_KP1 + 1)
        elif key in (pygame.K_0, pygame.K_KP0, pygame.K_BACKSPACE, pygame.K_DELETE):
            self.write(0)
        elif key == pygame.K_h:
            self.hint()
        elif key == pygame.K_v:
            self.check()
        elif key == pygame.K_s:
            self.start_solver()
        elif key == pygame.K_n:
            self.new_puzzle(self.difficulty)

    def handle_click(self, pos):
        x, y = pos
        if BOARD_X <= x < BOARD_X + BOARD and BOARD_Y <= y < BOARD_Y + BOARD:
            self.selected = ((y - BOARD_Y) // CELL) * 9 + (x - BOARD_X) // CELL
            return
        for b in self.buttons:
            if b.rect.collidepoint(pos):
                if self.solver:
                    self.finish_solver()
                    if b.key != "solve":
                        b.action()
                else:
                    b.action()
                return
        lang_rect = pygame.Rect(WIDTH - 110, 18, 90, 30)
        if lang_rect.collidepoint(pos):
            self.handle_key(pygame.event.Event(pygame.KEYDOWN, key=pygame.K_l))

    # ---------- drawing ----------
    def draw_board(self):
        board_rect = pygame.Rect(BOARD_X, BOARD_Y, BOARD, BOARD)
        pygame.draw.rect(self.screen, (214, 224, 217), board_rect.move(0, 6), border_radius=10)
        pygame.draw.rect(self.screen, PAPER, board_rect, border_radius=10)

        sel = self.selected
        sr, sc = divmod(sel, 9)
        sel_value = self.board[sel]
        conflicts = sudoku.conflicts(self.board)
        for i in range(81):
            r, c = divmod(i, 9)
            rect = pygame.Rect(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, CELL)
            fill = None
            if r == sr or c == sc or sudoku.box_of(r, c) == sudoku.box_of(sr, sc):
                fill = PEER
            if sel_value and self.board[i] == sel_value:
                fill = SAME
            if i in conflicts or i in self.wrong:
                fill = CORAL_BG
            if i == sel:
                fill = SELECTED
            if fill:
                corners = {
                    "border_top_left_radius": 10 if i == 0 else 0,
                    "border_top_right_radius": 10 if i == 8 else 0,
                    "border_bottom_left_radius": 10 if i == 72 else 0,
                    "border_bottom_right_radius": 10 if i == 80 else 0,
                }
                pygame.draw.rect(self.screen, fill, rect, **corners)

            v = self.board[i]
            if v:
                if i in conflicts or i in self.wrong:
                    color, f = CORAL, "digit_light"
                elif i in self.givens and (self.mode == "play" or not self.solver_cells or i not in self.solver_cells):
                    color, f = GIVEN, "digit"
                elif i in self.solver_cells or i in self.hinted:
                    color, f = SOLVER, "digit_light"
                else:
                    color, f = USER, "digit_light"
                surf = self.fonts[f].render(str(v), True, color)
                self.screen.blit(surf, surf.get_rect(center=rect.center))

        for k in range(10):
            width = 3 if k % 3 == 0 else 1
            color = THICK if k % 3 == 0 else THIN
            if 0 < k < 9:
                edge = k * CELL
                pygame.draw.line(self.screen, color, (BOARD_X, BOARD_Y + edge), (BOARD_X + BOARD - 1, BOARD_Y + edge), width)
                pygame.draw.line(self.screen, color, (BOARD_X + edge, BOARD_Y), (BOARD_X + edge, BOARD_Y + BOARD - 1), width)
        pygame.draw.rect(self.screen, THICK, board_rect, 3, border_radius=10)

    def draw_button(self, b, mouse):
        hover = b.rect.collidepoint(mouse)
        active_level = (b.kind == "level" and self.mode == "play" and self.difficulty == b.key) or (
            b.key == "own" and self.mode == "custom")
        if b.kind == "primary":
            bg, fg, border = (USER if not hover else (38, 105, 91)), WHITE, None
        elif active_level:
            bg, fg, border = THICK, WHITE, None
        elif b.kind == "ghost":
            bg, fg, border = (BG if not hover else PEER), THICK, THICK
        else:
            bg, fg, border = (PAPER if not hover else PEER), THICK, THIN
        pygame.draw.rect(self.screen, bg, b.rect, border_radius=10)
        if border:
            pygame.draw.rect(self.screen, border, b.rect, 2, border_radius=10)
        surf = self.fonts["mid"].render(self.t(b.key), True, fg)
        self.screen.blit(surf, surf.get_rect(center=b.rect.center))

    def draw_wrapped(self, text, color, x, y, width, font_key="body", line_h=21):
        words = text.split(" ")
        line = ""
        for word in words:
            test = (line + " " + word).strip()
            if self.fonts[font_key].size(test)[0] > width and line:
                self.screen.blit(self.fonts[font_key].render(line, True, color), (x, y))
                y += line_h
                line = word
            else:
                line = test
        if line:
            self.screen.blit(self.fonts[font_key].render(line, True, color), (x, y))
        return y + line_h

    def draw_panel(self):
        mouse = pygame.mouse.get_pos()
        w = WIDTH - PANEL_X - 40
        self.screen.blit(self.fonts["title"].render("Nine", True, THICK), (PANEL_X, BOARD_Y - 6))
        self.screen.blit(self.fonts["body"].render(self.t("tagline"), True, MUTED), (PANEL_X, BOARD_Y + 52))

        self.screen.blit(self.fonts["small"].render(self.t("new_puzzle").upper(), True, MUTED), (PANEL_X, 148))
        for b in self.buttons:
            self.draw_button(b, mouse)

        stats_y = 470
        stats = []
        if self.mode == "play":
            stats.append((self.t("time"), fmt_time(self.elapsed())))
            stats.append((self.t("mistakes"), str(self.mistakes)))
            best = self.best_times.get(self.difficulty)
            stats.append((self.t("best"), fmt_time(best) if best else "—"))
        col_w = w // 3
        for k, (label, value) in enumerate(stats):
            x = PANEL_X + k * col_w
            self.screen.blit(self.fonts["small"].render(label.upper(), True, MUTED), (x, stats_y))
            self.screen.blit(self.fonts["mid"].render(value, True, THICK), (x, stats_y + 18))

        message = self.t("solving", steps=self.solver_steps) if self.solver else self.message_text()
        color = SOLVER if self.solver else self.message_color
        self.draw_wrapped(message, color, PANEL_X, 532, w)
        for k, line in enumerate(self.t("keys").split("\n")):
            self.screen.blit(self.fonts["small"].render(line, True, MUTED), (PANEL_X, BOARD_Y + BOARD - 36 + k * 18))

        for code, x in (("ES", WIDTH - 96), ("EN", WIDTH - 56)):
            surf = self.fonts["mid"].render(code, True, USER if self.lang == code.lower() else THIN)
            self.screen.blit(surf, (x, 24))

    def draw(self):
        self.screen.fill(BG)
        self.draw_board()
        self.draw_panel()
        pygame.display.flip()

    def run(self):
        running = True
        while running:
            self.clock.tick(FPS)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    self.handle_key(event)
                elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                    self.handle_click(event.pos)
            if self.solver:
                # slow enough to watch at first, then speeds up on long searches
                self.advance_solver(3 if self.solver_steps < 200 else 40 if self.solver_steps < 2000 else 400)
            self.draw()
        self.persist()
        pygame.quit()


if __name__ == "__main__":
    App().run()
