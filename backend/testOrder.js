require('dotenv').config();
require('./registerMock');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./models/Order');
  const Table = require('./models/Table');
  const table = await Table.findOne();
  if (!table) { console.log('No tables found'); process.exit(1); }
  
  const qrSessionId = 'test1234';
  
  await Order.create({
    table: table._id,
    channel: 'QR',
    qrSessionId,
    subtotal: 100,
    tax: 10,
    total: 110,
    status: 'Pending',
    orderNumber: 'ORD-TEST12'
  });
  
  const orders = await Order.find({
    table: table._id,
    paymentStatus: { $in: ['Unpaid', 'PendingVerification'] },
    qrSessionId
  });
  
  console.log('Found orders:', orders.length);
  process.exit(0);
});
