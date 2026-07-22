import { describe, expect, it } from "vitest";
import { buildPixPayload, filterOrdersByDate, getDateKey } from "./order-utils";

describe("order utilities", () => {
  it("filters orders by the selected date", () => {
    const orders = [
      { id: "#001", createdAt: "2026-07-16T10:30:00.000Z", total: 120, status: "processing" },
      { id: "#002", createdAt: "2026-07-15T10:30:00.000Z", total: 80, status: "delivered" },
    ];

    expect(filterOrdersByDate(orders, "2026-07-16")).toHaveLength(1);
    expect(filterOrdersByDate(orders, "2026-07-15")).toHaveLength(1);
    expect(filterOrdersByDate(orders, undefined)).toHaveLength(2);
  });

  it("normalizes dates to the local day key", () => {
    expect(getDateKey("2026-07-16T23:59:00.000Z")).toBe("2026-07-16");
  });

  it("builds a PIX payload with amount and order id", () => {
    const payload = buildPixPayload({ orderId: "#A123", amount: 49.9, customerName: "Ana" });

    expect(payload).toContain("AURAESSENCE");
    expect(payload).toContain("#A123");
    expect(payload).toContain("49.90");
  });
});
