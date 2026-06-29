require('dotenv').config();
require('./registerMock');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Table = require('./models/Table');
  const paymentController = require('./controllers/paymentController');
  
  const tables = await Table.find({});
  console.log(`Found ${tables.length} tables`);
  
  for (const table of tables) {
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
    
    try {
      await paymentController.getTableBill(req, res);
      if (statusCode === 500) {
        console.log(`Table ${table.tableNumber} (${table._id}): 500 Error:`, responseData);
      } else {
        console.log(`Table ${table.tableNumber} (${table._id}): ${statusCode || 200}, Orders: ${responseData.orders ? responseData.orders.length : 0}`);
      }
    } catch (err) {
      console.log(`Table ${table.tableNumber} (${table._id}): CRASH`, err.message);
    }
  }
  
  process.exit(0);
});
