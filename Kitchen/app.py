"""Kitchen — the backend for Apron.

Apron (the ordering page) sends orders here; the restaurant follows them on a live
kitchen board and moves each one from received → preparing → ready → done.

Prices and totals are always recomputed on the server from the menu: whatever the
browser sends as a price is ignored, so nobody can order a $0.01 pizza.

Run locally:
    pip install -r Kitchen/requirements.txt
    KITCHEN_TOKEN=choose-a-password uvicorn Kitchen.app:app --reload
Then open http://localhost:8000 for the kitchen board.
"""

import os
import secrets
import sqlite3
import threading
import time
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from typing import Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator, model_validator

HERE = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("KITCHEN_DB", HERE / "kitchen.db"))

# The kitchen board needs this password. Without one configured, a random one is
# generated and printed at startup, so the board is never left open by accident.
TOKEN = os.environ.get("KITCHEN_TOKEN") or secrets.token_urlsafe(12)
if not os.environ.get("KITCHEN_TOKEN"):
    print(f"[kitchen] KITCHEN_TOKEN not set — using a temporary one for this run: {TOKEN}")

DELIVERY_FEE_CENTS = 600
TIP_PERCENTS = (15, 18, 20)
ORDERS_PER_MINUTE = 10  # per IP, to keep bots from flooding the kitchen

# Same dishes and prices as Apron's sample menu, in cents to avoid float rounding
MENU: dict[int, dict] = {
    1:  {"es": "Pizza Margherita",     "en": "Margherita Pizza", "emoji": "🍕", "price": 1499},
    2:  {"es": "Ensalada César",       "en": "Caesar Salad",     "emoji": "🥗", "price": 999},
    3:  {"es": "Salmón a la Parrilla", "en": "Grilled Salmon",   "emoji": "🐟", "price": 2499},
    4:  {"es": "Pasta Carbonara",      "en": "Pasta Carbonara",  "emoji": "🍝", "price": 1699},
    5:  {"es": "Bruschetta",           "en": "Bruschetta",       "emoji": "🍞", "price": 899},
    6:  {"es": "Pastel de Chocolate",  "en": "Chocolate Cake",   "emoji": "🍰", "price": 799},
    7:  {"es": "Tiramisú",             "en": "Tiramisu",         "emoji": "🍮", "price": 899},
    8:  {"es": "Té Helado",            "en": "Iced Tea",         "emoji": "🧊", "price": 399},
    9:  {"es": "Copa de Vino",         "en": "Glass of Wine",    "emoji": "🍷", "price": 699},
    10: {"es": "Risotto",              "en": "Risotto",          "emoji": "🍚", "price": 1899},
    11: {"es": "Sopa del Día",         "en": "Soup of the Day",  "emoji": "🍲", "price": 699},
    12: {"es": "Helado",               "en": "Ice Cream",        "emoji": "🍨", "price": 599},
}

STATUSES = ("received", "preparing", "ready", "done", "cancelled")
# Where an order can go next. Cancelling is possible until it's handed over.
NEXT = {
    "received": {"preparing", "cancelled"},
    "preparing": {"ready", "cancelled"},
    "ready": {"done", "cancelled"},
    "done": set(),
    "cancelled": set(),
}


# ---------- database ----------
_db_lock = threading.Lock()


@contextmanager
def db():
    with _db_lock:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                status TEXT NOT NULL,
                type TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                address TEXT,
                note TEXT,
                tax_rate_pct TEXT NOT NULL,
                subtotal_cents INTEGER NOT NULL,
                tax_cents INTEGER NOT NULL,
                tip_cents INTEGER NOT NULL,
                delivery_cents INTEGER NOT NULL,
                total_cents INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS order_items (
                order_id INTEGER NOT NULL REFERENCES orders(id),
                dish_id INTEGER NOT NULL,
                qty INTEGER NOT NULL,
                unit_cents INTEGER NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
            """
        )


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def cents(value: Decimal) -> int:
    """Round half up to whole cents, the way a receipt does."""
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


# ---------- request models ----------
class Customer(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    phone: str = Field(min_length=7, max_length=20)
    address: Optional[str] = Field(default=None, max_length=120)

    @field_validator("name", "address")
    @classmethod
    def strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("phone")
    @classmethod
    def phone_has_digits(cls, v):
        if sum(ch.isdigit() for ch in v) < 7:
            raise ValueError("the phone number needs at least 7 digits")
        return v.strip()


class Item(BaseModel):
    id: int
    qty: int = Field(ge=1, le=99)

    @field_validator("id")
    @classmethod
    def on_the_menu(cls, v):
        if v not in MENU:
            raise ValueError(f"dish {v} is not on the menu")
        return v


class Tip(BaseModel):
    pct: Optional[int] = None
    amount_cents: Optional[int] = Field(default=None, ge=0, le=500_000)  # up to 5.000 in tips

    @model_validator(mode="after")
    def one_kind(self):
        if self.pct is not None and self.amount_cents is not None:
            raise ValueError("send either a tip percentage or an amount, not both")
        if self.pct is not None and self.pct not in TIP_PERCENTS:
            raise ValueError(f"tip percentage must be one of {TIP_PERCENTS}")
        return self


class NewOrder(BaseModel):
    type: Literal["pickup", "delivery"]
    customer: Customer
    items: list[Item] = Field(min_length=1, max_length=30)
    # The real local sales tax rate is entered by the restaurant, never guessed
    tax_rate_pct: Decimal = Field(ge=0, le=100, max_digits=6, decimal_places=3)
    tip: Tip = Tip()
    note: Optional[str] = Field(default=None, max_length=300)

    @model_validator(mode="after")
    def delivery_needs_address(self):
        if self.type == "delivery" and not (self.customer.address or "").strip():
            raise ValueError("delivery orders need an address")
        return self


class StatusChange(BaseModel):
    status: Literal["received", "preparing", "ready", "done", "cancelled"]


# ---------- pricing ----------
def price(order: NewOrder) -> dict:
    qty_by_dish: dict[int, int] = {}
    for item in order.items:
        qty_by_dish[item.id] = qty_by_dish.get(item.id, 0) + item.qty
    subtotal = sum(MENU[d]["price"] * q for d, q in qty_by_dish.items())
    tax = cents(Decimal(subtotal) * order.tax_rate_pct / 100)
    if order.tip.pct is not None:
        tip = cents(Decimal(subtotal) * order.tip.pct / 100)
    else:
        tip = order.tip.amount_cents or 0
    delivery = DELIVERY_FEE_CENTS if order.type == "delivery" else 0
    return {
        "lines": qty_by_dish,
        "subtotal_cents": subtotal,
        "tax_cents": tax,
        "tip_cents": tip,
        "delivery_cents": delivery,
        "total_cents": subtotal + tax + tip + delivery,
    }


def order_number(order_id: int) -> str:
    return f"#{1000 + order_id}"


def serialize(row: sqlite3.Row, items: list[sqlite3.Row]) -> dict:
    return {
        "id": row["id"],
        "number": order_number(row["id"]),
        "status": row["status"],
        "type": row["type"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "customer": {"name": row["customer_name"], "phone": row["customer_phone"], "address": row["address"]},
        "note": row["note"],
        "items": [
            {
                "id": it["dish_id"],
                "name": {"es": MENU[it["dish_id"]]["es"], "en": MENU[it["dish_id"]]["en"]},
                "emoji": MENU[it["dish_id"]]["emoji"],
                "qty": it["qty"],
                "unit_cents": it["unit_cents"],
            }
            for it in items
        ],
        "tax_rate_pct": row["tax_rate_pct"],
        "subtotal_cents": row["subtotal_cents"],
        "tax_cents": row["tax_cents"],
        "tip_cents": row["tip_cents"],
        "delivery_cents": row["delivery_cents"],
        "total_cents": row["total_cents"],
    }


def load_order(conn, order_id: int) -> Optional[dict]:
    row = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    if row is None:
        return None
    items = conn.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,)).fetchall()
    return serialize(row, items)


# ---------- app ----------
@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield


app = FastAPI(title="Kitchen", description="Backend for the Apron ordering page", version="1.0.0", lifespan=lifespan)

# Apron lives on GitHub Pages; localhost and file:// ("null") are allowed for local testing
ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "https://gabodelgado.github.io,null").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


def require_token(authorization: str = Header(default="")):
    expected = f"Bearer {TOKEN}"
    if not secrets.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="wrong or missing kitchen password")


_recent: dict[str, list[float]] = {}


def rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    hits = [t for t in _recent.get(ip, []) if now - t < 60]
    if len(hits) >= ORDERS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="too many orders from this device, try again in a minute")
    hits.append(now)
    _recent[ip] = hits


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/menu")
def menu():
    return [{"id": i, **dish} for i, dish in MENU.items()]


@app.post("/api/orders", status_code=201, dependencies=[Depends(rate_limit)])
def create_order(order: NewOrder):
    bill = price(order)
    stamp = now_iso()
    with db() as conn:
        cur = conn.execute(
            """INSERT INTO orders (created_at, updated_at, status, type, customer_name, customer_phone, address, note,
                                   tax_rate_pct, subtotal_cents, tax_cents, tip_cents, delivery_cents, total_cents)
               VALUES (?, ?, 'received', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                stamp, stamp, order.type, order.customer.name, order.customer.phone,
                order.customer.address if order.type == "delivery" else None,
                (order.note or "").strip() or None, str(order.tax_rate_pct),
                bill["subtotal_cents"], bill["tax_cents"], bill["tip_cents"], bill["delivery_cents"], bill["total_cents"],
            ),
        )
        order_id = cur.lastrowid
        conn.executemany(
            "INSERT INTO order_items (order_id, dish_id, qty, unit_cents) VALUES (?, ?, ?, ?)",
            [(order_id, dish, qty, MENU[dish]["price"]) for dish, qty in bill["lines"].items()],
        )
        return load_order(conn, order_id)


@app.get("/api/orders", dependencies=[Depends(require_token)])
def list_orders(status: Optional[str] = None, limit: int = 100):
    if status is not None and status not in STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {STATUSES}")
    limit = max(1, min(limit, 500))
    with db() as conn:
        if status:
            rows = conn.execute("SELECT id FROM orders WHERE status = ? ORDER BY id DESC LIMIT ?", (status, limit)).fetchall()
        else:
            rows = conn.execute("SELECT id FROM orders ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        return [load_order(conn, r["id"]) for r in rows]


@app.patch("/api/orders/{order_id}", dependencies=[Depends(require_token)])
def change_status(order_id: int, change: StatusChange):
    with db() as conn:
        order = load_order(conn, order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="order not found")
        if change.status not in NEXT[order["status"]]:
            raise HTTPException(status_code=409, detail=f"an order that is {order['status']} can't become {change.status}")
        conn.execute("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?", (change.status, now_iso(), order_id))
        return load_order(conn, order_id)


@app.get("/", include_in_schema=False)
def board():
    return FileResponse(HERE / "static" / "index.html")
