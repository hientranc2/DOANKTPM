process.env.NODE_ENV = "test";

const jwt = require("jsonwebtoken");
const { fetchuser } = require("../index");

describe("fetchuser middleware - Unit Test", () => {
  test("Không có token → trả 401", () => {
    const req = { header: () => null };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    fetchuser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "No token, authorization denied",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("Token sai → trả 401", () => {
    const req = { header: () => "wrong.token.string" };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    fetchuser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Token is not valid",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("Token đúng → gọi next()", () => {
    // Quan trọng: JWT_SECRET phải giống hệt cái đang dùng trong index.js
    // index.js của bạn đang: process.env.JWT_SECRET || "dev_secret_change_me"
    process.env.JWT_SECRET = "dev_secret_change_me";

    // require lại để chắc chắn đọc đúng env (nếu cần)
    // (Nếu vẫn fail, xóa cache module rồi require lại index)
    const { fetchuser: fetchuserFresh } = require("../index");

    const payload = { id: 10, email: "test@test.com" };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    const req = {
      header: (name) => {
        if (name === "auth-token") return token;
        if (name === "authorization") return null;
        return null;
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const next = jest.fn();

    fetchuserFresh(req, res, next);

    expect(req.user.id).toBe(payload.id);
    expect(req.user.email).toBe(payload.email);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
