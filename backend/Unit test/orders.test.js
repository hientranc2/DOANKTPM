// Auto-generated Jest unit tests aligned with Excel: Backend_Unit_Test_Cases_Auth_Cart_Order.xlsx

/* eslint-disable */
const request = require("supertest");

describe("Orders endpoints", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
  });

  const setupAppWithPg = (queryImpl) => {
    jest.doMock("pg", () => ({
      Pool: jest.fn(() => ({ query: jest.fn(queryImpl) })),
    }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn(() => ({ id: 1, email: "u@x.com" })) }));
    jest.doMock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed"), compare: jest.fn(async () => true) }));

    return require("../index").app;
  };

  test("BE_UT_33 - Status lạ → normalize về pending", async () => {
    let insertedStatus = null;

    const app = setupAppWithPg(async (sql, params) => {
      const s = String(sql);
      if (s.includes("SELECT order_id FROM orders")) return { rowCount: 0, rows: [] };
      if (s.includes("INSERT INTO orders")) {
        insertedStatus = params[5];
        return { rowCount: 1, rows: [{ id: 1, order_id: 1, customer_id: null, customer_name: "G", customer_email: "g@x.com", total: 0, status: insertedStatus, created_at: "2025-01-01" }] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).post("/orders").send({ customerName: "G", customerEmail: "g@x.com", items: [], total: 0, status: "weird" });

    expect(res.status).toBe(200);
    expect(insertedStatus).toBe("pending");
    expect(res.body.order.status).toBe("pending");
  });

  test("BE_UT_34 - Không có đơn trước đó → next orderId=1", async () => {
    const app = setupAppWithPg(async (sql) => {
      const s = String(sql);
      if (s.includes("SELECT order_id FROM orders")) return { rowCount: 0, rows: [] };
      if (s.includes("INSERT INTO orders")) return { rowCount: 1, rows: [{ id: 11, order_id: 1, customer_id: null, customer_name: "G", customer_email: "g@x.com", total: 0, status: "pending", created_at: "2025-01-01" }] };
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).post("/orders").send({ customerName: "G", customerEmail: "g@x.com", items: [], total: 0 });

    expect(res.status).toBe(200);
    expect(res.body.order.orderId).toBe(1);
  });

  test("BE_UT_35 - Có đơn trước đó → next orderId = last+1", async () => {
    let insertedOrderId = null;

    const app = setupAppWithPg(async (sql, params) => {
      const s = String(sql);
      if (s.includes("SELECT order_id FROM orders")) return { rowCount: 1, rows: [{ order_id: 10 }] };
      if (s.includes("INSERT INTO orders")) {
        insertedOrderId = params[0];
        return { rowCount: 1, rows: [{ id: 12, order_id: insertedOrderId, customer_id: null, customer_name: "G", customer_email: "g@x.com", total: 0, status: "pending", created_at: "2025-01-01" }] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).post("/orders").send({ customerName: "G", customerEmail: "g@x.com", items: [], total: 0 });

    expect(res.status).toBe(200);
    expect(insertedOrderId).toBe(11);
    expect(res.body.order.orderId).toBe(11);
  });

  test("BE_UT_36 - customerId hợp lệ → lấy name/email từ users", async () => {
    const app = setupAppWithPg(async (sql, params) => {
      const s = String(sql);
      if (s.includes("SELECT order_id FROM orders")) return { rowCount: 0, rows: [] };
      if (s.includes("SELECT id, name, email, status FROM users")) {
        return { rowCount: 1, rows: [{ id: params[0], name: "User 5", email: "u5@x.com", status: "active" }] };
      }
      if (s.includes("INSERT INTO orders")) {
        return { rowCount: 1, rows: [{ id: 13, order_id: 1, customer_id: 5, customer_name: "User 5", customer_email: "u5@x.com", total: 0, status: "pending", created_at: "2025-01-01" }] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).post("/orders").send({ customerId: 5, customerName: "X", customerEmail: "x@x.com", items: [], total: 0 });

    expect(res.status).toBe(200);
    expect(res.body.order.customer.name).toBe("User 5");
    expect(res.body.order.customer.email).toBe("u5@x.com");
  });

  test("BE_UT_37 - items parse quantity/price thành number", async () => {
    const insertedItems = [];

    const app = setupAppWithPg(async (sql, params) => {
      const s = String(sql);
      if (s.includes("SELECT order_id FROM orders")) return { rowCount: 0, rows: [] };
      if (s.includes("INSERT INTO orders")) return { rowCount: 1, rows: [{ id: 20, order_id: 1, customer_id: null, customer_name: "G", customer_email: "g@x.com", total: 200, status: "pending", created_at: "2025-01-01" }] };
      if (s.includes("INSERT INTO order_items")) {
        insertedItems.push({ order_id: params[0], product_id: params[1], name: params[2], quantity: params[3], price: params[4] });
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).post("/orders").send({
      customerName: "G",
      customerEmail: "g@x.com",
      items: [{ productId: 1, name: "P", quantity: "2", price: "100" }],
      total: "200",
    });

    expect(res.status).toBe(200);
    expect(res.body.order.total).toBe(200);
    expect(res.body.order.items[0].quantity).toBe(2);
    expect(res.body.order.items[0].price).toBe(100);
    expect(insertedItems[0].quantity).toBe(2);
    expect(insertedItems[0].price).toBe(100);
  });

  test("BE_UT_38 - Lỗi DB → 500", async () => {
    const app = setupAppWithPg(async () => {
      throw new Error("db down");
    });

    const res = await request(app).post("/orders").send({ customerName: "G", customerEmail: "g@x.com", items: [], total: 0 });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unable to create order.");
  });

  test("BE_UT_39 - GET /orders không có orders → []", async () => {
    const app = setupAppWithPg(async (sql) => {
      const s = String(sql);
      if (s.includes("FROM orders")) return { rowCount: 0, rows: [] };
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orders).toEqual([]);
  });

  test("BE_UT_40 - GET /orders có orders + items → group đúng", async () => {
    const app = setupAppWithPg(async (sql, params) => {
      const s = String(sql);
      if (s.includes("FROM orders")) {
        return {
          rowCount: 2,
          rows: [
            { id: 101, order_id: 10, status: "pending", total: 100, created_at: "2025-01-01", customer_id: null, customer_name: "G", customer_email: "g@x.com" },
            { id: 102, order_id: 11, status: "processing", total: 200, created_at: "2025-01-02", customer_id: null, customer_name: "H", customer_email: "h@x.com" },
          ],
        };
      }
      if (s.includes("FROM order_items")) {
        return {
          rowCount: 2,
          rows: [
            { order_id: 101, product_id: 1, name: "P1", quantity: 1, price: 100 },
            { order_id: 102, product_id: 2, name: "P2", quantity: 2, price: 100 },
          ],
        };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orders.length).toBe(2);
    expect(res.body.orders[0].orderId).toBe(10);
    expect(res.body.orders[0].items.length).toBe(1);
    expect(res.body.orders[1].orderId).toBe(11);
    expect(res.body.orders[1].items.length).toBe(1);
  });

  test("BE_UT_41 - GET /orders lỗi DB → 500", async () => {
    const app = setupAppWithPg(async () => {
      throw new Error("db down");
    });

    const res = await request(app).get("/orders");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unable to fetch orders.");
  });

  test("BE_UT_42 - PATCH /orders/:orderId status invalid → 400", async () => {
    const app = setupAppWithPg(async () => ({ rowCount: 0, rows: [] }));

    const res = await request(app).patch("/orders/10").send({ status: "cancelled" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid order status.");
  });

  test("BE_UT_43 - PATCH /orders/:orderId order not found → 404", async () => {
    const app = setupAppWithPg(async (sql) => {
      const s = String(sql);
      if (s.includes("UPDATE orders SET status")) return { rowCount: 0, rows: [] };
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).patch("/orders/10").send({ status: "shipped" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Order not found.");
  });

  test("BE_UT_44 - PATCH /orders/:orderId update OK → trả order formatted", async () => {
    const app = setupAppWithPg(async (sql, params) => {
      const s = String(sql);
      if (s.includes("UPDATE orders SET status")) return { rowCount: 1, rows: [{ id: 201 }] };
      if (s.includes("FROM orders") && s.includes("WHERE o.id")) {
        return { rowCount: 1, rows: [{ id: 201, order_id: 10, status: "shipped", total: 100, created_at: "2025-01-01", customer_id: null, customer_name: "G", customer_email: "g@x.com" }] };
      }
      if (s.includes("SELECT * FROM order_items")) {
        return { rowCount: 1, rows: [{ order_id: 201, product_id: 1, name: "P1", quantity: 1, price: 100 }] };
      }
      return { rowCount: 0, rows: [] };
    });

    const res = await request(app).patch("/orders/10").send({ status: "shipped" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.orderId).toBe(10);
    expect(res.body.order.status).toBe("shipped");
    expect(res.body.order.items.length).toBe(1);
  });

  test("BE_UT_45 - PATCH /orders/:orderId lỗi DB → 500", async () => {
    const app = setupAppWithPg(async () => {
      throw new Error("db down");
    });

    const res = await request(app).patch("/orders/10").send({ status: "processing" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unable to update order.");
  });
});
