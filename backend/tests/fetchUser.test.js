process.env.NODE_ENV = "test";

const jwt = require("jsonwebtoken");
const { fetchuser } = require("../index");

const JWT_SECRET = "secret_ecom";

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
      error: "No token, authorization denied"
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
    expect(next).not.toHaveBeenCalled();
  });

  test("Token đúng → gọi next()", () => {
    const payload = { id: 10, email: "test@test.com" };
    const token = jwt.sign(payload, JWT_SECRET);

    const req = {
      header: () => token
    };
    const res = {};
    const next = jest.fn();

    fetchuser(req, res, next);

expect(req.user.id).toBe(payload.id);
expect(req.user.email).toBe(payload.email);
    expect(next).toHaveBeenCalled();
  });

});
