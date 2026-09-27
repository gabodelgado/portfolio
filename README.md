# Gabriel Delgado — Portfolio

**[▶ Visit the portfolio site](https://gabodelgado.github.io/portfolio/)** · [![Tests](https://github.com/gabodelgado/portfolio/actions/workflows/tests.yml/badge.svg)](https://github.com/gabodelgado/portfolio/actions/workflows/tests.yml)

Eight small, finished projects: four web apps written in plain HTML, CSS and JavaScript, a Python backend, and three games in Python. Each one has its own look and personality, runs in Spanish and English, and formats numbers the way each language expects (`1.234,56` / `1,234.56`).

## Web apps

| | |
|---|---|
| [![Apron](Apron/screenshot.png)](Apron/) | **[Apron](Apron/)** · [▶ Live demo](https://gabodelgado.github.io/portfolio/Apron/) — An ordering page for a restaurant. Name your restaurant, build an order from the menu, choose pickup or delivery, add a tip and your local sales tax, and get a confirmation with the full breakdown. |
| [![Waypoint](Waypoint/screenshot.png)](Waypoint/) | **[Waypoint](Waypoint/)** · [▶ Live demo](https://gabodelgado.github.io/portfolio/Waypoint/) — A personal finance planner. Enter your pay, taxes and monthly expenses to see what you can save per paycheck, and how long a savings goal will take. |
| [![Swap](Swap/screenshot.png)](Swap/) | **[Swap](Swap/)** · [▶ Live demo](https://gabodelgado.github.io/portfolio/Swap/) — A currency converter for 88 currencies, using real exchange rates. It keeps working offline with the last rates it downloaded and never invents a rate. |
| [![Tenor](Tenor/screenshot.png)](Tenor/) | **[Tenor](Tenor/)** · [▶ Live demo](https://gabodelgado.github.io/portfolio/Tenor/) — A loan simulator: monthly payment, total interest, the amortization schedule, and how much an extra monthly payment saves you. Interactive charts and CSV export. |

## Backend

| | |
|---|---|
| [![Kitchen](Kitchen/screenshot.png)](Kitchen/) | **[Kitchen](Kitchen/)** — Apron's backend, in Python with FastAPI and SQLite. It receives orders, re-prices them on the server so they can't be tampered with, and shows them on a live, password-protected kitchen board. |

## Python games

Written in Python with pygame. Each one also has a browser version, so you can play without installing anything.

| | |
|---|---|
| [![Volley](Volley/screenshot.png)](Volley/) | **[Volley](Volley/)** · [▶ Play in browser](https://gabodelgado.github.io/portfolio/Volley/web/) — Neon arcade Pong against a CPU with three difficulty levels, or against a friend on the same keyboard. |
| [![Keystroke](Keystroke/screenshot.png)](Keystroke/) | **[Keystroke](Keystroke/)** · [▶ Play in browser](https://gabodelgado.github.io/portfolio/Keystroke/web/) — A typing speed test with a typewriter feel. Measures words per minute and accuracy, and keeps your best runs. |
| [![Nine](Nine/screenshot.png)](Nine/) | **[Nine](Nine/)** · [▶ Play in browser](https://gabodelgado.github.io/portfolio/Nine/web/) — Play sudoku, or type in any puzzle and watch the solver work it out step by step. |

## Running them

**Web apps:** try them live with the links above, or open the app's `index.html` in any modern browser. There's nothing to install or build.

**Games:** play them in the browser with the links above. To run the original Python versions you need Python 3.9 or newer.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python Volley/main.py      # or Keystroke/main.py, Nine/main.py
```

**Kitchen:** see [its README](Kitchen/README.md) to run it locally or deploy it.

## Tests

Every push runs the test suite on GitHub Actions:

- **Python:** the sudoku engine and the Kitchen API (`python -m pytest tests`).
- **Browser:** Playwright drives every web app and web game like a visitor would, plus a full-stack test that places an order in Apron and follows it on the kitchen board (`npm install && npx playwright test`).
- **Accessibility:** every page and its main states are checked against WCAG 2.1 AA with axe, the engine behind Lighthouse's accessibility score.
- **Lint:** Python code is checked with [ruff](https://docs.astral.sh/ruff/) (`ruff check .`).
