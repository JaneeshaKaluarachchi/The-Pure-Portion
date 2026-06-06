# Quick Setup Guide - Staff Finance Management

## Installation Steps

### 1. Install Required Packages

Open your terminal and run:

```bash
cd d:\Pure_Portions\frontend
npm install jspdf jspdf-autotable
```

### 2. Verify Installation

Check that the packages were added to `package.json`:
- jspdf: ^2.5.1
- jspdf-autotable: ^3.8.0

### 3. Start the Application

```bash
# In the frontend directory
npm start
```

### 4. Test the Feature

1. Login to the restaurant dashboard
2. Navigate to Finance Dashboard
3. Click on the **"Total Staff"** card (it should have an arrow → icon)
4. You'll be redirected to the Staff Finance Management page
5. Select a staff member from the list
6. View their finance details
7. Click "Edit Finance Details" to update information
8. View payment history (if available)
9. Click "Download Receipt" on any payment to generate a PDF

## Troubleshooting

### If PDF generation doesn't work:
1. Check browser console for errors
2. Ensure jspdf and jspdf-autotable are installed
3. Clear browser cache and reload

### If navigation doesn't work:
1. Verify the route is added in `App.js`
2. Check that you're logged in with restaurant or admin role
3. Clear browser cache

### If staff data doesn't load:
1. Check network tab for API errors
2. Verify backend is running on port 5000
3. Check authentication token is valid

## Features to Test

✅ Click Total Staff card → navigates to staff finance page
✅ Search staff by name or position
✅ Click staff member → shows details
✅ Edit finance details → saves successfully
✅ Download payment receipt → generates PDF
✅ Mobile responsive design
✅ All staff information displays correctly

## Backend Requirements

Make sure your backend has these endpoints:

1. **GET** `/api/staff` - Get all staff members
2. **PUT** `/api/staff/:staffId` - Update staff finance details
3. **GET** `/api/finance/staff-payments/:staffId` - Get payment history

If these endpoints don't exist yet, you'll need to create them.

## Next Steps

After installation and testing:
1. Customize the PDF receipt design if needed
2. Add more finance fields to the edit form
3. Implement payment history API endpoint if not available
4. Add export functionality for payment records
5. Customize color scheme to match your brand

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all files were created correctly
3. Ensure all imports are correct
4. Check that the backend is running
5. Verify authentication is working

---

**Files Created:**
- `frontend/src/components/StaffFinanceManagement.js`
- `frontend/src/styles/StaffFinanceManagement.css`

**Files Modified:**
- `frontend/src/App.js`
- `frontend/src/components/FinanceDashboard.js`
- `frontend/src/styles/FinanceDashboard.css`
