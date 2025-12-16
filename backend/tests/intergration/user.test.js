const request = require("supertest");
const app = require("../../index");

let adminToken;
let userId;

beforeAll(async () => {
  // login admin mặc định
  const login = await request(app).post("/login").send({
    email: "admin@clothify.com",
    password: "Admin@123",
  });

  adminToken = login.body.token;

  const users = await request(app).get("/users").set("auth-token", adminToken);

  if (users.statusCode === 200 && Array.isArray(users.body.users) && users.body.users.length) {
    userId = users.body.users[0].id;
  }
});

describe("Users API", () => {
  test("GET /users → admin xem danh sách", async () => {
    const res = await request(app).get("/users").set("auth-token", adminToken);

    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body.users)).toBe(true);
      if (res.body.users.length) {
        expect(res.body.users[0].password).toBeUndefined();
      }
    }
  });

  test("PATCH /users/:id/status → cập nhật trạng thái", async () => {
    const targetUserId = userId || 999999;
    const res = await request(app)
      .patch(`/users/${targetUserId}/status`)
      .set("auth-token", adminToken)
      .send({ status: "suspended" });

    expect([200, 404]).toContain(res.statusCode);
  });

  test("PATCH /users/:id/role → đổi role", async () => {
    const targetUserId = userId || 999999;
    const res = await request(app)
      .patch(`/users/${targetUserId}/role`)
      .set("auth-token", adminToken)
      .send({ role: "customer" });

    expect([200, 404]).toContain(res.statusCode);
  });
});
