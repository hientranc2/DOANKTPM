// migrate.js
// Script chuyển dữ liệu từ MongoDB Atlas sang PostgreSQL

const mongoose = require("mongoose");
const { Pool } = require("pg");

// ================== 1. CONFIG KẾT NỐI ==================

// !!! SỬA CHỖ NÀY: dùng đúng URI MongoDB cũ của bạn
// lấy từ file backend Mongo cũ hoặc từ Atlas (Connect → Connect your application)
const MONGO_URI =
  "mongodb+srv://hientran:Hien123123@cluster0.qf33pgy.mongodb.net/Clothify";

// !!! SỬA NẾU CẦN: config PostgreSQL (giống y như backend mới)
const pgPool = new Pool({
  user: "phangiakiet",
  host: "localhost",
  database: "clothify",
  password: "", // Homebrew postgres KHÔNG cần password
  port: 5432,
});

// ================== 2. MONGODB SCHEMAS ==================
// Dùng schema "superset" cho chắc, collection name set tường minh

// products
const mongoProductSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    image: String,
    category: String,
    new_price: Number,
    old_price: Number,
    date: Date,
    available: Boolean,
  },
  { collection: "products" }
);

const MongoProduct = mongoose.model("MongoProduct", mongoProductSchema);

// users (gộp cả User + Users trong backend cũ)
const mongoUserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    status: String,
    cartData: Object,
    createdAt: Date,
    date: Date,
  },
  { collection: "users" }
);

const MongoUser = mongoose.model("MongoUser", mongoUserSchema);

// orders
const mongoOrderSchema = new mongoose.Schema(
  {
    orderId: Number,
    customer: mongoose.Schema.Types.ObjectId, // ref User
    customerName: String,
    customerEmail: String,
    items: [
      {
        productId: Number,
        name: String,
        quantity: Number,
        price: Number,
      },
    ],
    total: Number,
    status: String,
    createdAt: Date,
  },
  { collection: "orders" }
);

const MongoOrder = mongoose.model("MongoOrder", mongoOrderSchema);

// ================== 3. CÁC HÀM MIGRATE ==================

async function migrateProducts() {
  console.log("\n=== Migrate PRODUCTS ===");
  const products = await MongoProduct.find({}).lean();
  console.log(`Tìm thấy ${products.length} sản phẩm trong Mongo`);

  for (const p of products) {
    const id = typeof p.id === "number" ? p.id : null;

    // Nếu có id tự tăng từ Mongo cũ thì giữ lại, để FE dùng productId vẫn khớp
    const query = id
      ? `INSERT INTO products (id, name, image, category, new_price, old_price, available, date, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           image = EXCLUDED.image,
           category = EXCLUDED.category,
           new_price = EXCLUDED.new_price,
           old_price = EXCLUDED.old_price,
           available = EXCLUDED.available,
           date = EXCLUDED.date,
           updated_at = EXCLUDED.updated_at`
      : `INSERT INTO products (name, image, category, new_price, old_price, available, date, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT DO NOTHING`;

    const params = id
      ? [
          id,
          p.name || "",
          p.image || "",
          p.category || "",
          Number(p.new_price) || 0,
          Number(p.old_price) || 0,
          p.available !== undefined ? !!p.available : true,
          p.date || new Date(),
          new Date(),
        ]
      : [
          p.name || "",
          p.image || "",
          p.category || "",
          Number(p.new_price) || 0,
          Number(p.old_price) || 0,
          p.available !== undefined ? !!p.available : true,
          p.date || new Date(),
          new Date(),
        ];

    await pgPool.query(query, params);
  }

  console.log("✓ Migrate products xong");
}

// trả về mapping để dùng khi migrate orders:
async function migrateUsers() {
  console.log("\n=== Migrate USERS ===");
  const users = await MongoUser.find({}).lean();
  console.log(`Tìm thấy ${users.length} user trong Mongo (collection "users")`);

  const mongoIdToPgId = new Map();
  const emailToPgId = new Map();

  for (const u of users) {
    const email = (u.email || "").toLowerCase();
    if (!email) {
      console.warn(`⚠️  Bỏ qua user không có email, _id=${u._id}`);
      continue;
    }

    const name = u.name || "";
    const password = u.password || ""; // đã hash sẵn trong Mongo
    const status = u.status || "active";
    const role = "customer";
    const created = u.createdAt || u.date || new Date(); // lấy createdAt, nếu không có thì lấy date

    const cartData = u.cartData || {};

    const result = await pgPool.query(
      `INSERT INTO users (name, email, password, status, role, cart_data, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (email) DO UPDATE SET
         name = EXCLUDED.name,
         password = EXCLUDED.password,
         status = EXCLUDED.status,
         role = EXCLUDED.role,
         cart_data = EXCLUDED.cart_data,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [name, email, password, status, role, cartData, created, created]
    );

    const pgId = result.rows[0].id;
    const mongoId = String(u._id);

    mongoIdToPgId.set(mongoId, pgId);
    emailToPgId.set(email, pgId);
  }

  console.log("✓ Migrate users xong");
  console.log(
    `→ Đã mapping ${mongoIdToPgId.size} user Mongo ↔ PostgreSQL (theo _id/email)`
  );

  return { mongoIdToPgId, emailToPgId };
}

async function migrateOrders(mappings) {
  console.log("\n=== Migrate ORDERS ===");
  const orders = await MongoOrder.find({}).lean();
  console.log(`Tìm thấy ${orders.length} đơn hàng trong Mongo`);

  const { mongoIdToPgId, emailToPgId } = mappings;

  for (const o of orders) {
    const orderId = Number(o.orderId);
    if (!orderId) {
      console.warn(`⚠️  Bỏ qua order không có orderId, _id=${o._id}`);
      continue;
    }

    // map customer_id (FK users.id)
    let customerId = null;

    if (o.customer) {
      const mapped = mongoIdToPgId.get(String(o.customer));
      if (mapped) {
        customerId = mapped;
      }
    }

    let customerEmail = (o.customerEmail || "").toLowerCase() || null;
    let customerName = o.customerName || null;

    // nếu chưa có customerId mà có email → thử map theo email
    if (!customerId && customerEmail) {
      const mapped = emailToPgId.get(customerEmail);
      if (mapped) {
        customerId = mapped;
      }
    }

    const total = Number(o.total) || 0;
    const status = ["pending", "processing", "shipped"].includes(o.status)
      ? o.status
      : "pending";
    const created = o.createdAt || new Date();

    // insert vào orders
    const orderResult = await pgPool.query(
      `INSERT INTO orders (
         order_id, customer_id, customer_name, customer_email,
         total, status, created_at, updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (order_id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         customer_name = EXCLUDED.customer_name,
         customer_email = EXCLUDED.customer_email,
         total = EXCLUDED.total,
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at
       RETURNING id`,
      [
        orderId,
        customerId,
        customerName,
        customerEmail,
        total,
        status,
        created,
        created,
      ]
    );

    const pgOrderPk = orderResult.rows[0].id;

    // insert items
    const items = Array.isArray(o.items) ? o.items : [];
    for (const it of items) {
      await pgPool.query(
        `INSERT INTO order_items (
           order_id, product_id, name, quantity, price, created_at
         )
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          pgOrderPk,
          it.productId || null,
          it.name || "",
          Number(it.quantity) || 0,
          Number(it.price) || 0,
          created,
        ]
      );
    }
  }

  console.log("✓ Migrate orders + order_items xong");
}

// ================== 4. MAIN ==================

async function main() {
  try {
    console.log("Kết nối MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✓ MongoDB ok");

    console.log("Kiểm tra kết nối PostgreSQL...");
    await pgPool.query("SELECT 1");
    console.log("✓ PostgreSQL ok");

    await migrateProducts();
    const mappings = await migrateUsers();
    await migrateOrders(mappings);

    console.log("\n🎉 DONE! Migrate tất cả dữ liệu xong.");
  } catch (err) {
    console.error("\nLỗi khi migrate:", err);
  } finally {
    await mongoose.disconnect().catch(() => {});
    await pgPool.end().catch(() => {});
    process.exit(0);
  }
}

main();
