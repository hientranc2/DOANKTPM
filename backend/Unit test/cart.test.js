// Auto-generated Jest unit tests aligned with Excel: Backend_Unit_Test_Cases_Auth_Cart_Order.xlsx

/* eslint-disable */
const request = require("supertest");

describe("Cart endpoints", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
  });

  const setup = ({ jwtVerifyImpl, pgQueryImpl }) => {
    jest.doMock("jsonwebtoken", () => ({
      verify: jest.fn(jwtVerifyImpl),
      sign: jest.fn(() => "token123"),
    }));

    jest.doMock("pg", () => ({
      Pool: jest.fn(() => ({
        query: jest.fn(pgQueryImpl),
      })),
    }));

    return require("../index").app;
  };

  test("BE_UT_20 - Thiếu size → 400", async () => {
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async () => ({ rowCount: 0, rows: [] }),
    });

    const res = await request(app).post("/addtocart").set("auth-token", "good").send({ itemId: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Size is required");
  });

  test("BE_UT_21 - User không tồn tại → 404", async () => {
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async (sql) => {
        if (String(sql).includes("SELECT id, cart_data FROM users")) return { rowCount: 0, rows: [] };
        return { rowCount: 0, rows: [] };
      },
    });

    const res = await request(app).post("/addtocart").set("auth-token", "good").send({ itemId: 1, size: "M" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("BE_UT_22 - Thêm lần 1 → cart_data key=1", async () => {
    const updates = [];
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async (sql, params) => {
        const s = String(sql);
        if (s.includes("SELECT id, cart_data FROM users")) return { rowCount: 1, rows: [{ id: 1, cart_data: {} }] };
        if (s.includes("UPDATE users SET cart_data")) {
          updates.push(params[0]); // json string
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      },
    });

    const res = await request(app).post("/addtocart").set("auth-token", "good").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(200);
    expect(res.text).toBe("Added");
    expect(JSON.parse(updates[0])).toEqual({ "10-M": 1 });
  });

  test("BE_UT_23 - Thêm lần 2 → cart_data tăng lên 2", async () => {
    const updates = [];
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async (sql, params) => {
        const s = String(sql);
        if (s.includes("SELECT id, cart_data FROM users")) return { rowCount: 1, rows: [{ id: 1, cart_data: { "10-M": 1 } }] };
        if (s.includes("UPDATE users SET cart_data")) {
          updates.push(params[0]);
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      },
    });

    const res = await request(app).post("/addtocart").set("auth-token", "good").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(200);
    expect(res.text).toBe("Added");
    expect(JSON.parse(updates[0])).toEqual({ "10-M": 2 });
  });

  test("BE_UT_24 - User không tồn tại → 404 (remove)", async () => {
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async (sql) => {
        if (String(sql).includes("SELECT id, cart_data FROM users")) return { rowCount: 0, rows: [] };
        return { rowCount: 0, rows: [] };
      },
    });

    const res = await request(app).post("/removefromcart").set("auth-token", "good").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("User not found");
  });

  test("BE_UT_25 - Giảm số lượng 2→1", async () => {
    const updates = [];
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async (sql, params) => {
        const s = String(sql);
        if (s.includes("SELECT id, cart_data FROM users")) return { rowCount: 1, rows: [{ id: 1, cart_data: { "10-M": 2 } }] };
        if (s.includes("UPDATE users SET cart_data")) {
          updates.push(params[0]);
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      },
    });

    const res = await request(app).post("/removefromcart").set("auth-token", "good").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(200);
    expect(res.text).toBe("Removed");
    expect(JSON.parse(updates[0])).toEqual({ "10-M": 1 });
  });

  test("BE_UT_26 - Giảm 1→0 thì xóa key", async () => {
    const updates = [];
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async (sql, params) => {
        const s = String(sql);
        if (s.includes("SELECT id, cart_data FROM users")) return { rowCount: 1, rows: [{ id: 1, cart_data: { "10-M": 1 } }] };
        if (s.includes("UPDATE users SET cart_data")) {
          updates.push(params[0]);
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: 0, rows: [] };
      },
    });

    const res = await request(app).post("/removefromcart").set("auth-token", "good").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(200);
    expect(res.text).toBe("Removed");
    expect(JSON.parse(updates[0])).toEqual({});
  });

  test("BE_UT_27 - Token invalid → 401 (middleware)", async () => {
    const app = setup({
      jwtVerifyImpl: () => {
        throw new Error("bad");
      },
      pgQueryImpl: async () => ({ rowCount: 0, rows: [] }),
    });

    const res = await request(app).post("/addtocart").set("auth-token", "bad").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Token is not valid");
  });

  test("BE_UT_28 - Không có token → 401 (middleware)", async () => {
    const app = setup({
      jwtVerifyImpl: () => ({ id: 1, email: "u@x.com" }),
      pgQueryImpl: async () => ({ rowCount: 0, rows: [] }),
    });

    const res = await request(app).post("/removefromcart").send({ itemId: 10, size: "M" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("No token, authorization denied");
  });
});
