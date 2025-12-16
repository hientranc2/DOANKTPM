process.env.NODE_ENV = "test";

const request = require("supertest");
const express = require("express");

const app = express();
app.use(express.json());

app.post("/register", async (req, res) => {
  let { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
  }
  return res.json({ success: true });
});

describe("REGISTER Validation - Unit Test", () => {

  test("Thiếu email → 400", async () => {
    const res = await request(app)
      .post("/register")
      .send({ name: "Nam", password: "123456" });

    expect(res.statusCode).toBe(400);
  });

  test("Thiếu password → 400", async () => {
    const res = await request(app)
      .post("/register")
      .send({ name: "Nam", email: "test@test.com" });

    expect(res.statusCode).toBe(400);
  });

  test("Đủ thông tin → success", async () => {
    const res = await request(app)
      .post("/register")
      .send({ name: "Nam", email: "test@test.com", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
