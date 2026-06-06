# Dashboard Debug Guide 🔍

## Issue Fixed: Dashboard Tiles Showing 0 Instead of Actual Numbers

### What Was Wrong:
1. **Using `Promise.all()` instead of `Promise.allSettled()`** - If any API call failed, all data would be lost
2. **Insufficient error handling** - No way to see what was failing
3. **No debug logging** - Couldn't track API responses
4. **Absolute URLs instead of proxy** - Not utilizing the configured proxy

### What Was Fixed:

#### 1. **Better Promise Handling**
```javascript
// OLD (would fail if any request failed)
const [staffRes, inventoryRes, ...] = await Promise.all([...]);

// NEW (handles individual failures gracefully)
const [staffRes, inventoryRes, ...] = await Promise.allSettled([...]);
```

#### 2. **Comprehensive Error Handling**
- Added token validation check
- Individual error handling for each API call
- Graceful fallbacks to empty arrays
- Error state management with user-friendly messages

#### 3. **Debug Logging**
Console logs added at every step:
- ✅ Token existence check
- ✅ API request status for each endpoint
- ✅ Data count for each successful request
- ✅ Error messages for failed requests
- ✅ Final stats object

#### 4. **Using Proxy Configuration**
Changed from absolute URLs to relative URLs:
```javascript
// OLD
axios.get('http://localhost:5000/api/staff', config)

// NEW (uses proxy from package.json)
axios.get('/api/staff', config)
```

#### 5. **Enhanced UI**
- Error banner with retry button
- Loading states
- Better visual feedback
- Proper data display

---

## How to Debug:

### Step 1: Check Backend Server
```powershell
cd backend
npm start
```
Should see: `✅🎉 Connected to MongoDB successfully!`

### Step 2: Check Frontend
```powershell
cd frontend
npm start
```
Opens on `http://localhost:3000`

### Step 3: Open Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for these log messages:

**On Dashboard Load:**
```
🔄 Fetching dashboard stats...
Token exists: true
📊 API Responses:
Staff: fulfilled 5 items
Inventory: fulfilled 23 items
Recipes: fulfilled 12 items
Leftovers: fulfilled 8 items
Finance: fulfilled 45 items
✅ Final Dashboard Stats: {staffCount: 5, inventoryCount: 23, ...}
```

**If Token Missing:**
```
❌ No token found in localStorage
```
**Solution:** Log out and log back in

**If Backend Not Running:**
```
❌ Error fetching dashboard stats: Network Error
All API requests failed
```
**Solution:** Start backend server

**If Authentication Failed:**
```
Staff: rejected 401 Unauthorized
```
**Solution:** Check token validity, re-login

### Step 4: Check Network Tab
1. Developer Tools > Network tab
2. Refresh dashboard
3. Look for these requests:
   - `/api/staff` - Status 200
   - `/api/inventory` - Status 200
   - `/api/recipes` - Status 200
   - `/api/leftovers` - Status 200
   - `/api/finance` - Status 200

### Step 5: Verify Data in Backend
Test each endpoint directly:

```javascript
// In browser console, with backend running
const token = localStorage.getItem('token');

// Test staff endpoint
fetch('/api/staff', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Staff:', data.length));

// Test inventory endpoint
fetch('/api/inventory', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => console.log('Inventory:', data.length));
```

---

## Common Issues & Solutions:

### Issue 1: All Tiles Show 0
**Cause:** Backend not running or not connected to MongoDB  
**Solution:** 
```powershell
cd backend
npm start
```

### Issue 2: Error Banner Shows "Authentication token not found"
**Cause:** User not logged in or token expired  
**Solution:** Log out and log back in

### Issue 3: Error Banner Shows "All API requests failed"
**Cause:** Backend server not accessible  
**Solution:** 
- Check backend is running on port 5000
- Check MongoDB connection
- Check CORS is enabled in backend

### Issue 4: Some Tiles Show Data, Others Show 0
**Cause:** Specific endpoints failing  
**Solution:** 
- Check console for which endpoint is failing
- Verify that collection exists in MongoDB
- Check route is properly defined in backend

### Issue 5: Data Doesn't Refresh
**Cause:** Cache or state not updating  
**Solution:** 
- Click the "🔄 Refresh Data" button
- Hard refresh browser (Ctrl+F5)
- Clear browser cache

---

## Expected Console Output (Success):

```
🔄 Fetching dashboard stats...
Token exists: true
📊 API Responses:
Staff: fulfilled 5 items
Inventory: fulfilled 23 items
Recipes: fulfilled 12 items
Leftovers: fulfilled 8 items
Finance: fulfilled 45 items
✅ Final Dashboard Stats: {
  staffCount: 5,
  inventoryCount: 23,
  wasteReduced: "12.50",
  monthlySavings: "15000.00",
  totalRecipes: 12,
  activePortionPlans: 0,
  totalLeftovers: 8,
  todayAttendance: 5
}
```

---

## API Endpoints Used:

| Endpoint | Method | Auth | Returns |
|----------|--------|------|---------|
| `/api/staff` | GET | ✅ | Array of staff members |
| `/api/inventory` | GET | ✅ | Array of inventory items |
| `/api/recipes` | GET | ✅ | Array of recipes |
| `/api/leftovers` | GET | ✅ | Array of leftover items |
| `/api/finance` | GET | ✅ | Array of finance records |

All endpoints require Bearer token authentication.

---

## Quick Test Commands:

### Test Backend Connection:
```powershell
# From project root
cd backend
npm start
# Should see MongoDB connection success
```

### Test Frontend:
```powershell
# From project root
cd frontend
npm start
# Should open browser on localhost:3000
```

### Test API Directly:
```powershell
# Get token from browser localStorage first
curl http://localhost:5000/api/staff -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Files Modified:

1. ✅ `frontend/src/pages/RestaurantDashboard.js`
   - Added `Promise.allSettled()` for better error handling
   - Added comprehensive console logging
   - Added error state management
   - Changed to relative URLs (proxy)
   - Added error display UI

2. ✅ `frontend/src/styles/Dashboard.css`
   - Added error banner styles
   - Added shake animation
   - Added retry button styles

---

## Contact Developer If:
- All steps above completed
- Console shows no errors
- Backend shows MongoDB connected
- Network tab shows 200 responses
- **But dashboard still shows 0**

Then share:
1. Console output (full)
2. Network tab screenshot
3. Backend terminal output

---

Happy Debugging! 🎉
