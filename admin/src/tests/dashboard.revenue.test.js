import {
  computeRevenueFromOrders
} from "../Components/Dashboard/Dashboard";

import { describe, test, expect } from "vitest";

describe("Dashboard revenue – unit test", () => {

  test("tính doanh thu hôm nay / tháng / năm từ danh sách đơn", () => {
    const now = new Date("2025-01-15T12:00:00");

    const orders = [
      {
        total: 100000,
        createdAt: "2025-01-15T08:00:00" // hôm nay
      },
      {
        total: 200000,
        createdAt: "2025-01-10T10:00:00" // tháng này
      },
      {
        total: 300000,
        createdAt: "2024-12-31T23:59:59" // năm trước
      }
    ];

    const revenue = computeRevenueFromOrders(orders, now);

    expect(revenue.today).toBe(100000);
    expect(revenue.month).toBe(300000);
    expect(revenue.year).toBe(300000);
  });

  test("đơn không có total → tính từ items", () => {
    const now = new Date("2025-01-15T12:00:00");

    const orders = [
      {
        createdAt: "2025-01-15T09:00:00",
        items: [
          { price: 50000, quantity: 2 }
        ]
      }
    ];

    const revenue = computeRevenueFromOrders(orders, now);

    expect(revenue.today).toBe(100000);
    expect(revenue.month).toBe(100000);
    expect(revenue.year).toBe(100000);
  });

  test("danh sách đơn rỗng → doanh thu = 0", () => {
    const revenue = computeRevenueFromOrders([], new Date());

    expect(revenue.today).toBe(0);
    expect(revenue.month).toBe(0);
    expect(revenue.year).toBe(0);
  });

});
