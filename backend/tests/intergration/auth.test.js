const request = require("supertest");
const app = require("../../index");

describe("Auth API", () => {
  const email = `test${Date.now()}@mail.com`;
  const password = "123456";

  test("POST /register → đăng ký thành công", async () => {
    const res = await request(app).post("/register").send({
      name: "Test User",
      email,
      password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.role).toBe("customer");
  });

  test("POST /login → đăng nhập thành công", async () => {
    const res = await request(app).post("/login").send({
      email,
      password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("POST /register → email đã tồn tại", async () => {
    const res = await request(app).post("/register").send({
      name: "Test User Dup",
      email,
      password,
    });

    expect([400, 409, 500]).toContain(res.statusCode);
  });

  test("POST /login → sai mật khẩu", async () => {
    const res = await request(app).post("/login").send({
      email,
      password: "wrong-password",
    });

    expect(res.statusCode).toBe(401);
  });
});
