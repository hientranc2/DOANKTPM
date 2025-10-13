const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'secret_ecom';

app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect("mongodb+srv://hientran:Hien123123@cluster0.qf33pgy.mongodb.net/Clothify");

// API test
app.get("/", (req, res) => {
  res.send("Express App is running");
});

// Image Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'upload', 'images'));
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Static path
app.use('/images', express.static(path.join(__dirname, 'upload', 'images')));

// Upload endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  console.log(req.file);
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});
const Product = mongoose.model('Product', {
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: Number,
    required: true,
    unique: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
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
  total: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

app.post('/addproduct', async (req, res) => {
  try {
    const { name, image, category, new_price, old_price } = req.body;
    const parsedNewPrice = Number(new_price);
    const parsedOldPrice = Number(old_price);

    if (!name || !image || !category || Number.isNaN(parsedNewPrice) || Number.isNaN(parsedOldPrice)) {
      return res.status(400).json({ success: false, message: 'Missing required product fields.' });
    }

    const lastProduct = await Product.findOne({}).sort({ id: -1 }).lean();
    const id = lastProduct ? lastProduct.id + 1 : 1;

    const product = new Product({
      id,
      name,
      image,
      category,
      new_price: parsedNewPrice,
      old_price: parsedOldPrice,
    });

    await product.save();
    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Error creating product', error);
    res.status(500).json({ success: false, message: 'Unable to create product.' });
  }
});

//Creating API For deleting

app.post('/removeproduct', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.body.id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({
      success: true,
      product: deleted,
    });
  } catch (error) {
    console.error('Error deleting product', error);
    res.status(500).json({ success: false, message: 'Unable to delete product.' });
  }
});

app.put('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, category, new_price, old_price, available } = req.body;
    const parsedNewPrice =
      new_price !== undefined ? Number(new_price) : undefined;
    const parsedOldPrice =
      old_price !== undefined ? Number(old_price) : undefined;

    if (
      (parsedNewPrice !== undefined && Number.isNaN(parsedNewPrice)) ||
      (parsedOldPrice !== undefined && Number.isNaN(parsedOldPrice))
    ) {
      return res.status(400).json({ success: false, message: 'Price must be a number.' });
    }
    const updatePayload = {
      ...(name !== undefined && { name }),
      ...(image !== undefined && { image }),
      ...(category !== undefined && { category }),
      ...(parsedNewPrice !== undefined && { new_price: parsedNewPrice }),
      ...(parsedOldPrice !== undefined && { old_price: parsedOldPrice }),
      ...(available !== undefined && { available }),
    };

    const product = await Product.findOneAndUpdate({ id: Number(id) }, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error updating product', error);
    res.status(500).json({ success: false, message: 'Unable to update product.' });
  }
});

// Creating API for getting
app.get('/allproducts', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ date: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products', error);
    res.status(500).json({ success: false, message: 'Unable to fetch products.' });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Registration error', error);
    res.status(500).json({ success: false, message: 'Unable to register user.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Missing login credentials.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ success: false, message: 'Unable to login.' });
  }
});

const formatOrderResponse = (order) => ({
  orderId: order.orderId,
  status: order.status,
  total: order.total,
  createdAt: order.createdAt,
  customer: order.customer
    ? {
        id: order.customer._id,
        name: order.customer.name,
        email: order.customer.email,
        status: order.customer.status,
      }
    : {
        name: order.customerName,
        email: order.customerEmail,
      },
  items: order.items || [],
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 }).populate('customer', 'name email status');
    res.json({ success: true, orders: orders.map(formatOrderResponse) });
  } catch (error) {
    console.error('Error fetching orders', error);
    res.status(500).json({ success: false, message: 'Unable to fetch orders.' });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, items = [], total = 0, status = 'pending' } = req.body;
    const allowedStatuses = ['pending', 'processing', 'shipped'];
    const normalizedStatus = allowedStatuses.includes(status) ? status : 'pending';
    const lastOrder = await Order.findOne({}).sort({ orderId: -1 }).lean();
    const orderId = lastOrder ? lastOrder.orderId + 1 : 1;

    let customerRef = null;
    let resolvedName = customerName;
    let resolvedEmail = customerEmail;

    if (customerId) {
      const customer = await User.findById(customerId).lean();
      if (customer) {
        customerRef = customer._id;
        resolvedName = customer.name;
        resolvedEmail = customer.email;
      }
    }

    const sanitizedItems = Array.isArray(items)
      ? items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
        }))
      : [];

    const parsedTotal = Number(total) || 0;

    const order = new Order({
      orderId,
      customer: customerRef,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      items: sanitizedItems,
      total: parsedTotal,
      status: normalizedStatus,
    });

    await order.save();
    const populatedOrder = await order.populate('customer', 'name email status');
    res.json({ success: true, order: formatOrderResponse(populatedOrder) });
  } catch (error) {
    console.error('Error creating order', error);
    res.status(500).json({ success: false, message: 'Unable to create order.' });
  }
});

app.patch('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }

    const order = await Order.findOneAndUpdate(
      { orderId: Number(orderId) },
      { status },
      { new: true }
    ).populate('customer', 'name email status');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, order: formatOrderResponse(order) });
  } catch (error) {
    console.error('Error updating order', error);
    res.status(500).json({ success: false, message: 'Unable to update order.' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users', error);
    res.status(500).json({ success: false, message: 'Unable to fetch users.' });
  }
});

app.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid user status.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, projection: '-password' }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user status', error);
    res.status(500).json({ success: false, message: 'Unable to update user status.' });
  }
});







// Start server
app.listen(port, (error) => {
  if (!error) console.log(`Server is running on port ${port}`);
  else console.log("Error occurred, server can't start", error);
});
