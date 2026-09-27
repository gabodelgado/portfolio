# 🏓 Volley

A neon arcade take on Pong. Play the CPU at three difficulty levels, or a friend on the same keyboard. First to 7 wins.

**[▶ Play it in your browser](https://gabodelgado.github.io/portfolio/Volley/web/)**

![Volley](screenshot.png)

## Highlights

- **A CPU that plays fair:** it predicts where the ball will land, bounces included, but reacts with a delay and commits to a small aiming error that grows as the ball speeds up. In simulated matches against a near-perfect opponent, it returned about 75% of balls on Easy, 81% on Normal and 89% on Hard.
- **Physics that don't cheat:** the ball speeds up with every hit, and its angle depends on where it hits the paddle. Movement is split into small sub-steps, so even a very fast ball can't pass through a paddle.
- **No asset files:** every sound is synthesized when the game starts, and the glow, trail, particles, screen shake and CRT scanlines are all drawn in code.
- **Remembers you:** your best rally, difficulty and language are saved between games.
- **Two languages:** Spanish and English.

## Controls

| Key | Action |
|---|---|
| W / S | Move the left paddle |
| ↑ / ↓ | Move the right paddle (2-player mode) |
| ← / → | Change difficulty (menu) |
| Enter | Play / rematch |
| P or Esc | Pause |
| L | Switch language |

## Run it

From the repository's root folder:

```bash
pip install -r requirements.txt
python Volley/main.py
```

## Browser version

[`web/`](web/) holds a JavaScript port so the game can be played without installing anything. It follows the Python version's rules, colors and tuning, and is drawn with the canvas, with touch controls on phones (drag your finger to move). Records are kept in the browser.
