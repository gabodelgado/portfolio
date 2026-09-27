"""Volley — a neon arcade take on Pong.

Play against the CPU (three difficulty levels) or a friend on the same keyboard.
First to 7 points wins. Sounds are synthesized at runtime, so there are no asset files.

Controls
    Left player   W / S
    Right player  ↑ / ↓   (2-player mode)
    P or Esc      pause
    L             switch language (ES / EN)
"""

import json
import math
import os
import random
from array import array

import pygame

WIDTH, HEIGHT = 960, 600
FPS = 120
WIN_SCORE = 7

PADDLE_W, PADDLE_H = 14, 96
PADDLE_SPEED = 520
BALL_SIZE = 14
BALL_START_SPEED = 430
BALL_MAX_SPEED = 1050
BALL_SPEEDUP = 1.06
MAX_BOUNCE_ANGLE = math.radians(55)

# Neon-on-CRT palette
BG = (8, 6, 20)
GRID = (26, 20, 52)
MAGENTA = (255, 46, 151)
CYAN = (0, 229, 255)
YELLOW = (255, 214, 10)
WHITE = (240, 240, 255)
DIM = (120, 110, 160)

SAVE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")

TEXT = {
    "es": {
        "subtitle": "ARCADE DE NEÓN",
        "vs_cpu": "1 JUGADOR  vs  CPU",
        "two_players": "2 JUGADORES",
        "difficulty": "DIFICULTAD",
        "easy": "FÁCIL", "normal": "NORMAL", "hard": "DIFÍCIL",
        "quit": "SALIR",
        "menu_hint": "↑ ↓ elegir   ← → dificultad   ENTER jugar   L idioma",
        "controls_1p": "Tú: W / S",
        "controls_2p": "Izquierda: W / S     Derecha: ↑ / ↓",
        "first_to": "Gana el primero en llegar a {n}",
        "paused": "PAUSA",
        "pause_hint": "P continuar   ESC menú",
        "wins": "¡{who} GANA!",
        "you": "TÚ", "cpu": "CPU", "left": "IZQUIERDA", "right": "DERECHA",
        "rally": "RALLY {n}",
        "best_rally": "Mejor rally: {n}",
        "longest_rally": "Rally más largo del partido: {n}",
        "end_hint": "ENTER revancha   ESC menú",
    },
    "en": {
        "subtitle": "NEON ARCADE",
        "vs_cpu": "1 PLAYER  vs  CPU",
        "two_players": "2 PLAYERS",
        "difficulty": "DIFFICULTY",
        "easy": "EASY", "normal": "NORMAL", "hard": "HARD",
        "quit": "QUIT",
        "menu_hint": "↑ ↓ choose   ← → difficulty   ENTER play   L language",
        "controls_1p": "You: W / S",
        "controls_2p": "Left: W / S     Right: ↑ / ↓",
        "first_to": "First to {n} wins",
        "paused": "PAUSED",
        "pause_hint": "P resume   ESC menu",
        "wins": "{who} WINS!",
        "you": "YOU", "cpu": "CPU", "left": "LEFT", "right": "RIGHT",
        "rally": "RALLY {n}",
        "best_rally": "Best rally: {n}",
        "longest_rally": "Longest rally this match: {n}",
        "end_hint": "ENTER rematch   ESC menu",
    },
}

# CPU tuning per difficulty: how fast it moves, how late it reacts, and how much it misjudges.
# "error" is the typical miss (in pixels) the CPU commits to for a whole approach; it grows with ball speed.
CPU_LEVELS = {
    "easy":   {"speed": 300, "reaction": 0.20, "error": 60},
    "normal": {"speed": 420, "reaction": 0.10, "error": 36},
    "hard":   {"speed": 560, "reaction": 0.05, "error": 22},
}
DIFFICULTIES = ["easy", "normal", "hard"]


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
        pass  # a read-only folder just means nothing is remembered


def make_tone(freq, ms, volume=0.35):
    """Square-wave beep with a short fade-out, built as raw 16-bit samples."""
    rate = 44100
    count = int(rate * ms / 1000)
    period = rate / freq
    amp = int(32767 * volume)
    samples = array("h")
    for i in range(count):
        fade = 1 - i / count
        samples.append(int(amp * fade) if (i % period) < period / 2 else -int(amp * fade))
    return pygame.mixer.Sound(buffer=samples.tobytes())


class Sounds:
    def __init__(self):
        self.enabled = False
        try:
            pygame.mixer.init(frequency=44100, size=-16, channels=1)
            self.paddle = make_tone(660, 60)
            self.wall = make_tone(440, 45, 0.25)
            self.score = make_tone(220, 260)
            self.win = make_tone(880, 420)
            self.enabled = True
        except pygame.error:
            pass  # no audio device — play silently

    def play(self, name):
        if self.enabled:
            getattr(self, name).play()


class Paddle:
    def __init__(self, x, color):
        self.rect = pygame.Rect(x, HEIGHT // 2 - PADDLE_H // 2, PADDLE_W, PADDLE_H)
        self.y = float(self.rect.y)
        self.color = color
        self.flash = 0.0

    def move(self, direction, dt, speed=PADDLE_SPEED):
        self.y += direction * speed * dt
        self.y = max(0, min(HEIGHT - PADDLE_H, self.y))
        self.rect.y = round(self.y)

    def reset(self):
        self.y = HEIGHT / 2 - PADDLE_H / 2
        self.rect.y = round(self.y)


class Ball:
    def __init__(self):
        self.trail = []
        self.reset(direction=random.choice((-1, 1)))

    def reset(self, direction):
        self.x = WIDTH / 2
        self.y = HEIGHT / 2
        angle = random.uniform(-0.45, 0.45)
        self.speed = BALL_START_SPEED
        self.vx = direction * self.speed * math.cos(angle)
        self.vy = self.speed * math.sin(angle)
        self.trail.clear()

    @property
    def rect(self):
        return pygame.Rect(round(self.x - BALL_SIZE / 2), round(self.y - BALL_SIZE / 2), BALL_SIZE, BALL_SIZE)


class Particle:
    def __init__(self, x, y, color):
        angle = random.uniform(0, math.tau)
        speed = random.uniform(80, 320)
        self.x, self.y = x, y
        self.vx, self.vy = math.cos(angle) * speed, math.sin(angle) * speed
        self.life = random.uniform(0.25, 0.6)
        self.max_life = self.life
        self.color = color

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.vx *= 0.92
        self.vy *= 0.92
        self.life -= dt


def font(size, bold=True):
    return pygame.font.SysFont("menlo,consolas,couriernew,monospace", size, bold=bold)


class Game:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Volley")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.sounds = Sounds()
        self.fonts = {"huge": font(96), "big": font(44), "mid": font(24), "small": font(16, bold=False)}
        self.save = load_save()
        self.lang = self.save.get("lang", "es") if self.save.get("lang") in TEXT else "es"
        self.difficulty = self.save.get("difficulty", "normal") if self.save.get("difficulty") in CPU_LEVELS else "normal"
        self.best_rally = int(self.save.get("best_rally", 0))
        self.menu_index = 0
        self.state = "menu"
        self.scanlines = self.build_scanlines()
        self.glow_cache = {}
        self.time = 0.0
        self.new_match(two_players=False)

    # ---------- helpers ----------
    def t(self, key, **kwargs):
        return TEXT[self.lang][key].format(**kwargs)

    def persist(self):
        self.save.update({"lang": self.lang, "difficulty": self.difficulty, "best_rally": self.best_rally})
        write_save(self.save)

    def build_scanlines(self):
        surf = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        for y in range(0, HEIGHT, 3):
            pygame.draw.line(surf, (0, 0, 0, 55), (0, y), (WIDTH, y))
        # soft vignette on the edges, like an old tube screen
        for i in range(40):
            alpha = int(90 * (1 - i / 40) ** 2)
            pygame.draw.rect(surf, (0, 0, 0, alpha), (i, i, WIDTH - 2 * i, HEIGHT - 2 * i), 1)
        return surf

    def glow(self, color, radius):
        key = (color, radius)
        if key not in self.glow_cache:
            surf = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
            for r in range(radius, 0, -2):
                alpha = int(70 * (1 - r / radius) ** 2)
                pygame.draw.circle(surf, (*color, alpha), (radius, radius), r)
            self.glow_cache[key] = surf
        return self.glow_cache[key]

    def text(self, content, size, color, center, glow=False):
        surf = self.fonts[size].render(content, True, color)
        rect = surf.get_rect(center=center)
        if glow:
            halo = self.fonts[size].render(content, True, color)
            halo.set_alpha(70)
            for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2)):
                self.screen.blit(halo, rect.move(dx, dy))
        self.screen.blit(surf, rect)
        return rect

    # ---------- match flow ----------
    def new_match(self, two_players):
        self.two_players = two_players
        self.left = Paddle(36, MAGENTA)
        self.right = Paddle(WIDTH - 36 - PADDLE_W, CYAN)
        self.ball = Ball()
        self.scores = [0, 0]
        self.particles = []
        self.rally = 0
        self.match_best_rally = 0
        self.serve_timer = 1.2
        self.cpu_target = HEIGHT / 2
        self.cpu_think = 0.0
        self.cpu_error = None
        self.shake = 0.0
        self.winner = None

    def point(self, scorer):
        self.scores[scorer] += 1
        self.sounds.play("score")
        self.shake = 0.35
        x = WIDTH - 10 if scorer == 0 else 10
        for _ in range(40):
            self.particles.append(Particle(x, self.ball.y, YELLOW))
        self.rally = 0
        if self.scores[scorer] >= WIN_SCORE:
            self.winner = scorer
            self.state = "over"
            self.sounds.play("win")
            self.persist()
        else:
            # the player who lost the point receives the serve
            self.ball.reset(direction=-1 if scorer == 0 else 1)
            self.left.reset()
            self.right.reset()
            self.serve_timer = 1.0

    def hit_paddle(self, paddle, direction):
        ball = self.ball
        offset = (ball.y - paddle.rect.centery) / (PADDLE_H / 2)
        offset = max(-1, min(1, offset))
        angle = offset * MAX_BOUNCE_ANGLE
        ball.speed = min(ball.speed * BALL_SPEEDUP, BALL_MAX_SPEED)
        ball.vx = direction * ball.speed * math.cos(angle)
        ball.vy = ball.speed * math.sin(angle)
        paddle.flash = 0.15
        self.rally += 1
        self.match_best_rally = max(self.match_best_rally, self.rally)
        if self.rally > self.best_rally:
            self.best_rally = self.rally
        self.sounds.play("paddle")
        for _ in range(12):
            self.particles.append(Particle(ball.x, ball.y, paddle.color))

    def update_cpu(self, dt):
        level = CPU_LEVELS[self.difficulty]
        self.cpu_think -= dt
        if self.cpu_think <= 0:
            self.cpu_think = level["reaction"]
            if self.ball.vx > 0:
                if self.cpu_error is None:
                    pressure = self.ball.speed / BALL_START_SPEED
                    self.cpu_error = random.gauss(0, level["error"] * pressure)
                # predict where the ball will cross the paddle line, bouncing off walls
                time_to_reach = (self.right.rect.left - self.ball.x) / self.ball.vx
                y = self.ball.y + self.ball.vy * time_to_reach
                span = HEIGHT - BALL_SIZE
                y = (y - BALL_SIZE / 2) % (2 * span)
                if y > span:
                    y = 2 * span - y
                self.cpu_target = y + BALL_SIZE / 2 + self.cpu_error
            else:
                self.cpu_error = None
                self.cpu_target = HEIGHT / 2
        diff = self.cpu_target - self.right.rect.centery
        if abs(diff) > 8:
            self.right.move(1 if diff > 0 else -1, dt, level["speed"])

    def update_play(self, dt):
        keys = pygame.key.get_pressed()
        self.left.move(keys[pygame.K_s] - keys[pygame.K_w], dt)
        if self.two_players:
            self.right.move(keys[pygame.K_DOWN] - keys[pygame.K_UP], dt)
        else:
            self.update_cpu(dt)

        for paddle in (self.left, self.right):
            paddle.flash = max(0, paddle.flash - dt)

        if self.serve_timer > 0:
            self.serve_timer -= dt
            return

        ball = self.ball
        # sub-steps keep a fast ball from tunnelling through a paddle
        steps = max(1, int(ball.speed * dt / (BALL_SIZE / 2)) + 1)
        for _ in range(steps):
            ball.x += ball.vx * dt / steps
            ball.y += ball.vy * dt / steps
            if ball.y - BALL_SIZE / 2 <= 0 and ball.vy < 0:
                ball.y = BALL_SIZE / 2
                ball.vy = -ball.vy
                self.sounds.play("wall")
            elif ball.y + BALL_SIZE / 2 >= HEIGHT and ball.vy > 0:
                ball.y = HEIGHT - BALL_SIZE / 2
                ball.vy = -ball.vy
                self.sounds.play("wall")
            if ball.vx < 0 and ball.rect.colliderect(self.left.rect):
                ball.x = self.left.rect.right + BALL_SIZE / 2
                self.hit_paddle(self.left, 1)
            elif ball.vx > 0 and ball.rect.colliderect(self.right.rect):
                ball.x = self.right.rect.left - BALL_SIZE / 2
                self.hit_paddle(self.right, -1)

        ball.trail.append((ball.x, ball.y))
        if len(ball.trail) > 14:
            ball.trail.pop(0)

        if ball.x < -BALL_SIZE:
            self.point(1)
        elif ball.x > WIDTH + BALL_SIZE:
            self.point(0)

    # ---------- drawing ----------
    def draw_background(self):
        self.screen.fill(BG)
        # synthwave floor grid
        for x in range(0, WIDTH, 48):
            pygame.draw.line(self.screen, GRID, (x, 0), (x, HEIGHT))
        for y in range(0, HEIGHT, 48):
            pygame.draw.line(self.screen, GRID, (0, y), (WIDTH, y))

    def draw_court(self, offset):
        ox, oy = offset
        for y in range(10, HEIGHT, 30):
            pygame.draw.rect(self.screen, DIM, (WIDTH // 2 - 2 + ox, y + oy, 4, 16))
        self.text(str(self.scores[0]), "huge", MAGENTA, (WIDTH // 2 - 110 + ox, 80 + oy), glow=True)
        self.text(str(self.scores[1]), "huge", CYAN, (WIDTH // 2 + 110 + ox, 80 + oy), glow=True)

        for paddle in (self.left, self.right):
            rect = paddle.rect.move(ox, oy)
            halo = self.glow(paddle.color, 70)
            self.screen.blit(halo, halo.get_rect(center=rect.center))
            color = WHITE if paddle.flash > 0 else paddle.color
            pygame.draw.rect(self.screen, color, rect, border_radius=5)

        ball = self.ball
        for i, (tx, ty) in enumerate(ball.trail):
            size = max(2, int(BALL_SIZE * (i + 1) / len(ball.trail) * 0.8))
            alpha_surf = pygame.Surface((size, size), pygame.SRCALPHA)
            alpha_surf.fill((*YELLOW, int(150 * (i + 1) / len(ball.trail))))
            self.screen.blit(alpha_surf, (tx - size / 2 + ox, ty - size / 2 + oy))
        halo = self.glow(YELLOW, 40)
        self.screen.blit(halo, halo.get_rect(center=(ball.x + ox, ball.y + oy)))
        pygame.draw.rect(self.screen, WHITE, ball.rect.move(ox, oy), border_radius=3)

        for p in self.particles:
            alpha = max(0, int(255 * p.life / p.max_life))
            surf = pygame.Surface((4, 4), pygame.SRCALPHA)
            surf.fill((*p.color, alpha))
            self.screen.blit(surf, (p.x + ox, p.y + oy))

        if self.rally >= 3:
            self.text(self.t("rally", n=self.rally), "small", YELLOW, (WIDTH // 2, HEIGHT - 24))
        if self.serve_timer > 0 and self.state == "play":
            count = math.ceil(self.serve_timer / 0.34)
            if count <= 3:
                self.text(str(count), "big", WHITE, (WIDTH // 2, HEIGHT // 2 - 60), glow=True)

    def draw_menu(self):
        self.draw_background()
        bob = math.sin(self.time * 2) * 6
        self.text("VOLLEY", "huge", MAGENTA, (WIDTH // 2, 130 + bob), glow=True)
        self.text(self.t("subtitle"), "mid", CYAN, (WIDTH // 2, 200))

        options = [self.t("vs_cpu"), self.t("two_players"), self.t("quit")]
        for i, label in enumerate(options):
            y = 290 + i * 62
            selected = i == self.menu_index
            color = YELLOW if selected else DIM
            if selected:
                box = pygame.Rect(0, 0, 440, 48)
                box.center = (WIDTH // 2, y)
                pygame.draw.rect(self.screen, YELLOW, box, 2, border_radius=8)
            self.text(label, "mid", color, (WIDTH // 2, y))

        diff_label = self.t("difficulty") + ":  ◀ " + self.t(self.difficulty) + " ▶"
        self.text(diff_label, "small", CYAN if self.menu_index == 0 else DIM, (WIDTH // 2, 480))
        self.text(self.t("best_rally", n=self.best_rally), "small", DIM, (WIDTH // 2, 515))
        self.text(self.t("menu_hint"), "small", DIM, (WIDTH // 2, HEIGHT - 30))
        self.text("ES", "small", YELLOW if self.lang == "es" else DIM, (WIDTH - 78, 24))
        self.text("|", "small", DIM, (WIDTH - 60, 24))
        self.text("EN", "small", YELLOW if self.lang == "en" else DIM, (WIDTH - 42, 24))

    def draw_overlay(self, title, lines, color):
        veil = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        veil.fill((8, 6, 20, 190))
        self.screen.blit(veil, (0, 0))
        self.text(title, "big", color, (WIDTH // 2, HEIGHT // 2 - 50), glow=True)
        for i, line in enumerate(lines):
            self.text(line, "small", WHITE if i == 0 else DIM, (WIDTH // 2, HEIGHT // 2 + 10 + i * 30))

    def draw(self):
        if self.state == "menu":
            self.draw_menu()
        else:
            offset = (0, 0)
            if self.shake > 0:
                amount = int(10 * self.shake)
                offset = (random.randint(-amount, amount), random.randint(-amount, amount))
            self.draw_background()
            self.draw_court(offset)
            if self.state == "play" and self.serve_timer > 0.9 and sum(self.scores) == 0:
                hint = self.t("controls_2p") if self.two_players else self.t("controls_1p")
                self.text(hint, "small", WHITE, (WIDTH // 2, HEIGHT // 2 + 40))
                self.text(self.t("first_to", n=WIN_SCORE), "small", DIM, (WIDTH // 2, HEIGHT // 2 + 66))
            if self.state == "pause":
                self.draw_overlay(self.t("paused"), [self.t("pause_hint")], YELLOW)
            elif self.state == "over":
                if self.two_players:
                    who = self.t("left") if self.winner == 0 else self.t("right")
                else:
                    who = self.t("you") if self.winner == 0 else self.t("cpu")
                color = MAGENTA if self.winner == 0 else CYAN
                self.draw_overlay(self.t("wins", who=who),
                                  [self.t("longest_rally", n=self.match_best_rally), self.t("end_hint")], color)
        self.screen.blit(self.scanlines, (0, 0))
        pygame.display.flip()

    # ---------- input ----------
    def toggle_lang(self):
        self.lang = "en" if self.lang == "es" else "es"
        self.persist()

    def handle_key(self, key):
        if key == pygame.K_l:
            self.toggle_lang()
            return True
        if self.state == "menu":
            if key in (pygame.K_UP, pygame.K_w):
                self.menu_index = (self.menu_index - 1) % 3
            elif key in (pygame.K_DOWN, pygame.K_s):
                self.menu_index = (self.menu_index + 1) % 3
            elif key in (pygame.K_LEFT, pygame.K_RIGHT, pygame.K_a, pygame.K_d):
                step = -1 if key in (pygame.K_LEFT, pygame.K_a) else 1
                idx = (DIFFICULTIES.index(self.difficulty) + step) % len(DIFFICULTIES)
                self.difficulty = DIFFICULTIES[idx]
                self.persist()
            elif key in (pygame.K_RETURN, pygame.K_SPACE, pygame.K_KP_ENTER):
                if self.menu_index == 2:
                    return False
                self.new_match(two_players=self.menu_index == 1)
                self.state = "play"
            elif key == pygame.K_ESCAPE:
                return False
        elif self.state == "play":
            if key in (pygame.K_p, pygame.K_ESCAPE):
                self.state = "pause"
        elif self.state == "pause":
            if key == pygame.K_p:
                self.state = "play"
            elif key == pygame.K_ESCAPE:
                self.persist()
                self.state = "menu"
        elif self.state == "over":
            if key in (pygame.K_RETURN, pygame.K_SPACE, pygame.K_KP_ENTER):
                self.new_match(self.two_players)
                self.state = "play"
            elif key == pygame.K_ESCAPE:
                self.state = "menu"
        return True

    def run(self):
        running = True
        while running:
            dt = min(self.clock.tick(FPS) / 1000, 1 / 30)
            self.time += dt
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    running = self.handle_key(event.key)
                elif event.type == pygame.WINDOWFOCUSLOST and self.state == "play":
                    self.state = "pause"
            if self.state == "play":
                self.update_play(dt)
            self.shake = max(0, self.shake - dt)
            for p in self.particles:
                p.update(dt)
            self.particles = [p for p in self.particles if p.life > 0]
            self.draw()
        self.persist()
        pygame.quit()


if __name__ == "__main__":
    Game().run()
