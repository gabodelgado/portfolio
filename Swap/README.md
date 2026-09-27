# 💱 Swap

A currency converter for 88 currencies, using real mid-market exchange rates.

**[▶ Try it live](https://gabodelgado.github.io/portfolio/Swap/)**

![Swap](screenshot.png)

## What it does

- **Real rates only:** rates come from [ExchangeRate-API](https://www.exchangerate-api.com), refreshed on open, every 30 minutes, or with the ⟳ button. The last rates downloaded are kept for offline use and labeled as saved rates. If there's no data at all, Swap says so instead of showing a made-up number.
- **Home currency:** pick your local currency once and every visit starts from it.
- **Fast search:** find a currency by code, name or country in Spanish or English, with or without accents ("dolar" finds "Dólar"). Use ↑ ↓ and Enter to pick without the mouse.
- **Right decimals for each currency:** yen and won have none, dollars and euros have 2, Kuwaiti dinar has 3. The amount adjusts when you switch currencies.
- **Tiny rates stay readable:** 1 IDR = 0.00006 USD shows enough digits to be useful.
- **Two languages:** Spanish and English, with numbers written the way each one expects. The amount field adds thousands separators as you type and understands pasted amounts in either format.

## Built with

Plain HTML, CSS and JavaScript, with no frameworks or build step. Exchange rates come from ExchangeRate-API's free open endpoint, which needs no API key.

## Run it

Open `index.html` in a browser. You need an internet connection the first time, to download the rates.
