// Auto-generated Jest unit tests aligned with Excel: Backend_Unit_Test_Cases_Auth_Cart_Order.xlsx

/* eslint-disable */
describe("formatOrderResponse", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
    jest.doMock("pg", () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }));
  });

  test("BE_UT_30 - Khách đã đăng ký (có customer_id)", () => {
    const { formatOrderResponse } = require("../index");

    const order = {
      order_id: 10,
      status: "processing",
      total: "300000",
      created_at: "2025-01-01T00:00:00Z",
      customer_id: 5,
      user_name: "User A",
      user_email: "a@a.com",
      user_status: "active",
    };

    const items = [{ product_id: 1, name: "P1", quantity: 2, price: "100000" }];

    const out = formatOrderResponse(order, items);

    expect(out.orderId).toBe(10);
    expect(out.status).toBe("processing");
    expect(out.total).toBe(300000);
    expect(out.customer).toEqual({ id: 5, name: "User A", email: "a@a.com", status: "active" });
    expect(out.items).toEqual([{ productId: 1, name: "P1", quantity: 2, price: 100000 }]);
  });

  test("BE_UT_31 - Khách vãng lai (không có customer_id)", () => {
    const { formatOrderResponse } = require("../index");

    const order = {
      order_id: 1,
      status: "pending",
      total: 0,
      created_at: "2025-01-01",
      customer_id: null,
      customer_name: "Guest",
      customer_email: "guest@example.com",
    };

    const out = formatOrderResponse(order, []);

    expect(out.customer).toEqual({ name: "Guest", email: "guest@example.com" });
    expect(out.items).toEqual([]);
  });

  test("BE_UT_32 - Ép total thành Number", () => {
    const { formatOrderResponse } = require("../index");

    const order = {
      order_id: 2,
      status: "pending",
      total: "300000",
      created_at: "2025-01-01",
      customer_id: null,
      customer_name: "Guest",
      customer_email: "guest@example.com",
    };

    const out = formatOrderResponse(order, []);

    expect(typeof out.total).toBe("number");
    expect(out.total).toBe(300000);
  });
});
