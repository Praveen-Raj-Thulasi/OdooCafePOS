const Order = require('../models/Order');
const Table = require('../models/Table');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');

const Promotion = require('../models/Promotion');
const nodemailer = require('nodemailer');

// @desc    Get current open bill for a table
// @route   GET /api/payments/bill/:tableId
// @access  Public (QR) or Private (Staff)
const getTableBill = async (req, res) => {
  try {
    const tableId = req.params.tableId;
    const qrSessionId = req.query.qrSessionId;
    
    // Find all unpaid orders for this table
    let query = { table: tableId, paymentStatus: { $in: ['Unpaid', 'PendingVerification'] } };
    if (qrSessionId) query.qrSessionId = qrSessionId;
    
    const orders = await Order.find(query);

    if (!orders || orders.length === 0) {
      return res.status(200).json({ 
        total: 0, 
        subtotal: 0, 
        tax: 0, 
        orders: [],
        automatedDiscount: 0,
        appliedPromotion: null
      });
    }

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ order: order._id }).populate('product', 'name');
      return {
        ...order.toObject(),
        items
      };
    }));

    let grandTotal = 0;
    let totalSubtotal = 0;
    let totalTax = 0;
    const productQuantities = {};

    ordersWithItems.forEach(order => {
      grandTotal += order.total;
      totalSubtotal += order.subtotal;
      totalTax += order.tax;
      
      order.items.forEach(item => {
        if (item.product && item.product._id) {
          const pId = item.product._id.toString();
          productQuantities[pId] = (productQuantities[pId] || 0) + item.quantity;
        }
      });
    });

    // Evaluate promotions
    const activePromos = await Promotion.find({ isActive: true });
    let bestPromo = null;
    let maxAutoDiscount = 0;

    activePromos.forEach(promo => {
      let qualifies = false;
      if (promo.type === 'Order') {
        if (grandTotal >= promo.minOrderAmount) qualifies = true;
      } else if (promo.type === 'Product' && promo.targetProduct) {
        const qty = productQuantities[promo.targetProduct.toString()] || 0;
        if (qty >= promo.minQuantity) qualifies = true;
      }

      if (qualifies) {
        let discount = 0;
        if (promo.discountType === 'percent') {
          discount = (grandTotal * promo.discountValue) / 100;
        } else {
          discount = promo.discountValue;
        }
        
        discount = Math.min(discount, grandTotal);

        if (discount > maxAutoDiscount) {
          maxAutoDiscount = discount;
          bestPromo = promo;
        }
      }
    });

    let automatedDiscount = 0;
    let appliedPromotion = null;

    if (bestPromo) {
      automatedDiscount = maxAutoDiscount;
      appliedPromotion = bestPromo.name;
      grandTotal = Math.max(0, grandTotal - automatedDiscount);
    }

    res.json({
      total: grandTotal,
      subtotal: totalSubtotal,
      tax: totalTax,
      orders: ordersWithItems,
      automatedDiscount,
      appliedPromotion,
      prePromoTotal: grandTotal + automatedDiscount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Settle the bill for a table
// @route   POST /api/payments/settle
// @access  Public (QR Online) or Private (Staff)
const settleBill = async (req, res) => {
  try {
    const { tableId, paymentMethod, appliedDiscount, couponCode, qrSessionId } = req.body;

    if (!tableId || !paymentMethod) {
      return res.status(400).json({ message: 'Table ID and Payment Method are required' });
    }

    // Find all unpaid or pending orders for this table
    let query = { table: tableId, paymentStatus: { $in: ['Unpaid', 'PendingVerification'] } };
    if (qrSessionId) {
      if (qrSessionId === 'Staff') {
        query.qrSessionId = { $exists: false };
      } else {
        query.qrSessionId = qrSessionId;
      }
    }
    
    const orders = await Order.find(query);

    if (!orders || orders.length === 0) {
      return res.status(400).json({ message: 'No unpaid orders found for this table' });
    }

    // Evaluate automated promotions to deduct them securely
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const items = await OrderItem.find({ order: order._id }).populate('product', 'name');
      return { ...order.toObject(), items };
    }));

    let grandTotal = 0;
    const productQuantities = {};

    ordersWithItems.forEach(order => {
      grandTotal += order.total;
      order.items.forEach(item => {
        if (item.product && item.product._id) {
          const pId = item.product._id.toString();
          productQuantities[pId] = (productQuantities[pId] || 0) + item.quantity;
        }
      });
    });

    const activePromos = await Promotion.find({ isActive: true });
    let maxAutoDiscount = 0;

    activePromos.forEach(promo => {
      let qualifies = false;
      if (promo.type === 'Order' && grandTotal >= promo.minOrderAmount) qualifies = true;
      else if (promo.type === 'Product' && promo.targetProduct) {
        const qty = productQuantities[promo.targetProduct.toString()] || 0;
        if (qty >= promo.minQuantity) qualifies = true;
      }

      if (qualifies) {
        let discount = promo.discountType === 'percent' ? (grandTotal * promo.discountValue) / 100 : promo.discountValue;
        discount = Math.min(discount, grandTotal);
        if (discount > maxAutoDiscount) maxAutoDiscount = discount;
      }
    });

    // Total discount to deduct = Automated Discount + Manual Coupon Discount
    const totalDiscountToApply = maxAutoDiscount + (appliedDiscount || 0);

    let totalUnpaid = orders.reduce((sum, o) => sum + o.total, 0);
    for (const order of orders) {
      if (totalDiscountToApply > 0 && totalUnpaid > 0) {
        const proportion = order.total / totalUnpaid;
        order.discount = totalDiscountToApply * proportion;
        order.total = Math.max(0, order.total - order.discount);
        if (couponCode) order.couponCode = couponCode;
      }
      
      order.paymentStatus = 'Paid';
      order.paymentMethod = paymentMethod;
      order.status = 'Completed';
      await order.save();
    }

    // Update Table Status to Vacant if no other unpaid orders remain
    const io = req.app.get('io');
    const table = await Table.findById(tableId);
    if (table) {
      const remainingUnpaid = await Order.countDocuments({ table: tableId, paymentStatus: { $in: ['Unpaid', 'PendingVerification'] } });
      if (remainingUnpaid === 0) {
        table.status = 'Vacant';
        await table.save();
        if (io) io.emit('table_state_changed', { tableId: table._id, status: 'Vacant' });
      }
    }

    // Emit socket events
    if (io) {
      io.emit('payment_verified', { tableId: table._id });
      io.emit('analytics_updated');
      io.emit('kds_refresh_needed');
    }

    res.json({ message: 'Bill settled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Customer claims they have paid via UPI
// @route   POST /api/payments/claim
const claimPayment = async (req, res) => {
  try {
    const { tableId, qrSessionId } = req.body;
    
    let query = { table: tableId, paymentStatus: 'Unpaid' };
    if (qrSessionId) query.qrSessionId = qrSessionId;

    const orders = await Order.find(query);

    if (!orders || orders.length === 0) {
      return res.status(400).json({ message: 'No unpaid orders found' });
    }

    let totalClaimed = 0;
    for (const order of orders) {
      order.paymentStatus = 'PendingVerification';
      totalClaimed += order.total;
      await order.save();
    }

    const table = await Table.findById(tableId);

    const io = req.app.get('io');
    if (io) {
      io.emit('payment_claim_raised', { 
        tableId, 
        tableNumber: table.tableNumber,
        amount: totalClaimed 
      });
    }

    res.json({ message: 'Payment claim submitted for verification' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cashier rejects the payment claim
// @route   POST /api/payments/reject
const rejectPayment = async (req, res) => {
  try {
    const { tableId } = req.body;

    const orders = await Order.find({ 
      table: tableId, 
      paymentStatus: 'PendingVerification' 
    });

    if (!orders || orders.length === 0) {
      return res.status(400).json({ message: 'No pending verifications found' });
    }

    for (const order of orders) {
      order.paymentStatus = 'Unpaid';
      await order.save();
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('payment_rejected', { tableId });
    }

    res.json({ message: 'Payment claim rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tables with pending verifications
// @route   GET /api/payments/pending
// @access  Private (Cashier/Admin)
const getPendingVerifications = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: 'PendingVerification' }).populate('table', 'tableNumber');
    
    const verifications = orders.map(order => ({
      tableId: order.table._id,
      tableNumber: order.table.tableNumber,
      amount: order.total
    }));

    // Remove duplicates if multiple orders exist for the same table
    const uniqueVerifications = [];
    const seen = new Set();
    
    verifications.forEach(v => {
      if (!seen.has(v.tableId.toString())) {
        seen.add(v.tableId.toString());
        // Calculate total amount for all pending orders for this table
        v.amount = verifications
          .filter(v2 => v2.tableId.toString() === v.tableId.toString())
          .reduce((sum, v2) => sum + v2.amount, 0);
        uniqueVerifications.push(v);
      }
    });

    res.json(uniqueVerifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send receipt via email
// @route   POST /api/payments/receipt/email
const sendReceiptEmail = async (req, res) => {
  try {
    const { email, paymentData } = req.body;
    if (!email || !paymentData) {
      return res.status(400).json({ message: 'Email and payment data are required' });
    }

    let transporter;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    let itemsHtml = '';
    paymentData.orders.forEach(order => {
      order.items.forEach(item => {
        itemsHtml += `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product ? item.product.name : 'Item'} x${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₹${(item.unitPrice * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      });
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="text-align: center; color: #18181b;">Cafinity</h1>
        <h3 style="text-align: center; color: #71717a;">Payment Receipt</h3>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${paymentData.subtotal.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Tax (10%):</strong> ₹${paymentData.tax.toFixed(2)}</p>
          ${paymentData.automatedDiscount > 0 ? `<p style="margin: 5px 0; color: #10b981;"><strong>Discount:</strong> -₹${paymentData.automatedDiscount.toFixed(2)}</p>` : ''}
          <h2 style="color: #18181b; margin-top: 10px;"><strong>Total Paid:</strong> ₹${paymentData.total.toFixed(2)}</h2>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center; color: #71717a; font-size: 14px;">Thank you for dining with us!</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"Cafinity" <receipts@cafinity.com>',
      to: email,
      subject: "Your Receipt from Cafinity",
      html: htmlContent,
    });

    let previewUrl = null;
    if (!process.env.EMAIL_USER) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("Email preview URL: %s", previewUrl);
    }

    res.status(200).json({ message: 'Receipt sent successfully', previewUrl });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};

module.exports = { getTableBill, settleBill, claimPayment, rejectPayment, getPendingVerifications, sendReceiptEmail };
