require('dotenv').config();
require('./registerMock');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Table = require('./models/Table');
  const Order = require('./models/Order');
  const OrderItem = require('./models/OrderItem');
  
  const tables = await Table.find({});
  console.log('--- TABLES ---');
  tables.forEach(t => {
    console.log(`Table ${t.tableNumber}: status=${t.status}, activeCustomers=${t.activeCustomers}, id=${t._id}`);
  });
  
  const orders = await Order.find({});
  console.log('\n--- ORDERS ---');
  for (const o of orders) {
    const items = await OrderItem.find({ order: o._id }).populate('product', 'name');
    const itemsStr = items.map(i => `${i.quantity}x ${i.product ? i.product.name : 'Unknown'} (price=${i.unitPrice})`).join(', ');
    console.log(`Order ${o.orderNumber}: table=${o.table}, status=${o.status}, paymentStatus=${o.paymentStatus}, total=${o.total}, qrSessionId=${o.qrSessionId}, items=[${itemsStr}]`);
  }
  
  process.exit(0);
});
