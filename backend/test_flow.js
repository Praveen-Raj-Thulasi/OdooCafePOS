require('dotenv').config();
require('./registerMock');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Table = require('./models/Table');
  const Order = require('./models/Order');
  const paymentController = require('./controllers/paymentController');
  
  // Find table 101
  let table = await Table.findOne({ tableNumber: '101' });
  if (!table) {
    table = await Table.create({ tableNumber: '101', seats: 4, status: 'Vacant' });
  }
  
  console.log('Using Table:', table._id, table.tableNumber);
  
  // Clear any existing orders on this table first
  await Order.deleteMany({ table: table._id });
  
  // Create an order
  const order = await Order.create({
    table: table._id,
    channel: 'QR',
    qrSessionId: 'session123',
    subtotal: 100,
    tax: 10,
    total: 110,
    status: 'Pending',
    orderNumber: 'ORD-TEST-' + Math.floor(Math.random() * 1000)
  });
  
  console.log('Created Order:', order.orderNumber, 'total:', order.total);
  
  // Test getTableBill without session ID (like servant portal does)
  const req = {
    params: { tableId: table._id.toString() },
    query: {}
  };
  
  let statusCode = null;
  let responseData = null;
  const res = {
    status: (code) => { statusCode = code; return res; },
    json: (data) => { responseData = data; }
  };
  
  await paymentController.getTableBill(req, res);
  console.log('Bill Response (without qrSessionId):', responseData);
  
  // Test getTableBill with session ID (like customer does)
  const reqWithSession = {
    params: { tableId: table._id.toString() },
    query: { qrSessionId: 'session123' }
  };
  
  let responseDataWithSession = null;
  const resWithSession = {
    status: (code) => { statusCode = code; return resWithSession; },
    json: (data) => { responseDataWithSession = data; }
  };
  
  await paymentController.getTableBill(reqWithSession, resWithSession);
  console.log('Bill Response (with qrSessionId):', responseDataWithSession);
  
  process.exit(0);
});
