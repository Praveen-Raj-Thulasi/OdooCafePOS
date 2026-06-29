require('./registerMock');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Order = require('./models/Order');
  const res = await Order.pool.query('SELECT id, data FROM documents WHERE collection=\'order\'');
  
  let updatedCount = 0;
  for (const row of res.rows) {
    const d = row.data;
    if (!d.updatedAt || !d.createdAt || typeof d.updatedAt !== 'string') {
      d.createdAt = d.createdAt || new Date().toISOString();
      d.updatedAt = d.updatedAt || new Date().toISOString();
      await Order.pool.query('UPDATE documents SET data=$1 WHERE id=$2', [JSON.stringify(d), row.id]);
      updatedCount++;
    }
  }
  console.log('Done fixing ' + updatedCount + ' orders!');
  process.exit(0);
});
