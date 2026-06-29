const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const OrderEvent = require('../models/OrderEvent');
const Table = require('../models/Table');
const POSSession = require('../models/POSSession');

const generateOrderNumber = () => {
  return 'ORD-' + Math.floor(10000 + Math.random() * 90000);
};

const createOrder = async (req, res) => {
  const { tableId, items, channel, customerId, actorId, qrSessionId } = req.body;

  try {
    if (channel === 'QR' && qrSessionId) {
      const table = await Table.findById(tableId);
      if (table) {
        const activeIds = await Order.distinct('qrSessionId', {
          table: tableId,
          paymentStatus: { $in: ['Unpaid', 'PendingVerification'] }
        });
        
        // Filter out null/undefined just in case
        const validActiveIds = activeIds.filter(id => id);
        
        if (!validActiveIds.includes(qrSessionId) && validActiveIds.length >= table.seats) {
          return res.status(403).json({ message: 'Table capacity reached' });
        }
      }
    }

    let subtotal = 0;
    let tax = 0;

    items.forEach(item => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      tax += lineTotal * (item.taxRate || 0);
    });

    const total = subtotal + tax;

    // Calculate Estimated Wait Time
    let maxItemCookingTime = 0;
    
    // We need to fetch product details to get cookingTime
    const Product = require('../models/Product');
    for (let i = 0; i < items.length; i++) {
      const prodId = items[i].product || items[i]._id;
      const prod = await Product.findById(prodId);
      if (prod && prod.cookingTime > maxItemCookingTime) {
        maxItemCookingTime = prod.cookingTime;
      }
    }

    // Get active kitchen load
    const activeOrdersCount = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    
    // Estimate: Max cooking time of current items + (2 mins per active order in kitchen)
    const estimatedWaitTime = maxItemCookingTime + (activeOrdersCount * 2);
    const estimatedCompletionTime = new Date(Date.now() + (estimatedWaitTime * 60000));

    const order = await Order.create({
      table: tableId,
      customer: customerId,
      qrSessionId: qrSessionId,
      channel: channel || 'Cashier',
      subtotal,
      tax,
      total,
      estimatedWaitTime,
      estimatedCompletionTime,
      status: 'Pending',
      orderNumber: generateOrderNumber()
    });

    const orderItems = await Promise.all(items.map(async item => {
      // Find product to check if it needs KDS
      const Product = require('../models/Product');
      const prod = await Product.findById(item.product || item._id);
      const requiresKDS = prod && prod.kdsAssigned;

      return await OrderItem.create({
        order: order._id,
        product: item.product || item._id,
        quantity: item.quantity || item.qty || 1,
        unitPrice: item.unitPrice || item.price || 0,
        kdsStatus: requiresKDS ? 'ToCook' : 'NotRequired',
        isAlternativeAccepted: item.isAlternativeAccepted || false,
        waitSaved: item.waitSaved || 0
      });
    }));

    // Update Table Status to Active (Green)
    const table = await Table.findById(tableId);
    if (table && table.status === 'Vacant') {
      table.status = 'Active';
      await table.save();
    }

    // Emit Real-Time Socket Events
    const io = req.app.get('io');
    if (io) {
      io.emit('table_state_changed', { tableId: table._id, status: 'Active' });
      io.emit('order_created', { orderNumber: order.orderNumber, tableId });
      io.emit('kds_refresh_needed');
      io.emit('analytics_updated');
    }

    res.status(201).json(order);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('table');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body; // Pending, Preparing, Ready, Served, Completed
  try {
    const order = await Order.findById(req.params.id).populate('table');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status;
    
    if (status === 'Ready' || status === 'Served') {
      if (!order.actualCompletionTime) {
        order.actualCompletionTime = new Date();
      }
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      if (status === 'Ready') {
        io.emit('kitchen_ready', { orderId: order.orderNumber, tableNumber: order.table?.tableNumber, _id: order._id });
      }
      if (status === 'Served') {
        io.emit('order_served', { orderId: order.orderNumber, _id: order._id, tableNumber: order.table?.tableNumber });
      }
      if (status === 'Completed') {
        if (order.table) {
          const table = await Table.findById(order.table._id);
          table.status = 'Vacant';
          await table.save();
          io.emit('table_state_changed', { tableId: table._id, status: 'Vacant' });
        }
        io.emit('analytics_updated');
      }
      io.emit('kds_refresh_needed');
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, getOrders, updateOrderStatus };
