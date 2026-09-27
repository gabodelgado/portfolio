# ⌨️ Keystroke

A typing speed test with a typewriter soul: cream paper, ribbon-red mistakes and a stamp when you set a record.

**[▶ Play it in your browser](https://gabodelgado.github.io/portfolio/Keystroke/web/)**

![Keystroke](screenshot.png)

## Highlights

- **Tests of 15, 30 or 60 seconds.** The clock starts with your first key, not before.
- **Honest scoring:** words per minute count only correct characters (5 characters = 1 word). Raw speed and accuracy are shown separately, and accuracy includes mistakes you corrected.
- **Your records:** your 5 best runs for each duration are saved with their date and shown under your name.
- **Two languages:** the interface and the words switch between Spanish (223 common words) and English (198 common words).
- **Keyboard shortcuts you'd expect:** Alt or Ctrl + Backspace deletes a whole word.

## Controls

| Key | Action |
|---|---|
| ← / → | Choose the duration |
| Enter | Start / try again |
| Tab | Restart the test (from the menu: change your name) |
| Esc | Back to the menu / quit |
| Ctrl + L | Switch language |

## Run it

From the repository's root folder:

```bash
pip install -r requirements.txt
python Keystroke/main.py
```

## Browser version

[`web/`](web/) holds a JavaScript port so the game can be played without installing anything. It follows the Python version's rules, colors and tuning, and is drawn with HTML, so accents and phone keyboards work. Records are kept in the browser.
