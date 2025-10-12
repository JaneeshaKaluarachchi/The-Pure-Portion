# 🔧 DASHBOARD TROUBLESHOOTING GUIDE

## Issue: Dashboard tiles showing 0 instead of actual numbers

---

## 🚀 IMMEDIATE TESTING STEPS:

### Step 1: Start Backend Server
```powershell
cd backend
npm start
```
**Expected output:**
```
Server running on port 5000
✅🎉 Connected to MongoDB successfully!
```

### Step 2: Start Frontend
```powershell
cd frontend
npm start
```
**Opens browser at:** `http://localhost:3000`

### Step 3: Log In
- Log in to your restaurant account
- Make sure you see the dashboard

### Step 4: Open Browser Console
1. Press **F12** or **Ctrl+Shift+I**
2. Click on **Console** tab
3. Look for these messages:

#### ✅ **SUCCESSFUL OUTPUT:**
```
🎯 useEffect triggered, activeSection: dashboard
✅ Active section is dashboard, fetching stats...
🔍 Checking token...
Token: eyJhbGciOiJIUzI1NiIs...
🔄 Starting API calls...
Testing /api/staff endpoint...
✅ Staff test successful: 5 items
📊 Detailed API Responses:
Staff: {status: 'fulfilled', data: 5, error: null}
Inventory: {status: 'fulfilled', data: 23, error: null}
Recipes: {status: 'fulfilled', data: 12, error: null}
...
✅ ===== FINAL DASHBOARD STATS =====
Staff Count: 5
Inventory Count: 23
...
✅ Dashboard stats set successfully!
✅ Loading set to false
```

#### ❌ **ERROR SCENARIOS:**

**If you see:**
```
❌ No token found in localStorage
```
**Solution:** Log out and log back in

**If you see:**
```
Staff API Error: 401 Unauthorized
```
**Solution:** Token expired, log in again

**If you see:**
```
Staff API Error: Network Error
```
**Solution:** Backend not running, start it with `npm start` in backend folder

**If you see:**
```
Staff API Error: 500 Internal Server Error
```
**Solution:** Check backend console for MongoDB connection errors

---

## 🧪 USE THE API TEST TOOL

I've created a special test tool for you!

### How to use:

1. **Open the test tool:**
   - Open file: `D:\Pure_Portions\API_TEST_TOOL.html` in your browser
   - Or double-click the file

2. **Get your token:**
   - Go to your app (http://localhost:3000)
   - Press F12 → Console
   - Type: `localStorage.getItem('token')`
   - Copy the token (without quotes)

3. **Test your APIs:**
   - Paste token in the test tool
   - Click "Test All Endpoints"
   - See if backend is responding with data

4. **Check results:**
   - All endpoints should show green ✅
   - You should see data counts
   - If red ❌, that endpoint has an issue

---

## 📊 CHECK THE DEBUG INFO BOX

On your dashboard, you'll now see a **gray debug box** at the top showing:
- Loading state
- Error messages
- Current state values
- Staff count, inventory count, etc.

**What to look for:**
- If "Loading: YES" never changes to "NO" → API call stuck
- If "Staff Count (state): 0" but console shows data → State update issue
- If "Error: ..." shows → That's your problem

---

## 🔍 DETAILED DEBUGGING CHECKLIST

### ✅ Backend Checklist:
- [ ] Backend server is running on port 5000
- [ ] MongoDB is connected (see "Connected to MongoDB" message)
- [ ] No errors in backend console
- [ ] CORS is enabled in backend (check app.js)
- [ ] All route files exist in backend/routes/
- [ ] All collections exist in MongoDB

### ✅ Frontend Checklist:
- [ ] Frontend is running on port 3000
- [ ] User is logged in
- [ ] Token exists in localStorage
- [ ] No console errors in browser
- [ ] Proxy is configured in package.json
- [ ] No network errors in Network tab

### ✅ Data Checklist:
- [ ] Staff collection has data in MongoDB
- [ ] Inventory collection has data
- [ ] Recipes collection has data
- [ ] Leftovers collection has data
- [ ] Finance collection has data

---

## 🛠️ ADVANCED DEBUGGING

### Test API Directly in Console:

Open browser console on your app and run:

```javascript
// Get your token
const token = localStorage.getItem('token');
console.log('Token:', token);

// Test staff endpoint
fetch('/api/staff', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Staff data:', data.length, 'items');
  console.log('First item:', data[0]);
})
.catch(err => console.error('❌ Error:', err));

// Test inventory endpoint
fetch('/api/inventory', {
  headers: { Authorization: `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Inventory data:', data.length, 'items');
})
.catch(err => console.error('❌ Error:', err));
```

### Check Network Tab:

1. Press F12 → Network tab
2. Refresh the dashboard
3. Look for these requests:
   - `/api/staff` → Should be **200 OK**
   - `/api/inventory` → Should be **200 OK**
   - `/api/recipes` → Should be **200 OK**
   - `/api/leftovers` → Should be **200 OK**
   - `/api/finance` → Should be **200 OK**

4. Click on any request to see:
   - **Headers** → Check Authorization header has token
   - **Response** → Check actual data returned
   - **Preview** → See formatted data

---

## 🎯 COMMON SOLUTIONS

### Solution 1: Restart Everything
```powershell
# Stop both servers (Ctrl+C)
# Then restart:

# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Solution 2: Clear Cache
```javascript
// In browser console
localStorage.clear();
// Then log in again
```

### Solution 3: Check MongoDB
```powershell
# Make sure MongoDB is running
# Check your .env file has correct MONGODB_URI
```

### Solution 4: Reinstall Dependencies
```powershell
# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd frontend
rm -rf node_modules
npm install
```

---

## 📞 WHAT TO SHARE IF STILL NOT WORKING

If dashboard still shows 0 after all above steps, share:

1. **Console Output** (full text from browser console)
2. **Debug Box Screenshot** (the gray box on dashboard)
3. **Network Tab Screenshot** (showing all API calls)
4. **Backend Console Output** (from terminal running backend)
5. **API Test Tool Results** (from API_TEST_TOOL.html)

---

## 💡 EXPECTED BEHAVIOR

When working correctly:

1. **Dashboard loads** → Console shows "🔄 Starting API calls..."
2. **APIs called** → Console shows "✅ Staff test successful: X items"
3. **Data received** → Console shows "📊 Detailed API Responses" with counts
4. **State updated** → Console shows "✅ Dashboard stats set successfully!"
5. **UI updates** → Tiles show actual numbers
6. **Debug box** → Shows all counts correctly

---

## 🎉 SUCCESS INDICATORS

✅ No errors in console
✅ All API responses show "fulfilled"
✅ Debug box shows correct counts
✅ Dashboard tiles show actual numbers (not 0)
✅ Refresh button works
✅ No red error banner

---

## ⚡ QUICK TEST COMMAND

Run this in browser console:
```javascript
// Quick test
console.clear();
const token = localStorage.getItem('token');
Promise.all([
  fetch('/api/staff', {headers: {Authorization: `Bearer ${token}`}}).then(r => r.json()),
  fetch('/api/inventory', {headers: {Authorization: `Bearer ${token}`}}).then(r => r.json()),
  fetch('/api/recipes', {headers: {Authorization: `Bearer ${token}`}}).then(r => r.json()),
]).then(([staff, inventory, recipes]) => {
  console.log('✅ RESULTS:');
  console.log('Staff:', staff.length);
  console.log('Inventory:', inventory.length);
  console.log('Recipes:', recipes.length);
}).catch(err => console.error('❌ FAILED:', err));
```

This will immediately tell you if the APIs are working!

---

Good luck! 🍀
