const request = require("supertest");
const { spawn } = require("child_process");
const path = require("path");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:4000";
const api = request(BASE_URL);

let serverProcess;
let startedHere = false;

let productId;
let userId;
let userToken;
let orderId;

const userEmail = `test${Date.now()}@mail.com`;
const userPassword = "123456";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.POSTGRES_USER || process.env.PGUSER || process.env.USER;
  if (!user) return undefined;

  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const host = process.env.POSTGRES_HOST || process.env.PGHOST || "localhost";
  const port = process.env.POSTGRES_PORT || process.env.PGPORT || 5432;
  const database = process.env.POSTGRES_DB || process.env.PGDATABASE || "clothify";

  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);

  return `postgresql://${auth}@${host}:${port}/${database}`;
};

const isServerUp = async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 500);
  try {
    const res = await fetch(`${BASE_URL}/`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

beforeAll(async () => {
  jest.setTimeout(20000);

  if (await isServerUp()) {
    return;
  }

  const env = { ...process.env, NODE_ENV: "test" };
  const databaseUrl = resolveDatabaseUrl();
  if (databaseUrl) env.DATABASE_URL = databaseUrl;

  serverProcess = spawn("node", ["index.js"], {
    cwd: path.join(__dirname, ".."),
    env,
    stdio: "ignore",
  });
  startedHere = true;

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await isServerUp()) return;
    await sleep(200);
  }

  throw new Error("Server did not start on " + BASE_URL);
});

afterAll(() => {
  if (startedHere && serverProcess) {
    serverProcess.kill("SIGTERM");
  }
});

test("IT-01 GET / -> server hoat dong", async () => {
  const res = await api.get("/");

  expect(res.statusCode).toBe(200);
  expect(res.text).toBe("Express App is running with PostgreSQL");
});

test("IT-02 POST /upload -> upload anh hop le", async () => {
  const res = await api
    .post("/upload")
    .attach("product", Buffer.from("fake-image-bytes"), "test.jpg");

  expect(res.statusCode).toBe(200);
  expect(res.body.image_url).toBeDefined();
});

test("IT-03 POST /addproduct -> them san pham hop le", async () => {
  const res = await api.post("/addproduct").send({
    name: `Test Product ${Date.now()}`,
    image: "/images/test.jpg",
    category: "shirt",
    new_price: 100,
    old_price: 120,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.product).toBeDefined();
  productId = res.body.product.id;
});

test("IT-04 POST /addproduct -> thieu du lieu bat buoc", async () => {
  const res = await api.post("/addproduct").send({
    category: "shirt",
    new_price: 100,
    old_price: 120,
  });

  expect(res.statusCode).toBe(400);
});

test("IT-05 GET /allproducts -> lay danh sach san pham", async () => {
  const res = await api.get("/allproducts");

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test("IT-06 PUT /product/:id -> cap nhat thong tin san pham", async () => {
  expect(productId).toBeDefined();

  const res = await api.put(`/product/${productId}`).send({ new_price: 150 });

  expect(res.statusCode).toBe(200);
  expect(res.body.product).toBeDefined();
});

test("IT-07 PUT /product/:id -> id khong ton tai", async () => {
  const res = await api.put("/product/999999").send({ new_price: 200 });

  expect(res.statusCode).toBe(404);
});

test("IT-08 POST /removeproduct -> xoa san pham", async () => {
  expect(productId).toBeDefined();

  const res = await api.post("/removeproduct").send({ id: productId });

  expect(res.statusCode).toBe(200);
});

test("IT-09 POST /register -> dang ky tai khoan moi", async () => {
  const res = await api.post("/register").send({
    name: "Test User",
    email: userEmail,
    password: userPassword,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeDefined();
  userId = res.body.user?.id;
  userToken = res.body.token;
});

test("IT-10 POST /register -> email da ton tai", async () => {
  const res = await api.post("/register").send({
    name: "Test User Dup",
    email: userEmail,
    password: userPassword,
  });

  expect(res.statusCode).toBe(400);
});

test("IT-11 POST /login -> dang nhap hop le", async () => {
  const res = await api.post("/login").send({
    email: userEmail,
    password: userPassword,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeDefined();
  userToken = res.body.token;
});

test("IT-12 POST /login -> sai mat khau", async () => {
  const res = await api.post("/login").send({
    email: userEmail,
    password: "wrong-password",
  });

  expect(res.statusCode).toBe(401);
});

test("IT-13 GET /users -> lay danh sach user", async () => {
  const res = await api.get("/users");

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.users)).toBe(true);
  if (res.body.users.length) {
    expect(res.body.users[0].password).toBeUndefined();
  }
});

test("IT-14 PATCH /users/:id/status -> cap nhat trang thai user", async () => {
  expect(userId).toBeDefined();

  const res = await api.patch(`/users/${userId}/status`).send({ status: "suspended" });

  expect(res.statusCode).toBe(200);
});

test("IT-15 PATCH /users/:id/role -> cap nhat role user", async () => {
  expect(userId).toBeDefined();

  const res = await api.patch(`/users/${userId}/role`).send({ role: "admin" });

  expect(res.statusCode).toBe(200);
});

test("IT-16 POST /addtocart -> them san pham vao gio hang", async () => {
  expect(userToken).toBeDefined();

  const res = await api
    .post("/addtocart")
    .set("auth-token", userToken)
    .send({ itemId: 1, size: "M" });

  expect(res.statusCode).toBe(200);
  expect(res.text).toBe("Added");
});

test("IT-17 POST /addtocart -> khong co token", async () => {
  const res = await api.post("/addtocart").send({ itemId: 1, size: "M" });

  expect(res.statusCode).toBe(401);
});

test("IT-18 POST /removefromcart -> xoa san pham khoi gio", async () => {
  expect(userToken).toBeDefined();

  const res = await api
    .post("/removefromcart")
    .set("auth-token", userToken)
    .send({ itemId: 1, size: "M" });

  expect(res.statusCode).toBe(200);
  expect(res.text).toBe("Removed");
});

test("IT-19 POST /orders -> tao don hang moi", async () => {
  const res = await api.post("/orders").send({
    items: [{ productId: 1, name: "Test Item", quantity: 1, price: 100 }],
    total: 100,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.order).toBeDefined();
  orderId = res.body.order?.orderId;
  expect(orderId).toBeDefined();
});

test("IT-20 GET /orders -> lay danh sach don hang", async () => {
  const res = await api.get("/orders");

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.orders)).toBe(true);
});

test("IT-21 PATCH /orders/:orderId -> cap nhat trang thai don", async () => {
  expect(orderId).toBeDefined();

  const res = await api.patch(`/orders/${orderId}`).send({ status: "shipped" });

  expect(res.statusCode).toBe(200);
});

test("IT-22 PATCH /orders/:orderId -> status khong hop le", async () => {
  expect(orderId).toBeDefined();

  const res = await api.patch(`/orders/${orderId}`).send({ status: "invalid-status" });

  expect(res.statusCode).toBe(400);
});
