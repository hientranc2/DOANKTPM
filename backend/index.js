// backend/index.js
"use strict";

const express = require("express");
const app = express();

const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Load .env when local
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv").config();
  } catch (e) {
    // ignore
  }
}

// ================== CONFIG ==================
const PORT = process.env.PORT || 4000;

// JWT secret (deploy nhớ set ENV: JWT_SECRET)
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

// Default admin (deploy set ADMIN_EMAIL/ADMIN_NAME/ADMIN_PASSWORD)
const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@clothify.com").toLowerCase();
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || "Clothify Admin";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

const ALLOWED_ROLES = ["customer", "admin"];

// Trust proxy (quan trọng khi chạy sau reverse proxy như Render)
app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));

// ================== HELPERS ==================
const stripTrailingSlash = (s) => String(s || "").replace(/\/+$/, "");

const resolveConfiguredPublicBase = () => {
  const explicitEnv = stripTrailingSlash(process.env.PUBLIC_BASE_URL || "");
  if (explicitEnv) return explicitEnv;

  const renderExternalUrl = stripTrailingSlash(process.env.RENDER_EXTERNAL_URL || "");
  if (renderExternalUrl) return renderExternalUrl;

  const renderHostname = stripTrailingSlash(process.env.RENDER_EXTERNAL_HOSTNAME || "");
  if (renderHostname) return `https://${renderHostname}`;

  if (process.env.NODE_ENV === "production") return "https://doanktpm.onrender.com";

  return "";
};

const STATIC_PUBLIC_BASE_URL = resolveConfiguredPublicBase();

// URL public của backend (ưu tiên ENV/render metadata để luôn là https)
const getPublicBaseUrl = (req) => {
  if (STATIC_PUBLIC_BASE_URL) return STATIC_PUBLIC_BASE_URL;

  const forwardedProto = req.get("x-forwarded-proto");
  const proto = forwardedProto ? forwardedProto.split(",")[0] : req.protocol;

  return stripTrailingSlash(`${proto}://${req.get("host")}`);
};

// Chuyển image URL/path về dạng lưu DB (NÊN LƯU RELATIVE: /images/xxx.png)
const toStoredImagePath = (val) => {
  if (!val) return "";
  const s = String(val).trim();

  // Nếu là full URL -> lấy pathname (/images/...)
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      return u.pathname;
    }
  } catch (e) { }

  // Nếu đã là /images/.. hoặc images/.. thì normalize
  if (s.startsWith("/")) return s;
  return "/" + s;
};

// Khi trả về cho frontend: chỉ return relative path - frontend sẽ resolve via resolveImageUrl()
const toPublicImageUrl = (req, val) => {
  if (!val) return "";
  return toStoredImagePath(val);
};

// ================== CORS ==================
// Set ENV: CORS_ORIGIN="https://your-frontend.vercel.app,https://another-domain.com"
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => stripTrailingSlash(s.trim()))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman/curl

      // Dev: nếu chưa set CORS_ORIGIN thì cho all
      if (allowedOrigins.length === 0) return cb(null, true);

      const normalized = stripTrailingSlash(origin);
      if (allowedOrigins.includes(normalized)) return cb(null, true);

      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

// ================== PostgreSQL CONNECTION ==================
// Ưu tiên DATABASE_URL (Render cung cấp). Nếu không có thì dùng env rời/local.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
      connectionString: process.env.DATABASE_URL,
      // Render/host thường cần SSL (nhất là external URL)
      ssl:
        process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
          ? { rejectUnauthorized: false }
          : false,
    }
    : {
      user: process.env.POSTGRES_USER || "postgres",
      host: process.env.POSTGRES_HOST || "localhost",
      database: process.env.POSTGRES_DB || "clothify",
      password: process.env.POSTGRES_PASSWORD || "kt123456",
      port: Number(process.env.POSTGRES_PORT || 5432),
      // Enable SSL for external databases (Render, AWS RDS, etc.)
      ssl: process.env.POSTGRES_HOST && process.env.POSTGRES_HOST !== "db"
        ? { rejectUnauthorized: false }
        : false,
    }
);

// ================== DB INIT (schema + seed admin + fix old data) ==================
const ensureSchemaAndAdminUser = async () => {
  // users.role
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(50)
      DEFAULT 'customer'
      CHECK (role IN ('customer', 'admin'))
  `);

  await pool.query(`UPDATE users SET role = 'customer' WHERE role IS NULL`);

  // products.images
  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
  `);

  // normalize images + image
  await pool.query(`
    UPDATE products
    SET images = CASE
      WHEN images IS NULL THEN CASE WHEN image IS NOT NULL THEN jsonb_build_array(image) ELSE '[]'::jsonb END
      WHEN jsonb_typeof(images) != 'array' THEN '[]'::jsonb
      ELSE images
    END,
    image = CASE
      WHEN image IS NULL AND images IS NOT NULL AND jsonb_typeof(images) = 'array' AND jsonb_array_length(images) > 0 THEN images->>0
      ELSE image
    END
  `);

  // ✅ FIX: strip localhost URLs đã lưu trong DB (mixed content)
  await pool.query(`
    UPDATE products
    SET image = regexp_replace(image, '^https?://localhost:4000', '')
    WHERE image ~ '^https?://localhost:4000'
  `);

  await pool.query(`
    UPDATE products
    SET images = (
      SELECT jsonb_agg(regexp_replace(value, '^https?://localhost:4000', ''))
      FROM jsonb_array_elements_text(images) AS value
    )
    WHERE images IS NOT NULL AND jsonb_typeof(images) = 'array'
  `);

  // ensure sequences are aligned with current max(id) to avoid duplicate key errors on insert
  const syncSequence = async (table, column) => {
    const seqResult = await pool.query(`SELECT pg_get_serial_sequence($1, $2) AS seq`, [table, column]);
    const seqName = seqResult.rows[0]?.seq;
    if (!seqName) return;
    await pool.query(`SELECT setval($1, COALESCE((SELECT MAX(${column}) FROM ${table}), 0))`, [seqName]);
  };

  await syncSequence("products", "id");
  await syncSequence("users", "id");
  await syncSequence("orders", "id");
  await syncSequence("order_items", "id");

  // seed/update admin
  const adminResult = await pool.query("SELECT id, role FROM users WHERE email = $1", [DEFAULT_ADMIN_EMAIL]);

  if (adminResult.rowCount === 0) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (name, email, password, status, role)
       VALUES ($1, $2, $3, 'active', 'admin')`,
      [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashedPassword]
    );
    console.log(`Seeded default admin account for ${DEFAULT_ADMIN_EMAIL}`);
  } else if (adminResult.rows[0].role !== "admin") {
    await pool.query(`UPDATE users SET role = 'admin', status = 'active' WHERE email = $1`, [DEFAULT_ADMIN_EMAIL]);
    console.log(`Updated ${DEFAULT_ADMIN_EMAIL} to admin role`);
  }
};

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL");
    if (process.env.NODE_ENV !== "test") {
      await ensureSchemaAndAdminUser();
    }
  } catch (err) {
    console.error("DB init error:", err);
  }
})();

// ================== API TEST ==================
app.get("/", (req, res) => {
  res.send("Express App is running with PostgreSQL");
});

// ================== IMAGE UPLOAD ==================
const uploadDir = path.join(__dirname, "upload", "images");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

// Static path
app.use("/images", express.static(uploadDir));

// Upload endpoint
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: 0, message: "No file uploaded" });

  // Return relative path - frontend will resolve to full URL via resolveImageUrl()
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`,
  });
});

// ================== PRODUCTS ==================

// ADD PRODUCT
app.post("/addproduct", async (req, res) => {
  try {
    const { name, image, images = [], category, new_price, old_price } = req.body;

    const normalizedImages = Array.isArray(images)
      ? images
        .map(toStoredImagePath)
        .filter((img) => typeof img === "string" && img.trim().length > 0)
      : [];

    const primaryImage = normalizedImages[0] || toStoredImagePath(image);

    const parsedNewPrice = Number(new_price);
    const parsedOldPrice = Number(old_price);

    if (!name || !primaryImage || !category || Number.isNaN(parsedNewPrice) || Number.isNaN(parsedOldPrice)) {
      return res.status(400).json({ success: false, message: "Missing required product fields." });
    }

    const imagesToSave = normalizedImages.length > 0 ? normalizedImages : [primaryImage];

    const result = await pool.query(
      `INSERT INTO products (name, image, images, category, new_price, old_price)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6)
       RETURNING *`,
      [name, primaryImage, JSON.stringify(imagesToSave), category, parsedNewPrice, parsedOldPrice]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error("Error creating product", error);
    res.status(500).json({ success: false, message: "Unable to create product." });
  }
});

// REMOVE PRODUCT
app.post("/removeproduct", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Product id is required." });

    const result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [Number(id)]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error("Error deleting product", error);
    res.status(500).json({ success: false, message: "Unable to delete product." });
  }
});

// UPDATE PRODUCT
app.put("/product/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { name, image, images, category, new_price, old_price, available } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }

    if (image !== undefined) {
      const stored = toStoredImagePath(image);
      fields.push(`image = $${idx++}`);
      values.push(stored);
    }

    if (images !== undefined) {
      const normalizedImages = Array.isArray(images)
        ? images
          .map(toStoredImagePath)
          .filter((img) => typeof img === "string" && img.trim().length > 0)
        : [];

      fields.push(`images = $${idx++}::jsonb`);
      values.push(JSON.stringify(normalizedImages));

      // nếu không truyền image mà có images -> set image = images[0]
      if ((image === undefined || !image) && normalizedImages.length > 0) {
        fields.push(`image = $${idx++}`);
        values.push(normalizedImages[0]);
      }
    }

    if (category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(category);
    }

    if (new_price !== undefined) {
      const parsedNew = Number(new_price);
      if (Number.isNaN(parsedNew)) return res.status(400).json({ success: false, message: "Price must be a number." });
      fields.push(`new_price = $${idx++}`);
      values.push(parsedNew);
    }

    if (old_price !== undefined) {
      const parsedOld = Number(old_price);
      if (Number.isNaN(parsedOld)) return res.status(400).json({ success: false, message: "Price must be a number." });
      fields.push(`old_price = $${idx++}`);
      values.push(parsedOld);
    }

    if (available !== undefined) {
      fields.push(`available = $${idx++}`);
      values.push(available);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update." });
    }

    values.push(Number(id));
    const query = `UPDATE products SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error("Error updating product", error);
    res.status(500).json({ success: false, message: "Unable to update product." });
  }
});

// GET ALL PRODUCTS (trả image/images dạng FULL https URL)
app.get("/allproducts", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");

    const rows = result.rows.map((p) => {
      const image = p.image ? toPublicImageUrl(req, p.image) : "";
      const imgs = Array.isArray(p.images) ? p.images.map((x) => toPublicImageUrl(req, x)) : [];
      return { ...p, image, images: imgs };
    });

    res.json(rows);
  } catch (error) {
    console.error("Error fetching products", error);
    res.status(500).json({ success: false, message: "Unable to fetch products." });
  }
});

// ================== AUTH & USERS ==================

// REGISTER
app.post("/register", async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required registration fields." });
    }

    email = email.toLowerCase();

    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, 'customer')
       RETURNING id, name, email, status, role, created_at`,
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role || "customer",
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Registration error", error);
    res.status(500).json({ success: false, message: "Unable to register user." });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing login credentials." });
    }

    email = email.toLowerCase();

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const user = result.rows[0];

    if (user.status === "suspended") {
      return res.status(403).json({ success: false, message: "Account is suspended." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role || "customer",
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ success: false, message: "Unable to login." });
  }
});

// GET USERS (no password)
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, status, role, created_at FROM users ORDER BY created_at DESC");

    const users = result.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      role: u.role || "customer",
      createdAt: u.created_at,
    }));

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users", error);
    res.status(500).json({ success: false, message: "Unable to fetch users." });
  }
});

// UPDATE USER STATUS
app.patch("/users/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid user status." });
    }

    const existingUser = await pool.query("SELECT id, email FROM users WHERE id = $1", [Number(userId)]);
    if (existingUser.rowCount === 0) return res.status(404).json({ success: false, message: "User not found." });

    const normalizedEmail = (existingUser.rows[0].email || "").toLowerCase();
    if (normalizedEmail === DEFAULT_ADMIN_EMAIL && status !== "active") {
      return res.status(400).json({ success: false, message: "Cannot suspend the default administrator account." });
    }

    const result = await pool.query(
      `UPDATE users SET status = $1 WHERE id = $2
       RETURNING id, name, email, status, created_at`,
      [status, Number(userId)]
    );

    const user = result.rows[0];

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, status: user.status, createdAt: user.created_at },
    });
  } catch (error) {
    console.error("Error updating user status", error);
    res.status(500).json({ success: false, message: "Unable to update user status." });
  }
});

// UPDATE USER ROLE
app.patch("/users/:userId/role", async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const normalizedRole = typeof role === "string" ? role.toLowerCase() : "";
    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Invalid user role." });
    }

    const existingResult = await pool.query("SELECT id, name, email, status, role, created_at FROM users WHERE id = $1", [
      Number(userId),
    ]);

    if (existingResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const existingUser = existingResult.rows[0];
    const normalizedEmail = (existingUser.email || "").toLowerCase();

    if (normalizedEmail === DEFAULT_ADMIN_EMAIL && normalizedRole !== "admin") {
      return res.status(400).json({ success: false, message: "Cannot remove admin role from the default administrator account." });
    }

    const updateResult = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, name, email, status, role, created_at`,
      [normalizedRole, Number(userId)]
    );

    const user = updateResult.rows[0];

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, status: user.status, role: user.role, createdAt: user.created_at },
    });
  } catch (error) {
    console.error("Error updating user role", error);
    res.status(500).json({ success: false, message: "Unable to update user role." });
  }
});

// ================== AUTH MIDDLEWARE ==================
const fetchuser = (req, res, next) => {
  try {
    // hỗ trợ cả 'auth-token' và 'Authorization: Bearer <token>'
    const authToken = req.header("auth-token");
    const authHeader = req.header("authorization");
    const token = authToken || (authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null);

    if (!token) return res.status(401).json({ error: "No token, authorization denied" });

    const data = jwt.verify(token, JWT_SECRET);
    req.user = data; // { id, email }
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token is not valid" });
  }
};

// ================== CART (cart_data JSONB in users) ==================
app.post("/addtocart", fetchuser, async (req, res) => {
  try {
    const { itemId, size } = req.body;
    if (!size) return res.status(400).send({ error: "Size is required" });

    const userResult = await pool.query("SELECT id, cart_data FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rowCount === 0) return res.status(404).send({ error: "User not found" });

    const user = userResult.rows[0];
    const cartData = user.cart_data || {};
    const key = `${itemId}-${size}`;

    cartData[key] = (cartData[key] || 0) + 1;

    await pool.query("UPDATE users SET cart_data = $1::jsonb WHERE id = $2", [JSON.stringify(cartData), req.user.id]);

    res.send("Added");
  } catch (error) {
    console.error("Error add to cart", error);
    res.status(500).send({ error: "Server error" });
  }
});

app.post("/removefromcart", fetchuser, async (req, res) => {
  try {
    const { itemId, size } = req.body;

    const userResult = await pool.query("SELECT id, cart_data FROM users WHERE id = $1", [req.user.id]);
    if (userResult.rowCount === 0) return res.status(404).send({ error: "User not found" });

    const user = userResult.rows[0];
    const cartData = user.cart_data || {};
    const key = `${itemId}-${size}`;

    if (cartData[key] > 0) {
      cartData[key] -= 1;
      if (cartData[key] <= 0) delete cartData[key];
    }

    await pool.query("UPDATE users SET cart_data = $1::jsonb WHERE id = $2", [JSON.stringify(cartData), req.user.id]);

    res.send("Removed");
  } catch (error) {
    console.error("Error remove from cart", error);
    res.status(500).send({ error: "Server error" });
  }
});

// ================== ORDERS ==================
const formatOrderResponse = (order, items = []) => ({
  orderId: order.order_id,
  status: order.status,
  total: Number(order.total),
  createdAt: order.created_at,
  customer: order.customer_id
    ? {
      id: order.customer_id,
      name: order.user_name || order.customer_name,
      email: order.user_email || order.customer_email,
      status: order.user_status || "active",
    }
    : {
      name: order.customer_name,
      email: order.customer_email,
    },
  items: items.map((item) => ({
    productId: item.product_id,
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price),
  })),
});

// GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.status AS user_status
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       ORDER BY o.created_at DESC`
    );

    const orders = ordersResult.rows;
    if (orders.length === 0) return res.json({ success: true, orders: [] });

    const orderPkIds = orders.map((o) => o.id);

    const itemsResult = await pool.query(`SELECT * FROM order_items WHERE order_id = ANY($1::int[])`, [orderPkIds]);

    const itemsByOrderId = {};
    for (const item of itemsResult.rows) {
      if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
      itemsByOrderId[item.order_id].push(item);
    }

    const formatted = orders.map((order) => formatOrderResponse(order, itemsByOrderId[order.id] || []));
    res.json({ success: true, orders: formatted });
  } catch (error) {
    console.error("Error fetching orders", error);
    res.status(500).json({ success: false, message: "Unable to fetch orders." });
  }
});

// CREATE ORDER
app.post("/orders", async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, items = [], total = 0, status = "pending" } = req.body;

    const allowedStatuses = ["pending", "processing", "shipped"];
    const normalizedStatus = allowedStatuses.includes(status) ? status : "pending";

    const lastOrder = await pool.query("SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1");
    const nextOrderId = lastOrder.rowCount > 0 ? lastOrder.rows[0].order_id + 1 : 1;

    let customer_id = null;
    let resolvedName = customerName || null;
    let resolvedEmail = customerEmail || null;
    let user_status = null;

    if (customerId) {
      const userResult = await pool.query("SELECT id, name, email, status FROM users WHERE id = $1", [customerId]);
      if (userResult.rowCount > 0) {
        const user = userResult.rows[0];
        customer_id = user.id;
        resolvedName = user.name;
        resolvedEmail = user.email;
        user_status = user.status;
      }
    }

    const sanitizedItems = Array.isArray(items)
      ? items.map((item) => ({
        product_id: item.productId,
        name: item.name,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
      }))
      : [];

    const parsedTotal = Number(total) || 0;

    const orderInsert = await pool.query(
      `INSERT INTO orders (order_id, customer_id, customer_name, customer_email, total, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nextOrderId, customer_id, resolvedName, resolvedEmail, parsedTotal, normalizedStatus]
    );

    const orderDb = orderInsert.rows[0];

    for (const item of sanitizedItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderDb.id, item.product_id, item.name, item.quantity, item.price]
      );
    }

    const formatted = formatOrderResponse(
      { ...orderDb, user_name: resolvedName, user_email: resolvedEmail, user_status },
      sanitizedItems.map((i) => ({
        product_id: i.product_id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }))
    );

    res.json({ success: true, order: formatted });
  } catch (error) {
    console.error("Error creating order", error);
    res.status(500).json({ success: false, message: "Unable to create order." });
  }
});

// UPDATE ORDER STATUS
app.patch("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "processing", "shipped"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid order status." });
    }

    const updateResult = await pool.query("UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING id", [
      status,
      Number(orderId),
    ]);

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const orderPkId = updateResult.rows[0].id;

    const orderResult = await pool.query(
      `SELECT o.*, u.name AS user_name, u.email AS user_email, u.status AS user_status
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.id = $1`,
      [orderPkId]
    );

    const orderRow = orderResult.rows[0];

    const itemsResult = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [orderPkId]);

    const formatted = formatOrderResponse(orderRow, itemsResult.rows);
    res.json({ success: true, order: formatted });
  } catch (error) {
    console.error("Error updating order", error);
    res.status(500).json({ success: false, message: "Unable to update order." });
  }
});

// ================== START SERVER ==================
// Xuất app để dùng trong test (Supertest); chỉ listen khi không ở môi trường test
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
