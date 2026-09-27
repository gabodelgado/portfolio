"""Tests for Kitchen, Apron's backend. Run from the repository root: python -m pytest tests/test_kitchen.py"""

import importlib
import os
import sys
import tempfile
import unittest

try:
    from fastapi.testclient import TestClient
except ImportError:  # the games-only setup doesn't install FastAPI
    TestClient = None

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
TOKEN = "test-password"


def order(**overrides):
    body = {
        "type": "pickup",
        "customer": {"name": "Ana", "phone": "(555) 123-4567"},
        "items": [{"id": 1, "qty": 1}, {"id": 3, "qty": 1}],  # 14,99 + 24,99
        "tax_rate_pct": 8.875,
        "tip": {"amount_cents": 125000},
    }
    body.update(overrides)
    return body


@unittest.skipIf(TestClient is None, "FastAPI is not installed")
class KitchenTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["KITCHEN_DB"] = os.path.join(self.tmp.name, "test.db")
        os.environ["KITCHEN_TOKEN"] = TOKEN
        sys.path.insert(0, ROOT)
        import Kitchen.app as kitchen
        self.kitchen = importlib.reload(kitchen)  # fresh DB path, token and rate limits per test
        self.client = TestClient(self.kitchen.app)
        self.client.__enter__()
        self.auth = {"Authorization": "Bearer " + TOKEN}

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.tmp.cleanup()

    def test_totals_are_computed_on_the_server(self):
        res = self.client.post("/api/orders", json=order())
        self.assertEqual(res.status_code, 201)
        body = res.json()
        # the same bill Apron shows: 39,98 + 3,55 tax + 1.250 tip = 1.293,53
        self.assertEqual(body["subtotal_cents"], 3998)
        self.assertEqual(body["tax_cents"], 355)
        self.assertEqual(body["total_cents"], 129353)
        self.assertEqual(body["number"], "#1001")
        self.assertEqual(body["status"], "received")

    def test_prices_sent_by_the_browser_are_ignored(self):
        cheat = order(items=[{"id": 3, "qty": 2, "price": 0.01, "unit_cents": 1}])
        body = self.client.post("/api/orders", json=cheat).json()
        self.assertEqual(body["subtotal_cents"], 2 * 2499)

    def test_percentage_tip_and_delivery_fee(self):
        body = self.client.post("/api/orders", json=order(
            type="delivery", tip={"pct": 20}, tax_rate_pct=0,
            customer={"name": "Luis", "phone": "5551234567", "address": "Calle 8, apto 2"},
        )).json()
        self.assertEqual(body["tip_cents"], 800)       # 20 % of 39,98 = 7,996 → 8,00
        self.assertEqual(body["delivery_cents"], 600)
        self.assertEqual(body["total_cents"], 3998 + 800 + 600)

    def test_rejects_bad_orders(self):
        cases = {
            "unknown dish": order(items=[{"id": 99, "qty": 1}]),
            "empty cart": order(items=[]),
            "short phone": order(customer={"name": "Ana", "phone": "123"}),
            "delivery without address": order(type="delivery"),
            "tax over 100": order(tax_rate_pct=150),
            "odd tip percentage": order(tip={"pct": 7}),
            "two kinds of tip": order(tip={"pct": 15, "amount_cents": 100}),
        }
        for name, body in cases.items():
            with self.subTest(name):
                self.assertEqual(self.client.post("/api/orders", json=body).status_code, 422)

    def test_board_needs_the_password(self):
        self.client.post("/api/orders", json=order())
        self.assertEqual(self.client.get("/api/orders").status_code, 401)
        self.assertEqual(self.client.get("/api/orders", headers={"Authorization": "Bearer nope"}).status_code, 401)
        res = self.client.get("/api/orders", headers=self.auth)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)

    def test_orders_move_forward_only(self):
        oid = self.client.post("/api/orders", json=order()).json()["id"]
        def patch(status):
            return self.client.patch(f"/api/orders/{oid}", json={"status": status}, headers=self.auth)

        self.assertEqual(patch("ready").status_code, 409)  # can't skip preparing
        self.assertEqual(patch("preparing").json()["status"], "preparing")
        self.assertEqual(patch("ready").json()["status"], "ready")
        self.assertEqual(patch("done").json()["status"], "done")
        self.assertEqual(patch("cancelled").status_code, 409)  # already handed over
        self.assertEqual(self.client.patch("/api/orders/999", json={"status": "done"}, headers=self.auth).status_code, 404)

    def test_filters_by_status(self):
        first = self.client.post("/api/orders", json=order()).json()["id"]
        self.client.post("/api/orders", json=order())
        self.client.patch(f"/api/orders/{first}", json={"status": "preparing"}, headers=self.auth)
        preparing = self.client.get("/api/orders?status=preparing", headers=self.auth).json()
        self.assertEqual([o["id"] for o in preparing], [first])

    def test_limits_orders_per_device(self):
        codes = [self.client.post("/api/orders", json=order()).status_code for _ in range(self.kitchen.ORDERS_PER_MINUTE + 1)]
        self.assertEqual(codes[-1], 429)
        self.assertTrue(all(c == 201 for c in codes[:-1]))


if __name__ == "__main__":
    unittest.main()
