require('./registerMock');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const tableRoutes = require('./routes/tableRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kdsRoutes = require('./routes/kdsRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const couponRoutes = require('./routes/couponRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // For hackathon purposes
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api', tableRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/sessions', sessionRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Cafinity POS API is running...');
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });

  // CFD Relays
  socket.on('cfd_update', (data) => {
    socket.broadcast.emit('cfd_update', data);
  });
  
  socket.on('cfd_payment', (data) => {
    socket.broadcast.emit('cfd_payment', data);
  });
  
  socket.on('cfd_complete', (data) => {
    socket.broadcast.emit('cfd_complete', data);
  });
});

// Make io accessible to routes if needed
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
