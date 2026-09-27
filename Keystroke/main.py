"""Keystroke — a typing speed test with a typewriter soul.

Type the words as fast and accurately as you can. The clock starts with your first key.
Your best runs are saved per duration, so you can track how you improve.

Controls
    ← / →      choose duration (15, 30 or 60 seconds)
    Enter      start / try again
    Tab        restart the current test
    Esc        back to the menu
    Ctrl + L   switch language (ES / EN) — words and interface
"""

import json
import os
import random
import time
from datetime import datetime

import pygame

WIDTH, HEIGHT = 960, 620
FPS = 60
DURATIONS = [15, 30, 60]
TEXT_WIDTH = 690
VISIBLE_LINES = 3
LIVE_STATS_AFTER = 2  # seconds before the live speed is shown

# Paper, ink and a typewriter ribbon red
PAPER = (243, 234, 215)
CARD = (251, 246, 234)
INK = (43, 38, 34)
FAINT = (185, 173, 150)
SOFT = (122, 110, 92)
RED = (179, 54, 43)
GREEN = (61, 110, 72)
RULE = (226, 214, 190)

SAVE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")

WORDS = {
    "es": (
        "de la que el en y a los se del las un por con no una su para es al lo como más pero sus le ya o "
        "este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos "
        "durante todos uno les ni contra otros ese eso ante ellos esto mí antes algunos qué unos yo otro "
        "otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo "
        "nosotros casa tiempo vida día mundo año hombre parte país ciudad forma caso manera lugar trabajo "
        "gobierno momento agua noche familia historia punto mujer mano ojos cosa tierra camino fuerza "
        "palabra padre madre nombre libro calle mesa puerta café música ciencia idea viaje ventana "
        "hacer decir poder ir ver dar saber querer llegar pasar deber poner parecer quedar creer hablar "
        "llevar dejar seguir encontrar llamar venir pensar salir volver tomar conocer vivir sentir tratar "
        "mirar contar empezar esperar buscar existir entrar trabajar escribir perder producir ocurrir "
        "entender pedir recibir recordar terminar permitir aparecer conseguir comenzar servir sacar "
        "grande nuevo mismo bueno mejor largo claro fácil difícil rápido lento feliz joven viejo alto "
        "bajo fuerte libre simple cierto propio único último pequeño general mayor posible siempre nunca "
        "ahora luego aquí allí hoy mañana tarde pronto bien mal así juntos además mientras según"
    ).split(),
    "en": (
        "the be to of and a in that have it for not on with he as you do at this but his by from they "
        "we say her she or an will my one all would there their what so up out if about who get which go "
        "me when make can like time no just him know take people into year your good some could them see "
        "other than then now look only come its over think also back after use two how our work first "
        "well way even new want because any these give day most us great world between house under "
        "never last place small found still own point city sound light story music water night family "
        "window coffee river paper letter garden number market friend answer country picture morning "
        "should around while might every those both again move right large often thing turn long "
        "change follow start begin write read learn keep bring hold stand open close build grow travel "
        "remember explore create finish simple quick clear strong quiet bright early later always "
        "together enough before through where little another without between problem system program "
        "question during company always important until school should across second almost against"
    ).split(),
}
# drop repeated words while keeping the list order
WORDS = {lang: list(dict.fromkeys(words)) for lang, words in WORDS.items()}

TEXT = {
    "es": {
        "tagline": "Prueba tu velocidad de escritura",
        "welcome": "Bienvenido",
        "ask_name": "¿Cómo te llamas? Guardaremos tus récords con tu nombre.",
        "name_hint": "Escribe tu nombre y presiona Enter",
        "hello": "Hola, {name}",
        "duration": "Duración",
        "seconds": "{n} s",
        "start": "Presiona Enter para comenzar",
        "menu_hint": "Flechas duración    Enter comenzar    Ctrl+L idioma    Esc salir",
        "records": "Tus mejores marcas · {n} s",
        "no_records": "Aún no hay marcas. ¡Estrena la máquina!",
        "wpm": "ppm",
        "wpm_long": "palabras por minuto",
        "accuracy": "precisión",
        "time_left": "segundos",
        "begin_typing": "Empieza a escribir cuando quieras — el reloj arranca con tu primera tecla",
        "test_hint": "Tab reiniciar    Esc menú",
        "result_title": "Resultado",
        "new_record": "¡Nuevo récord!",
        "chars": "Caracteres: {ok} correctos · {bad} errores",
        "raw": "Velocidad bruta: {n} ppm",
        "result_hint": "Enter repetir    Esc menú",
        "change_name": "Tab cambiar nombre",
        "months": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    },
    "en": {
        "tagline": "Test your typing speed",
        "welcome": "Welcome",
        "ask_name": "What's your name? We'll keep your records under it.",
        "name_hint": "Type your name and press Enter",
        "hello": "Hi, {name}",
        "duration": "Duration",
        "seconds": "{n} s",
        "start": "Press Enter to start",
        "menu_hint": "Arrows duration    Enter start    Ctrl+L language    Esc quit",
        "records": "Your best runs · {n} s",
        "no_records": "No runs yet. Take the typewriter for a spin!",
        "wpm": "wpm",
        "wpm_long": "words per minute",
        "accuracy": "accuracy",
        "time_left": "seconds",
        "begin_typing": "Start typing whenever you're ready — the clock starts with your first key",
        "test_hint": "Tab restart    Esc menu",
        "result_title": "Result",
        "new_record": "New record!",
        "chars": "Characters: {ok} correct · {bad} errors",
        "raw": "Raw speed: {n} wpm",
        "result_hint": "Enter try again    Esc menu",
        "change_name": "Tab change name",
        "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
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
            json.dump(data, f, ensure_ascii=False, indent=1)
    except OSError:
        pass


def fmt_num(n, lang, decimals=0):
    """1.234,5 in Spanish, 1,234.5 in English."""
    text = f"{n:,.{decimals}f}"
    if lang == "es":
        text = text.replace(",", "\x00").replace(".", ",").replace("\x00", ".")
    return text


def font(size, bold=False):
    return pygame.font.SysFont("americantypewriter,couriernew,courier,monospace", size, bold=bold)


class TypingTest:
    def __init__(self, lang, duration):
        self.lang = lang
        self.duration = duration
        self.words = []
        self.target = ""
        self.extend(250)
        self.typed = ""
        self.started_at = None
        self.finished = False
        self.keystrokes = 0
        self.errors = 0

    def extend(self, count):
        pool = WORDS[self.lang]
        last = self.words[-1] if self.words else None
        for _ in range(count):
            word = random.choice(pool)
            while word == last:
                word = random.choice(pool)
            self.words.append(word)
            last = word
        self.target = " ".join(self.words)

    def elapsed(self):
        if self.started_at is None:
            return 0.0
        return min(time.monotonic() - self.started_at, self.duration)

    def time_left(self):
        return self.duration - self.elapsed()

    def type_text(self, text):
        if self.finished:
            return
        if self.started_at is None:
            self.started_at = time.monotonic()
        for ch in text:
            if len(self.typed) >= len(self.target) - 20:
                self.extend(100)
            expected = self.target[len(self.typed)]
            self.keystrokes += 1
            if ch != expected:
                self.errors += 1
            self.typed += ch

    def backspace(self, whole_word=False):
        if self.finished or not self.typed:
            return
        if whole_word:
            trimmed = self.typed.rstrip(" ")
            cut = trimmed.rfind(" ")
            self.typed = trimmed[: cut + 1] if cut != -1 else ""
        else:
            self.typed = self.typed[:-1]

    def correct_chars(self):
        return sum(1 for a, b in zip(self.typed, self.target) if a == b)

    def wpm(self):
        minutes = max(self.elapsed(), 1) / 60
        return self.correct_chars() / 5 / minutes

    def raw_wpm(self):
        minutes = max(self.elapsed(), 1) / 60
        return len(self.typed) / 5 / minutes

    def accuracy(self):
        if not self.keystrokes:
            return 100.0
        return max(0.0, (self.keystrokes - self.errors) / self.keystrokes * 100)

    def update(self):
        if self.started_at is not None and not self.finished and self.time_left() <= 0:
            self.finished = True


class App:
    def __init__(self):
        pygame.init()
        pygame.display.set_caption("Keystroke")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.fonts = {
            "logo": font(58, bold=True),
            "huge": font(84, bold=True),
            "big": font(34, bold=True),
            "type": font(30),
            "mid": font(21),
            "small": font(16),
        }
        self.glyphs = {}
        self.save = load_save()
        self.lang = self.save.get("lang") if self.save.get("lang") in TEXT else "es"
        self.duration = self.save.get("duration") if self.save.get("duration") in DURATIONS else 30
        name = self.save.get("name", "")
        self.name = name[:20] if isinstance(name, str) else ""
        records = self.save.get("records", [])
        self.records = [
            r for r in records if isinstance(r, dict)
            and isinstance(r.get("wpm"), (int, float)) and isinstance(r.get("accuracy"), (int, float))
        ] if isinstance(records, list) else []
        self.name_input = ""
        self.state = "menu" if self.name else "welcome"
        self.test = None
        self.last_result = None
        pygame.key.start_text_input()

    # ---------- helpers ----------
    def t(self, key, **kwargs):
        value = TEXT[self.lang][key]
        return value.format(**kwargs) if kwargs else value

    def persist(self):
        self.save.update({"lang": self.lang, "duration": self.duration, "name": self.name, "records": self.records})
        write_save(self.save)

    def draw_text(self, content, size, color, pos, anchor="center"):
        surf = self.fonts[size].render(content, True, color)
        rect = surf.get_rect(**{anchor: pos})
        self.screen.blit(surf, rect)
        return rect

    def glyph(self, ch, color):
        key = (ch, color)
        if key not in self.glyphs:
            self.glyphs[key] = self.fonts["type"].render(ch, True, color)
        return self.glyphs[key]

    def best_records(self, duration):
        runs = [r for r in self.records if r.get("duration") == duration]
        runs.sort(key=lambda r: r.get("wpm", 0), reverse=True)
        return runs[:5]

    def fmt_date(self, iso):
        try:
            d = datetime.fromisoformat(iso)
        except (TypeError, ValueError):
            return ""
        month = self.t("months")[d.month - 1]
        return f"{d.day} {month} {d.year}" if self.lang == "es" else f"{month} {d.day}, {d.year}"

    def draw_paper(self):
        self.screen.fill(PAPER)
        card = pygame.Rect(60, 40, WIDTH - 120, HEIGHT - 80)
        shadow = card.move(0, 6)
        pygame.draw.rect(self.screen, (225, 212, 186), shadow, border_radius=6)
        pygame.draw.rect(self.screen, CARD, card, border_radius=6)
        # ruled lines and a red margin, like typewriter paper
        for y in range(card.top + 110, card.bottom - 20, 34):
            pygame.draw.line(self.screen, RULE, (card.left + 20, y), (card.right - 20, y))
        pygame.draw.line(self.screen, (230, 170, 160), (card.left + 70, card.top + 10), (card.left + 70, card.bottom - 10), 2)
        self.draw_lang_switch()
        return card

    def draw_lang_switch(self):
        self.draw_text("ES", "small", RED if self.lang == "es" else FAINT, (WIDTH - 136, 66))
        self.draw_text("·", "small", FAINT, (WIDTH - 118, 66))
        self.draw_text("EN", "small", RED if self.lang == "en" else FAINT, (WIDTH - 100, 66))

    # ---------- screens ----------
    def draw_welcome(self):
        self.draw_paper()
        self.draw_text("Keystroke", "logo", INK, (WIDTH // 2, 150))
        self.draw_text(self.t("tagline"), "mid", SOFT, (WIDTH // 2, 205))
        self.draw_text(self.t("welcome"), "big", RED, (WIDTH // 2, 290))
        self.draw_text(self.t("ask_name"), "mid", INK, (WIDTH // 2, 340))
        box = pygame.Rect(0, 0, 420, 58)
        box.center = (WIDTH // 2, 410)
        pygame.draw.rect(self.screen, (255, 252, 244), box, border_radius=6)
        pygame.draw.rect(self.screen, INK, box, 2, border_radius=6)
        rect = self.draw_text(self.name_input, "type", INK, box.center)
        if int(time.monotonic() * 2) % 2 == 0:
            x = rect.right + 3 if self.name_input else box.centerx
            pygame.draw.line(self.screen, RED, (x, box.top + 14), (x, box.bottom - 14), 2)
        self.draw_text(self.t("name_hint"), "small", SOFT, (WIDTH // 2, 470))

    def draw_menu(self):
        self.draw_paper()
        self.draw_text("Keystroke", "logo", INK, (WIDTH // 2, 120))
        self.draw_text(self.t("hello", name=self.name), "mid", RED, (WIDTH // 2, 175))

        self.draw_text(self.t("duration"), "small", SOFT, (WIDTH // 2, 232))
        total = len(DURATIONS)
        for i, d in enumerate(DURATIONS):
            x = WIDTH // 2 + (i - (total - 1) / 2) * 120
            selected = d == self.duration
            key = pygame.Rect(0, 0, 96, 52)
            key.center = (x, 280)
            # typewriter key caps
            pygame.draw.rect(self.screen, (205, 192, 166), key.move(0, 4), border_radius=26)
            pygame.draw.rect(self.screen, INK if selected else (255, 252, 244), key, border_radius=26)
            pygame.draw.rect(self.screen, INK, key, 2, border_radius=26)
            self.draw_text(self.t("seconds", n=d), "mid", CARD if selected else INK, key.center)

        self.draw_text(self.t("start"), "mid", INK, (WIDTH // 2, 348))

        self.draw_text(self.t("records", n=self.duration), "small", SOFT, (WIDTH // 2, 398))
        best = self.best_records(self.duration)
        if not best:
            self.draw_text(self.t("no_records"), "small", FAINT, (WIDTH // 2, 432))
        for i, run in enumerate(best):
            y = 430 + i * 24
            color = RED if i == 0 else INK
            self.draw_text(f"{i + 1}.", "small", color, (WIDTH // 2 - 200, y), "midleft")
            self.draw_text(f"{fmt_num(run['wpm'], self.lang)} {self.t('wpm')}", "small", color, (WIDTH // 2 - 160, y), "midleft")
            self.draw_text(f"{fmt_num(run['accuracy'], self.lang)} %", "small", SOFT, (WIDTH // 2 - 40, y), "midleft")
            self.draw_text(self.fmt_date(run.get("date", "")), "small", SOFT, (WIDTH // 2 + 200, y), "midright")

        self.draw_text(self.t("menu_hint"), "small", SOFT, (WIDTH // 2, HEIGHT - 92))
        self.draw_text(self.t("change_name"), "small", FAINT, (WIDTH // 2, HEIGHT - 66))

    def layout_lines(self):
        """Split the target text into lines that fit TEXT_WIDTH; returns (start, end) index pairs."""
        test = self.test
        space_w = self.glyph(" ", INK).get_width()
        lines, start, x, i = [], 0, 0, 0
        for word in test.words:
            w = sum(self.glyph(c, INK).get_width() for c in word)
            if x and x + w > TEXT_WIDTH:
                lines.append((start, i))
                start, x = i, 0
            x += w + space_w
            i += len(word) + 1
        lines.append((start, len(test.target)))
        return lines

    def draw_test(self):
        card = self.draw_paper()
        test = self.test
        left = test.time_left() if test.started_at else test.duration
        self.draw_text(f"{int(left + 0.999)}", "big", RED if left <= 5 and test.started_at else INK, (card.left + 110, card.top + 60), "midleft")
        self.draw_text(self.t("time_left"), "small", SOFT, (card.left + 110, card.top + 88), "midleft")
        if test.started_at and test.elapsed() >= LIVE_STATS_AFTER:
            self.draw_text(f"{fmt_num(test.wpm(), self.lang)} {self.t('wpm')}", "mid", INK, (card.right - 60, card.top + 62), "midright")
            self.draw_text(f"{fmt_num(test.accuracy(), self.lang)} % {self.t('accuracy')}", "small", SOFT, (card.right - 60, card.top + 90), "midright")

        lines = self.layout_lines()
        caret = len(test.typed)
        current = next(i for i, (s, e) in enumerate(lines) if caret < e or i == len(lines) - 1)
        first = max(0, current - 1)
        line_h = 68
        top = card.top + 180
        caret_pos = None
        for row, (s, e) in enumerate(lines[first:first + VISIBLE_LINES]):
            x = card.left + 90
            y = top + row * line_h
            for idx in range(s, e):
                ch = test.target[idx]
                if idx < len(test.typed):
                    ok = test.typed[idx] == ch
                    color = INK if ok else RED
                    shown = ch if ok or ch != " " else "·"
                else:
                    color, shown = FAINT, ch
                surf = self.glyph(shown, color)
                if idx == caret:
                    caret_pos = (x, y)
                self.screen.blit(surf, (x, y))
                if idx < len(test.typed) and test.typed[idx] != ch:
                    pygame.draw.line(self.screen, RED, (x, y + surf.get_height() - 2), (x + surf.get_width(), y + surf.get_height() - 2), 2)
                x += surf.get_width()
        if caret_pos and (int(time.monotonic() * 2.2) % 2 == 0 or test.started_at is None):
            cx, cy = caret_pos
            pygame.draw.line(self.screen, RED, (cx - 1, cy + 4), (cx - 1, cy + 36), 3)

        if test.started_at is None:
            self.draw_text(self.t("begin_typing"), "small", SOFT, (WIDTH // 2, card.bottom - 70))
        self.draw_text(self.t("test_hint"), "small", FAINT, (WIDTH // 2, card.bottom - 36))

    def draw_results(self):
        card = self.draw_paper()
        r = self.last_result
        self.draw_text(self.t("result_title"), "mid", SOFT, (WIDTH // 2, card.top + 70))
        self.draw_text(fmt_num(r["wpm"], self.lang), "huge", INK, (WIDTH // 2, card.top + 160))
        self.draw_text(self.t("wpm_long"), "mid", SOFT, (WIDTH // 2, card.top + 220))
        if r["record"]:
            stamp = self.fonts["big"].render(self.t("new_record"), True, RED)
            stamp = pygame.transform.rotate(stamp, 8)
            self.screen.blit(stamp, stamp.get_rect(center=(card.right - 170, card.top + 140)))
        self.draw_text(f"{fmt_num(r['accuracy'], self.lang, 1)} % {self.t('accuracy')}", "big", GREEN if r["accuracy"] >= 95 else INK, (WIDTH // 2, card.top + 300))
        self.draw_text(self.t("chars", ok=fmt_num(r["correct"], self.lang), bad=fmt_num(r["errors"], self.lang)), "small", SOFT, (WIDTH // 2, card.top + 350))
        self.draw_text(self.t("raw", n=fmt_num(r["raw"], self.lang)), "small", SOFT, (WIDTH // 2, card.top + 376))
        self.draw_text(self.t("result_hint"), "mid", INK, (WIDTH // 2, card.bottom - 60))

    # ---------- flow ----------
    def start_test(self):
        self.test = TypingTest(self.lang, self.duration)
        self.state = "test"

    def finish_test(self):
        test = self.test
        previous = self.best_records(self.duration)
        wpm = round(test.wpm())
        record = test.started_at is not None and wpm > 0 and (not previous or wpm > previous[0]["wpm"])
        self.last_result = {
            "wpm": wpm,
            "raw": round(test.raw_wpm()),
            "accuracy": test.accuracy(),
            "correct": test.correct_chars(),
            "errors": test.errors,
            "record": record,
        }
        if wpm > 0:
            self.records.append({
                "wpm": wpm, "accuracy": round(test.accuracy(), 1), "duration": self.duration,
                "lang": self.lang, "date": datetime.now().isoformat(timespec="minutes"),
            })
            # keep the file small: the best 20 runs per duration
            kept = []
            for d in DURATIONS:
                runs = sorted((r for r in self.records if r.get("duration") == d), key=lambda r: r["wpm"], reverse=True)
                kept.extend(runs[:20])
            self.records = kept
            self.persist()
        self.state = "results"

    def toggle_lang(self):
        self.lang = "en" if self.lang == "es" else "es"
        self.persist()
        if self.state == "test":
            self.start_test()

    def handle_key(self, event):
        mods = pygame.key.get_mods()
        if event.key == pygame.K_l and mods & (pygame.KMOD_CTRL | pygame.KMOD_META):
            self.toggle_lang()
            return True
        if self.state == "welcome":
            if event.key in (pygame.K_RETURN, pygame.K_KP_ENTER) and self.name_input.strip():
                self.name = self.name_input.strip()
                self.persist()
                self.state = "menu"
            elif event.key == pygame.K_BACKSPACE:
                self.name_input = self.name_input[:-1]
            elif event.key == pygame.K_ESCAPE:
                if not self.name:
                    return False
                self.state = "menu"
        elif self.state == "menu":
            if event.key == pygame.K_LEFT:
                self.duration = DURATIONS[(DURATIONS.index(self.duration) - 1) % len(DURATIONS)]
                self.persist()
            elif event.key == pygame.K_RIGHT:
                self.duration = DURATIONS[(DURATIONS.index(self.duration) + 1) % len(DURATIONS)]
                self.persist()
            elif event.key in (pygame.K_RETURN, pygame.K_KP_ENTER):
                self.start_test()
            elif event.key == pygame.K_TAB:
                self.name_input = self.name
                self.state = "welcome"
            elif event.key == pygame.K_ESCAPE:
                return False
        elif self.state == "test":
            if event.key == pygame.K_ESCAPE:
                self.state = "menu"
            elif event.key == pygame.K_TAB:
                self.start_test()
            elif event.key == pygame.K_BACKSPACE:
                self.test.backspace(whole_word=bool(mods & (pygame.KMOD_ALT | pygame.KMOD_CTRL)))
        elif self.state == "results":
            if event.key in (pygame.K_RETURN, pygame.K_KP_ENTER, pygame.K_TAB):
                self.start_test()
            elif event.key == pygame.K_ESCAPE:
                self.state = "menu"
        return True

    def handle_text(self, text):
        mods = pygame.key.get_mods()
        if mods & (pygame.KMOD_CTRL | pygame.KMOD_META):
            return
        if self.state == "welcome":
            if len(self.name_input) < 20:
                self.name_input += text.replace("\t", "")
        elif self.state == "test":
            self.test.type_text(text)

    def run(self):
        running = True
        while running:
            self.clock.tick(FPS)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    running = self.handle_key(event)
                elif event.type == pygame.TEXTINPUT:
                    self.handle_text(event.text)
            if self.state == "test":
                self.test.update()
                if self.test.finished:
                    self.finish_test()

            if self.state == "welcome":
                self.draw_welcome()
            elif self.state == "menu":
                self.draw_menu()
            elif self.state == "test":
                self.draw_test()
            else:
                self.draw_results()
            pygame.display.flip()
        self.persist()
        pygame.quit()


if __name__ == "__main__":
    App().run()
