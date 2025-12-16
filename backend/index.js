const port = 4000;
const express = require("express");
const app = express();
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "secret_ecom";
const DEFAULT_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "admin@clothify.com"
).toLowerCase();
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || "Clothify Admin";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ALLOWED_ROLES = ["customer", "admin"];

app.use(express.json());
app.use(cors());

// ================== PostgreSQL CONNECTION ==================
const pool = new Pool({
  user: "phangiakiet",
  host: "localhost",
  database: "clothify",
  password: "",
  port: 5432,
});

const ensureSchemaAndAdminUser = async () => {
  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(50)
      DEFAULT 'customer'
      CHECK (role IN ('customer', 'admin'))
  `);

  await pool.query("UPDATE users SET role = 'customer' WHERE role IS NULL");

  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb
  `);

  const adminResult = await pool.query(
    "SELECT id, role FROM users WHERE email = $1",
    [DEFAULT_ADMIN_EMAIL]
  );

  if (adminResult.rowCount === 0) {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
    await pool.query(
      `INSERT INTO users (name, email, password, status, role)
       VALUES ($1, $2, $3, 'active', 'admin')`,
      [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, hashedPassword]
    );
  } else if (adminResult.rows[0].role !== "admin") {
    await pool.query(
      `UPDATE users SET role = 'admin', status = 'active' WHERE email = $1`,
      [DEFAULT_ADMIN_EMAIL]
    );
  }
};

if (process.env.NODE_ENV !== "test") {
  pool
    .connect()
    .then(async (client) => {
      client.release();
      console.log("Connected to PostgreSQL");
      await ensureSchemaAndAdminUser();
    })
    .catch((err) => console.error("PostgreSQL connection error", err.stack));
}

// ================== HEALTHCHECK ==================
app.get("/", (req, res) => {
  res.send("Express App is running with PostgreSQL");
});

// ================== IMAGE UPLOAD ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "upload", "images"));
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage });
app.use("/images", express.static(path.join(__dirname, "upload", "images")));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: true,
    image_url: `/images/${req.file.filename}`,
  });
});

// ================== AUTH MIDDLEWARE ==================
const fetchuser = (req, res, next) => {
  try {
    const token = req.header("auth-token");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ================== PRODUCTS ==================
app.post("/addproduct", async (req, res) => {
  try {
    const {
      name,
      image,
      images = [],
      category,
      new_price,
      old_price,
    } = req.body;

    const parsedNew = Number(new_price);
    const parsedOld = Number(old_price);

    if (
      !name ||
      !category ||
      Number.isNaN(parsedNew) ||
      Number.isNaN(parsedOld)
    ) {
      return res.status(400).json({ message: "Invalid product data" });
    }

    const normalizedImages = Array.isArray(images)
      ? images.filter((i) => typeof i === "string" && i.trim())
      : [];

    const imagesToSave =
      normalizedImages.length > 0 ? normalizedImages : image ? [image] : [];

    const primaryImage = imagesToSave[0] || null;

    const result = await pool.query(
      `INSERT INTO products (name, image, images, category, new_price, old_price)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6)
       RETURNING *`,
      [
        name,
        primaryImage,
        JSON.stringify(imagesToSave),
        category,
        parsedNew,
        parsedOld,
      ]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error("Error creating product", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/product/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (Number.isNaN(productId)) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(req.body)) {
    if (key === "images") {
      fields.push(`images = $${idx++}`);
      values.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (!fields.length) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  values.push(productId);

  try {
    const result = await pool.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!result.rowCount)
      return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error("Error updating product", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/removeproduct", async (req, res) => {
  const id = Number(req.body.id);
  if (Number.isNaN(id))
    return res.status(400).json({ message: "Invalid product id" });

  const result = await pool.query(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [id]
  );

  if (!result.rowCount)
    return res.status(404).json({ message: "Product not found" });

  res.json({ success: true });
});

app.get("/allproducts", async (req, res) => {
  const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
  res.json(result.rows);
});

// ================== AUTH ==================
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hashed = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1,$2,$3,'customer')
     RETURNING *`,
    [name, email.toLowerCase(), hashed]
  );

  const user = result.rows[0];
  const token = jwt.sign({ id: user.id }, JWT_SECRET);

  res.json({ success: true, token, user });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email.toLowerCase(),
  ]);

  if (!result.rowCount)
    return res.status(401).json({ message: "Invalid credentials" });

  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ success: true, token, user });
});

// ================== USERS (ADMIN ONLY) ==================
app.get("/users", fetchuser, async (req, res) => {
  const role = await pool.query("SELECT role FROM users WHERE id=$1", [
    req.user.id,
  ]);

  if (role.rows[0]?.role !== "admin")
    return res.status(403).json({ message: "Forbidden" });

  const users = await pool.query("SELECT id,name,email,status,role FROM users");
  res.json({ success: true, users: users.rows });
});

// ================== ORDERS ==================
app.post("/orders", async (req, res) => {
  const { total = 0 } = req.body;

  const last = await pool.query(
    "SELECT order_id FROM orders ORDER BY order_id DESC LIMIT 1"
  );
  const nextId = last.rowCount ? last.rows[0].order_id + 1 : 1;

  const result = await pool.query(
    `INSERT INTO orders (order_id,total,status)
     VALUES ($1,$2,'pending') RETURNING *`,
    [nextId, Number(total)]
  );

  res.json({ success: true, order: result.rows[0] });
});

app.patch("/orders/:orderId", async (req, res) => {
  const id = Number(req.params.orderId);
  if (Number.isNaN(id))
    return res.status(400).json({ message: "Invalid order id" });

  const result = await pool.query(
    "UPDATE orders SET status=$1 WHERE order_id=$2 RETURNING *",
    [req.body.status, id]
  );

  if (!result.rowCount)
    return res.status(404).json({ message: "Order not found" });

  res.json({ success: true });
});

// ================== START SERVER ==================
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Server is running on port ${port}`));
}

module.exports = app;
module.exports.pool = pool;
