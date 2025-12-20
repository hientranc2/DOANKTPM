// Auto-generated Jest unit tests aligned with Excel: Backend_Unit_Test_Cases_Auth_Cart_Order.xlsx

/* eslint-disable */
const request = require("supertest");

describe("POST /register", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
  });

  const mockPgWithQuery = (queryImpl) => {
    jest.doMock("pg", () => ({
      Pool: jest.fn(() => ({ query: jest.fn(queryImpl) })),
    }));
  };

  test("BE_UT_10 - Thiếu email → 400", async () => {
    mockPgWithQuery(async () => ({ rows: [], rowCount: 0 }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));
    jest.doMock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed") }));

    const { app } = require("../index");

    const res = await request(app).post("/register").send({ name: "A", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Missing required registration fields.");
  });

  test("BE_UT_11 - Thiếu password → 400", async () => {
    mockPgWithQuery(async () => ({ rows: [], rowCount: 0 }));
    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));
    jest.doMock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed") }));

    const { app } = require("../index");

    const res = await request(app).post("/register").send({ name: "A", email: "a@a.com" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Missing required registration fields.");
  });

  test("BE_UT_12 - Email đã đăng ký → 400", async () => {
    const query = async (sql) => {
      if (String(sql).includes("SELECT id FROM users")) {
        return { rowCount: 1, rows: [{ id: 1 }] };
      }
      return { rowCount: 0, rows: [] };
    };
    mockPgWithQuery(query);

    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));
    jest.doMock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed") }));

    const { app } = require("../index");

    const res = await request(app).post("/register").send({ name: "A", email: "a@a.com", password: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already registered.");
  });

  test("BE_UT_13 - Đăng ký OK → 200 + token + user", async () => {
    const jwtSign = jest.fn(() => "token123");
    const bcryptHash = jest.fn(async () => "hashed_pw");

    const query = async (sql) => {
      const s = String(sql);
      if (s.includes("SELECT id FROM users")) return { rowCount: 0, rows: [] };
      if (s.includes("INSERT INTO users")) {
        return {
          rowCount: 1,
          rows: [
            {
              id: 99,
              name: "A",
              email: "a@a.com",
              status: "active",
              role: "customer",
              created_at: "2025-01-01T00:00:00Z",
            },
          ],
        };
      }
      return { rowCount: 0, rows: [] };
    };
    mockPgWithQuery(query);

    jest.doMock("jsonwebtoken", () => ({ sign: jwtSign, verify: jest.fn() }));
    jest.doMock("bcryptjs", () => ({ hash: bcryptHash }));

    const { app } = require("../index");

    const res = await request(app).post("/register").send({ name: "A", email: "A@A.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBe("token123");
    expect(res.body.user.email).toBe("a@a.com"); // normalized lowercase
    expect(res.body.user.role).toBe("customer");
    expect(bcryptHash).toHaveBeenCalled();
    expect(jwtSign).toHaveBeenCalled();
  });

  test("BE_UT_14 - Lỗi DB → 500", async () => {
    const query = async () => {
      throw new Error("db down");
    };
    mockPgWithQuery(query);

    jest.doMock("jsonwebtoken", () => ({ sign: jest.fn(() => "token123"), verify: jest.fn() }));
    jest.doMock("bcryptjs", () => ({ hash: jest.fn(async () => "hashed") }));

    const { app } = require("../index");

    const res = await request(app).post("/register").send({ name: "A", email: "a@a.com", password: "123456" });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Unable to register user.");
  });
});
