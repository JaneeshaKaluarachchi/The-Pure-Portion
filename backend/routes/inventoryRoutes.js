const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Inventory = require('../models/Inventory');
const fs = require('fs');
const path = require('path');

const {
  addInventoryItem,
  getAllInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  updateStock,
  getInventoryStats,
  getLowStockAlerts
} = require('../controllers/inventoryController');
const auth = require('../middleware/auth');

// Middleware to check if user is restaurant owner
const checkRestaurantUser = (req, res, next) => {
  next();
};

// Protected routes - require authentication
router.use(auth);
router.use(checkRestaurantUser);


router.use(auth);
router.use(checkRestaurantUser);

router.get('/report/pdf', async (req, res) => {
  try {
    const filterStatus = req.query.status || 'all';
    const items = await Inventory.find();
    const now = new Date();

    const getItemStatus = (item) => {
      if (item.expiryDate && new Date(item.expiryDate) < now) return 'expired';
      else if (item.currentQuantity === 0) return 'out-of-stock';
      else if (item.currentQuantity <= item.minQuantity) return 'low-stock';
      else return 'in-stock';
    };

    let filteredItems = items;
    if (filterStatus !== 'all') {
      filteredItems = items.filter((item) => getItemStatus(item) === filterStatus);
    }

    // Calculate summary stats
    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.currentQuantity || 0), 0);
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.currentQuantity || 0) * (item.costPerUnit || 0), 0);

    // Group by category
    const categories = {};
    filteredItems.forEach((item) => {
      const cat = item.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Inventory_Report_${Date.now()}.pdf"`
    );
    doc.pipe(res);

    // Add logo
    const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 120 });

    // Title
    doc.fontSize(22).font('Helvetica-Bold').text('Inventory Report', 0, 40, { align: 'right' });

    // Date & Time
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, { align: 'right' });
    doc.moveDown(2);

    // Summary Section
    // Summary Section - Centered
doc.moveDown();
doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');

const summaryText = `Total Items: ${totalItems}   |   Total Quantity: ${totalQuantity}   |   Total Value: LKR ${totalValue.toFixed(2)}`;
doc.text(summaryText, { align: 'center' });

doc.moveDown(2);

// Start table below summary
const rowHeight = 15;
let y = doc.y;


    const drawTableHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e'); // header background
      doc.fillColor('white')
        .text('ID', 40, y)
        .text('Name', 100, y)
        .text('Qty', 250, y, { width: 40, align: 'right' })
        .text('Unit', 300, y)
        .text('Min Qty', 350, y, { width: 40, align: 'right' })
        .text('Status', 410, y)
        .text('Value', 470, y, { width: 70, align: 'right' });
      y += rowHeight;
    };

    const drawItemRow = (item, alternate) => {
      const status = getItemStatus(item);
      const value = (item.currentQuantity || 0) * (item.costPerUnit || 0);

      if (alternate) doc.rect(35, y - 3, 520, rowHeight).fill('#f4f4f4');

      let statusColor = 'green';
      if (status === 'low-stock') statusColor = 'orange';
      else if (status === 'out-of-stock') statusColor = 'red';
      else if (status === 'expired') statusColor = 'red';

      doc.fillColor('black').font('Helvetica')
        .text(item.itemId || '', 40, y)
        .text(item.name || '', 100, y)
        .text(item.currentQuantity || 0, 250, y, { width: 40, align: 'right' })
        .text(item.unit || '', 300, y)
        .text(item.minQuantity || 0, 350, y, { width: 40, align: 'right' })
        .fillColor(statusColor)
        .text(status.replace('-', ' '), 410, y)
        .fillColor('black')
        .text(`LKR ${value.toFixed(2)}`, 470, y, { width: 70, align: 'right' });

      y += rowHeight;
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }
    };

    // Iterate through categories
    for (const [cat, catItems] of Object.entries(categories)) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50')
        .text(cat.toUpperCase(), 50, y);
      y += 20;

      drawTableHeader();
      catItems.forEach((item, index) => drawItemRow(item, index % 2 === 0));
      y += 10;
    }

    // Footer with page numbers & total value
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('grey')
        .text(`Page ${i + 1} of ${range.count}  |  Total Inventory Value: LKR ${totalValue.toFixed(2)}`, 50, doc.page.height - 20, { align: 'center' });
    }

    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Failed to generate PDF' });
  }
});

// Inventory CRUD routes
router.post('/', addInventoryItem);
router.get('/', getAllInventoryItems);
router.get('/stats', getInventoryStats);
router.get('/alerts', getLowStockAlerts);
router.get('/:id', getInventoryItemById);
router.put('/:id', updateInventoryItem);
router.patch('/:id/stock', updateStock); 
router.delete('/:id', deleteInventoryItem);

module.exports = router;