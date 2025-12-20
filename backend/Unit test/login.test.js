// Auto-generated Jest unit tests aligned with Excel: Backend_Unit_Test_Cases_Auth_Cart_Order.xlsx

/* eslint-disable */
const request = require("supertest");

describe("POST /login", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
  });

  const mockPg = (queryImpl) => {
    jest.doMock("pg", () => ({
      Pool: jest.fn(() => ({ query: jest.fn(queryImpl) })),
    }));
  };

  test("BE_UT_15 - Thiếu email/password → 400", async () => {
    mockPg(async () => ({ rowCount: 0, rows: [] }));
    jest.doMock("bcryptjs", () => ({ compare: jest.fn(async () => false) }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));

    const { app } = require("../index");

    const res = await request(app).post("/login").send({ email: "a@a.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Missing login credentials.");
  });

  test("BE_UT_16 - Email không tồn tại → 401", async () => {
    mockPg(async (sql) => {
      if (String(sql).includes("SELECT * FROM users")) return { rowCount: 0, rows: [] };
      return { rowCount: 0, rows: [] };
    });

    jest.doMock("bcryptjs", () => ({ compare: jest.fn(async () => false) }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));

    const { app } = require("../index");

    const res = await request(app).post("/login").send({ email: "a@a.com", password: "123" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password.");
  });

  test("BE_UT_17 - Tài khoản suspended → 403", async () => {
    mockPg(async (sql) => {
      if (String(sql).includes("SELECT * FROM users")) {
        return {
          rowCount: 1,
          rows: [{ id: 1, name: "A", email: "a@a.com", password: "hashed", status: "suspended", role: "customer", created_at: "2025-01-01" }],
        };
      }
      return { rowCount: 0, rows: [] };
    });

    jest.doMock("bcryptjs", () => ({ compare: jest.fn(async () => true) })); // doesn't matter
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));

    const { app } = require("../index");

    const res = await request(app).post("/login").send({ email: "a@a.com", password: "123" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Account is suspended.");
  });

  test("BE_UT_18 - Sai mật khẩu → 401", async () => {
    const bcryptCompare = jest.fn(async () => false);

    mockPg(async (sql) => {
      if (String(sql).includes("SELECT * FROM users")) {
        return {
          rowCount: 1,
          rows: [{ id: 1, name: "A", email: "a@a.com", password: "hashed", status: "active", role: "customer", created_at: "2025-01-01" }],
        };
      }
      return { rowCount: 0, rows: [] };
    });

    jest.doMock("bcryptjs", () => ({ compare: bcryptCompare }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));

    const { app } = require("../index");

    const res = await request(app).post("/login").send({ email: "a@a.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password.");
    expect(bcryptCompare).toHaveBeenCalled();
  });

  test("BE_UT_19 - Đăng nhập OK → 200 + token + user", async () => {
    const bcryptCompare = jest.fn(async () => true);
    const jwtSign = jest.fn(() => "token123");

    mockPg(async (sql) => {
      if (String(sql).includes("SELECT * FROM users")) {
        return {
          rowCount: 1,
          rows: [{ id: 1, name: "A", email: "a@a.com", password: "hashed", status: "active", role: "admin", created_at: "2025-01-01" }],
        };
      }
      return { rowCount: 0, rows: [] };
    });

    jest.doMock("bcryptjs", () => ({ compare: bcryptCompare }));
    jest.doMock("jsonwebtoken", () => ({ sign: jwtSign, verify: jest.fn() }));

    const { app } = require("../index");

    const res = await request(app).post("/login").send({ email: "A@A.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe("token123");
    expect(res.body.user.email).toBe("a@a.com");
    expect(res.body.user.role).toBe("admin");
    expect(bcryptCompare).toHaveBeenCalled();
    expect(jwtSign).toHaveBeenCalled();
  });
});
