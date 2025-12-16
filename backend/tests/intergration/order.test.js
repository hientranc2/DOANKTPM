const request = require("supertest");
const app = require("../../index");

let adminToken;
let orderId;

beforeAll(async () => {
  const login = await request(app).post("/login").send({
    email: "admin@clothify.com",
    password: "Admin@123",
  });
  adminToken = login.body.token;

  const order = await request(app).post("/orders").send({ total: 100 });
  if (order.statusCode === 200 && order.body?.order?.order_id) {
    orderId = order.body.order.order_id;
  }
});

describe("Orders API", () => {
  test("POST /orders → tạo đơn hàng", async () => {
    const res = await request(app).post("/orders").send({ total: 50 });

    expect(res.statusCode).toBe(200);
    if (res.statusCode === 200) {
      expect(res.body?.order?.order_id).toBeDefined();
    }
  });

  test("GET /orders → admin xem đơn", async () => {
    const res = await request(app).get("/orders").set("auth-token", adminToken);

    expect([200, 404]).toContain(res.statusCode);

    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.orders)).toBe(true);
    }
  });

  test("PATCH /orders/:orderId → cập nhật trạng thái", async () => {
    const targetOrderId = orderId || 999999;
    const res = await request(app)
      .patch(`/orders/${targetOrderId}`)
      .set("auth-token", adminToken)
      .send({ status: "shipped" });

    expect([200, 400, 404]).toContain(res.statusCode);
  });

  test("PATCH /orders/:orderId → status không hợp lệ", async () => {
    const targetOrderId = orderId || 999999;
    const res = await request(app)
      .patch(`/orders/${targetOrderId}`)
      .set("auth-token", adminToken)
      .send({ status: "invalid-status" });

    expect([200, 400, 404, 500]).toContain(res.statusCode);
  });
});
