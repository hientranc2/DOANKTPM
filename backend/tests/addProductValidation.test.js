process.env.NODE_ENV = "test";

const { pool } = require("../index"); // nếu chưa export pool thì mock thủ công
const request = require("supertest");
const express = require("express");

// mock express app
const app = express();
app.use(express.json());
const { fetchuser } = require("../index");

app.post("/addproduct", async (req, res) => {
  const { name, image, category, new_price, old_price } = req.body;
  const parsedNewPrice = Number(new_price);
  const parsedOldPrice = Number(old_price);

  if (!name || !image || !category || Number.isNaN(parsedNewPrice) || Number.isNaN(parsedOldPrice)) {
    return res.status(400).json({ success: false, message: 'Missing required product fields.' });
  }

  return res.json({ success: true });
});

describe("ADD PRODUCT Validation - Unit Test", () => {

  test("Thiếu name → trả lỗi 400", async () => {
    const res = await request(app)
      .post("/addproduct")
      .send({ image: "a.jpg", category: "shirt", new_price: 200, old_price: 300 });

    expect(res.statusCode).toBe(400);
  });

  test("Giá không phải number → trả lỗi", async () => {
    const res = await request(app)
      .post("/addproduct")
      .send({ name: "Ao", image: "a.jpg", category: "shirt", new_price: "abc", old_price: 200 });

    expect(res.statusCode).toBe(400);
  });

  test("Đủ data hợp lệ → success", async () => {
    const res = await request(app)
      .post("/addproduct")
      .send({ name: "Ao phông", image: "a.jpg", category: "shirt", new_price: 200, old_price: 300 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

});
