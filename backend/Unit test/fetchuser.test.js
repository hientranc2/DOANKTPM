// Auto-generated Jest unit tests aligned with Excel: Backend_Unit_Test_Cases_Auth_Cart_Order.xlsx

/* eslint-disable */
describe("middleware fetchuser", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = "test";
  });

  const buildRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  };

  test("BE_UT_01 - Không có token → trả 401", () => {
    jest.doMock("jsonwebtoken", () => ({ verify: jest.fn() }));
    jest.doMock("pg", () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }));

    const { fetchuser } = require("../index");
    const req = { header: jest.fn(() => null) };
    const res = buildRes();
    const next = jest.fn();

    fetchuser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No token, authorization denied" });
    expect(next).not.toHaveBeenCalled();
  });

  test("BE_UT_02 - Token sai → trả 401", () => {
    const verify = jest.fn(() => {
      throw new Error("bad token");
    });

    jest.doMock("jsonwebtoken", () => ({ verify }));
    jest.doMock("pg", () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }));

    const { fetchuser } = require("../index");
    const req = {
      header: jest.fn((name) => (name === "auth-token" ? "wrong.token.string" : null)),
    };
    const res = buildRes();
    const next = jest.fn();

    fetchuser(req, res, next);

    expect(verify).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token is not valid" });
    expect(next).not.toHaveBeenCalled();
  });

  test("BE_UT_03 - Token đúng → gọi next() và set req.user", () => {
    const verify = jest.fn(() => ({ id: 7, email: "u@example.com" }));

    jest.doMock("jsonwebtoken", () => ({ verify }));
    jest.doMock("pg", () => ({ Pool: jest.fn(() => ({ query: jest.fn() })) }));

    const { fetchuser } = require("../index");
    const req = {
      header: jest.fn((name) => (name === "authorization" ? "Bearer good.token" : null)),
    };
    const res = buildRes();
    const next = jest.fn();

    fetchuser(req, res, next);

    expect(req.user).toEqual({ id: 7, email: "u@example.com" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
