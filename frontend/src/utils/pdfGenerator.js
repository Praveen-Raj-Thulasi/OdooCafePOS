import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (billData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Thermal receipt printer format
  });

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Cafinity', 40, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Cafe Street, Tech City', 40, 22, { align: 'center' });
  doc.text('Phone: +1 234 567 8900', 40, 27, { align: 'center' });
  
  // Divider
  doc.setLineWidth(0.5);
  doc.line(5, 32, 75, 32);

  // Meta Info
  doc.setFontSize(9);
  doc.text(`Date: ${new Date().toLocaleString()}`, 5, 38);
  
  // Combine all items from all orders in the bill
  const allItems = [];
  if (billData && billData.orders) {
    billData.orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          allItems.push({
            name: item.product?.name || 'Unknown Item',
            qty: item.quantity,
            price: item.unitPrice,
            total: item.quantity * item.unitPrice
          });
        });
      }
    });
  }

  // Table
  autoTable(doc, {
    startY: 45,
    margin: { left: 5, right: 5 },
    theme: 'plain',
    head: [['Item', 'Qty', 'Amt']],
    body: allItems.map(item => [
      item.name, 
      item.qty.toString(), 
      item.total.toFixed(2)
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 1,
      overflow: 'linebreak'
    },
    headStyles: {
      fontStyle: 'bold',
      lineWidth: { bottom: 0.5 },
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 20, halign: 'right' }
    }
  });

  const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 55) + 10;
  
  // Divider
  doc.line(5, finalY, 75, finalY);

  // Totals
  doc.setFontSize(10);
  doc.text('Subtotal:', 5, finalY + 8);
  doc.text(billData.subtotal.toFixed(2), 75, finalY + 8, { align: 'right' });
  
  doc.text('Tax (10%):', 5, finalY + 14);
  doc.text(billData.tax.toFixed(2), 75, finalY + 14, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 5, finalY + 22);
  doc.text(billData.total.toFixed(2), 75, finalY + 22, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for dining with us!', 40, finalY + 35, { align: 'center' });
  doc.text('Please come again.', 40, finalY + 40, { align: 'center' });

  // Download PDF
  doc.save(`Receipt_Table_${new Date().getTime()}.pdf`);
};
