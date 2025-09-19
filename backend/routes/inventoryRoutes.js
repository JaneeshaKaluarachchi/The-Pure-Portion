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
const checkRestaurantUser = (req, res, next) => next();

// Protected routes
router.use(auth);
router.use(checkRestaurantUser);

router.get('/report/pdf', async (req, res) => {
  try {
    const filterStatus = req.query.status || 'all';
    const items = await Inventory.find();
    const now = new Date();

    const getItemStatus = (item) => {
      if (item.expiryDate && new Date(item.expiryDate) < now) return 'expired';
      if (item.currentQuantity === 0) return 'out-of-stock';
      if (item.currentQuantity <= item.minQuantity) return 'low-stock';
      return 'in-stock';
    };

    const filteredItems = filterStatus === 'all'
      ? items
      : items.filter(item => getItemStatus(item) === filterStatus);

    const totalItems = filteredItems.length;
    const totalQuantity = filteredItems.reduce((sum, item) => sum + (item.currentQuantity || 0), 0);
    const totalValue = filteredItems.reduce((sum, item) => sum + (item.currentQuantity || 0) * (item.costPerUnit || 0), 0);

    // Group by category
    const categories = {};
    filteredItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Inventory_Report_${Date.now()}.pdf"`);
    doc.pipe(res);

    // Logo
    const logoPath = path.join('D:', 'Pure_Portions', 'frontend', 'src', 'styles', 'images', '1.png');
    if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 120 });

    // Title & date
    doc.fontSize(22).font('Helvetica-Bold').text('Inventory Report', 0, 40, { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, { align: 'right' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`Total Items: ${totalItems}   |   Total Quantity: ${totalQuantity.toFixed(2)}   |   Total Value: LKR ${totalValue.toFixed(2)}`, { align: 'center' });
    doc.moveDown(2);

    let y = doc.y;
    const rowHeight = 18;
    const pageBottom = doc.page.height - 50;

    const drawHeader = () => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
      doc.rect(35, y - 3, 520, rowHeight).fill('#34495e');
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

    const addPageIfNeeded = (rowHeightNeeded) => {
      if (y + rowHeightNeeded > pageBottom) {
        doc.addPage();
        y = 50;
        drawHeader();
      }
    };

    const drawItemRow = (item, alternate = false) => {
      const status = getItemStatus(item);
      const value = (item.currentQuantity || 0) * (item.costPerUnit || 0);

      const rowTextHeight = doc.heightOfString(item.name || '', { width: 150 }) + 4;
      const rowActualHeight = Math.max(rowHeight, rowTextHeight);

      addPageIfNeeded(rowActualHeight);

      if (alternate) doc.rect(35, y - 3, 520, rowActualHeight).fill('#f4f4f4');

      let statusColor = 'green';
      if (status === 'low-stock') statusColor = 'orange';
      else if (status === 'out-of-stock' || status === 'expired') statusColor = 'red';

      doc.fillColor('black').font('Helvetica')
        .text(item.itemId || '', 40, y)
        .text(item.name || '', 100, y, { width: 150 })
        .text((item.currentQuantity || 0).toFixed(2), 250, y, { width: 40, align: 'right' })
        .text(item.unit || '', 300, y)
        .text((item.minQuantity || 0).toFixed(2), 350, y, { width: 40, align: 'right' })
        .fillColor(statusColor)
        .text(status.replace('-', ' '), 410, y)
        .fillColor('black')
        .text(`LKR ${value.toFixed(2)}`, 470, y, { width: 70, align: 'right' });

      y += rowActualHeight;
    };

    // Iterate categories
    for (const [cat, catItems] of Object.entries(categories)) {
      addPageIfNeeded(40);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2c3e50').text(cat.toUpperCase(), 50, y);
      y += 20;
      drawHeader();
      catItems.forEach((item, index) => drawItemRow(item, index % 2 === 0));
      y += 10;
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
