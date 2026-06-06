# Portion Plan Integration with Finance Dashboard

## 🎯 Feature Overview

Executed portion plans can now be added directly to Finance Dashboard records with automated profit calculations!

When you create and execute a portion plan in the Portion Calculator, it will automatically appear in the Finance Dashboard where you can:
- ✅ View all executed portion plans
- ✅ Select quick profit margins (40%, 60%, 80%)
- ✅ Set custom profit percentages
- ✅ Auto-calculate selling price
- ✅ Add to finance records with full details

---

## ✅ Changes Made

### **1. Backend - Already Supported**

The portion plan system already tracks:
- `totalCost` - Total cost of all ingredients
- `costPerPerson` - Cost per person
- `isInventoryDeducted` - Execution status
- All plan details (name, recipes, people count, etc.)

**No backend changes needed!** ✅

---

### **2. Frontend - Finance Dashboard Integration**

#### A. New State Variables (`FinanceDashboard.js`):

```javascript
// Portion Plan States
const [showPortionPlanModal, setShowPortionPlanModal] = useState(false);
const [executedPortionPlans, setExecutedPortionPlans] = useState([]);
const [selectedPlan, setSelectedPlan] = useState(null);
const [profitMargin, setProfitMargin] = useState(40);
const [customProfit, setCustomProfit] = useState("");
```

---

#### B. Fetch Executed Portion Plans:

```javascript
const fetchExecutedPortionPlans = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/portions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Filter only executed plans
    const executed = (res.data.plans || []).filter(plan => plan.isInventoryDeducted);
    setExecutedPortionPlans(executed);
  } catch (err) {
    console.error("Error fetching portion plans:", err);
  }
};
```

**Called in `useEffect` on component mount.**

---

#### C. Profit Calculation Functions:

```javascript
const calculateSellingPrice = () => {
  if (!selectedPlan) return 0;
  const margin = customProfit !== "" ? parseFloat(customProfit) : profitMargin;
  const cost = selectedPlan.totalCost || 0;
  return cost + (cost * margin / 100);
};

const calculateProfit = () => {
  if (!selectedPlan) return 0;
  const margin = customProfit !== "" ? parseFloat(customProfit) : profitMargin;
  const cost = selectedPlan.totalCost || 0;
  return cost * margin / 100;
};
```

**Formula:**
- **Profit** = Cost × (Margin % ÷ 100)
- **Selling Price** = Cost + Profit

---

#### D. Add Portion Plan to Record:

```javascript
const addPortionPlanToRecord = () => {
  if (!selectedPlan) return;

  const sellingPrice = calculateSellingPrice();
  const profit = calculateProfit();

  setRecordForm({
    type: "income",
    category: "sales",
    amount: sellingPrice.toFixed(2),
    description: `${selectedPlan.name} - ${selectedPlan.peopleCount} people (Cost: Rs ${selectedPlan.totalCost.toFixed(2)}, Profit: Rs ${profit.toFixed(2)} @ ${customProfit !== "" ? customProfit : profitMargin}%)`,
    staffId: "",
  });

  // Close modal and reset
  setShowPortionPlanModal(false);
  setSelectedPlan(null);
  setProfitMargin(40);
  setCustomProfit("");
};
```

**Auto-fills the finance record form with:**
- Type: Income
- Category: Sales
- Amount: Calculated selling price
- Description: Full details including cost, profit, and margin

---

### **3. UI Components**

#### A. "Add from Portion Plan" Button:

Located in the **Add Finance Record** section header:

```jsx
{executedPortionPlans.length > 0 && (
  <button
    type="button"
    className="portion-plan-btn"
    onClick={() => setShowPortionPlanModal(true)}
  >
    <span className="btn-icon">🍽️</span>
    <span className="btn-text">Add from Portion Plan</span>
  </button>
)}
```

**Only shows if there are executed portion plans.**

---

#### B. Portion Plan Selection Modal:

**Features:**
1. **Plan List** - Shows all executed portion plans
2. **Plan Cards** - Display name, ID, people count, meals, cost, date
3. **Selection** - Click to select a plan
4. **Profit Calculator** - Appears when plan is selected

---

#### C. Profit Calculator Section:

```
┌────────────────────────────────────┐
│ 💵 Profit Calculation              │
├────────────────────────────────────┤
│ Quick Margin Buttons:              │
│  [  40%  ] [  60%  ] [  80%  ]    │
│                                    │
│ Custom Profit %:                   │
│  [Enter custom %]                  │
│                                    │
│ ───────────────────────────────    │
│ Cost Price:       Rs 15,000.00     │
│ Profit (40%):    +Rs 6,000.00      │
│ Selling Price:    Rs 21,000.00     │
└────────────────────────────────────┘
```

---

### **4. CSS Styling** (`FinanceDashboard.css`)

**Added 300+ lines of styles:**

#### Button Styles:
- `.portion-plan-btn` - Orange gradient button
- Hover effects and animations

#### Modal Styles:
- `.portion-plan-modal` - Main modal container
- `.portion-plans-list` - Scrollable list with custom scrollbar
- `.portion-plan-card` - Individual plan cards
- `.portion-plan-card.selected` - Yellow/gold gradient when selected

#### Profit Calculator:
- `.profit-calculator` - Gray gradient background
- `.margin-btn` - Quick profit buttons
- `.margin-btn.active` - Orange gradient for active button
- `.calculation-summary` - White card with breakdown
- `.profit-row` - Green gradient for profit
- `.total-row` - Yellow gradient for selling price

#### Responsive Design:
- Mobile-friendly layouts
- Stacked buttons on small screens
- Full-width modal on mobile

---

## 📊 User Flow

### **Step 1: Create & Execute Portion Plan**
1. Go to **Portion Calculator**
2. Create a new portion plan
3. **Execute the plan** (deduct inventory)

### **Step 2: View in Finance Dashboard**
1. Open **Finance Dashboard**
2. Scroll to **Add Finance Record** section
3. See **"🍽️ Add from Portion Plan"** button

### **Step 3: Select Plan & Calculate Profit**
1. Click "Add from Portion Plan"
2. Modal opens showing all executed plans
3. Click on a plan to select it
4. Profit calculator appears below

### **Step 4: Choose Profit Margin**

**Option A: Quick Buttons**
- Click **40%**, **60%**, or **80%**
- Profit and selling price update instantly

**Option B: Custom Percentage**
- Enter any number in "Custom Profit %"
- Can be 0-1000% (e.g., 45.5%, 100%, 250%)

### **Step 5: Review Calculation**
```
Cost Price:       Rs 15,000.00
Profit (60%):    +Rs 9,000.00
────────────────────────────────
Selling Price:    Rs 24,000.00
```

### **Step 6: Add to Record**
1. Click **"Add to Record"** button
2. Modal closes
3. **Finance record form is auto-filled:**
   - **Type**: Income
   - **Category**: Sales
   - **Amount**: Rs 24,000.00
   - **Description**: "Family Dinner - 20 people (Cost: Rs 15,000.00, Profit: Rs 9,000.00 @ 60%)"

### **Step 7: Submit Record**
1. Review the auto-filled form
2. Modify if needed
3. Click **"➕ Add Record"**
4. Record saved to database!

---

## 💡 Example Scenarios

### **Scenario 1: Wedding Catering**

**Portion Plan:**
- Name: "Wedding Buffet - Table 1"
- People: 50
- Main Meal: Chicken Biryani
- Curries: Dhal Curry, Chicken Curry, Brinjal Moju
- Total Cost: Rs 75,000.00

**Profit Calculation (60%):**
- Cost: Rs 75,000.00
- Profit: Rs 45,000.00
- **Selling Price: Rs 120,000.00**

**Finance Record:**
```
Type: Income
Category: Sales
Amount: Rs 120,000.00
Description: Wedding Buffet - Table 1 - 50 people 
             (Cost: Rs 75,000.00, Profit: Rs 45,000.00 @ 60%)
```

---

### **Scenario 2: Corporate Lunch**

**Portion Plan:**
- Name: "Office Lunch - Tech Company"
- People: 100
- Main Meal: Rice & Curry
- Curries: 3 varieties
- Total Cost: Rs 50,000.00

**Profit Calculation (Custom 45%):**
- Cost: Rs 50,000.00
- Profit: Rs 22,500.00
- **Selling Price: Rs 72,500.00**

**Finance Record:**
```
Type: Income
Category: Sales
Amount: Rs 72,500.00
Description: Office Lunch - Tech Company - 100 people 
             (Cost: Rs 50,000.00, Profit: Rs 22,500.00 @ 45%)
```

---

### **Scenario 3: Small Party**

**Portion Plan:**
- Name: "Birthday Party Meal"
- People: 15
- Main Meal: Fried Rice
- Curries: 2 varieties
- Total Cost: Rs 12,000.00

**Profit Calculation (80%):**
- Cost: Rs 12,000.00
- Profit: Rs 9,600.00
- **Selling Price: Rs 21,600.00**

**Finance Record:**
```
Type: Income
Category: Sales
Amount: Rs 21,600.00
Description: Birthday Party Meal - 15 people 
             (Cost: Rs 12,000.00, Profit: Rs 9,600.00 @ 80%)
```

---

## 🎨 Visual Design

### **Plan Card (Not Selected):**
```
┌─────────────────────────────────────────┐
│ Wedding Buffet - Table 1    [PLAN-0042]│
├─────────────────────────────────────────┤
│ 👥 People:      50                      │
│ 🍛 Main Meal:   Chicken Biryani         │
│ 🥘 Curries:     Dhal, Chicken, Brinjal  │
│ 💰 Total Cost:  Rs 75,000.00  [Green bg]│
│ 📅 Created:     Oct 5, 2025             │
└─────────────────────────────────────────┘
```

### **Plan Card (Selected):**
```
┌─────────────────────────────────────────┐  ← Yellow/gold gradient
│ Wedding Buffet - Table 1    [PLAN-0042]│  [✓ Selected]
├─────────────────────────────────────────┤
│ 👥 People:      50                      │
│ 🍛 Main Meal:   Chicken Biryani         │
│ 🥘 Curries:     Dhal, Chicken, Brinjal  │
│ 💰 Total Cost:  Rs 75,000.00            │
│ 📅 Created:     Oct 5, 2025             │
└─────────────────────────────────────────┘
```

---

## ✅ Benefits

### **For Restaurant Owners:**
1. **Accurate Pricing** - Know exact costs before quoting
2. **Consistent Margins** - Maintain profitability
3. **Quick Calculations** - No manual math needed
4. **Complete Records** - Full traceability from plan to payment
5. **Profit Tracking** - See how much you actually earned

### **For Managers:**
1. **Easy Data Entry** - One click to add records
2. **Detailed Descriptions** - Auto-generated with all info
3. **Flexible Pricing** - Quick or custom margins
4. **Audit Trail** - Link back to original portion plan

### **For Accountants:**
1. **Cost Breakdown** - Clear separation of cost vs. profit
2. **Margin Visibility** - See % markup used
3. **Income Tracking** - All sales properly recorded
4. **Expense Matching** - Link income to inventory costs

---

## 🔍 Technical Details

### **Data Flow:**

```
1. Portion Plan Created
   ↓
2. Plan Executed (inventory deducted)
   ↓
3. isInventoryDeducted = true
   ↓
4. Plan appears in Finance Dashboard
   ↓
5. User selects plan & profit margin
   ↓
6. Calculations performed
   ↓
7. Finance record auto-filled
   ↓
8. User submits record
   ↓
9. Income tracked in database
```

### **State Management:**

```javascript
executedPortionPlans: []        // All executed plans
selectedPlan: null               // Currently selected plan
profitMargin: 40                 // Quick button value (40, 60, 80)
customProfit: ""                 // Custom input value
showPortionPlanModal: false      // Modal visibility
```

### **Calculation Logic:**

```javascript
// Priority: Custom > Quick Button
const activeMargin = customProfit !== "" 
  ? parseFloat(customProfit) 
  : profitMargin;

// Calculate profit
const profit = (cost × activeMargin) ÷ 100;

// Calculate selling price
const sellingPrice = cost + profit;
```

---

## 📋 Testing Checklist

### **1. Create & Execute Plan:**
- [ ] Create a portion plan in Portion Calculator
- [ ] Execute the plan (deduct inventory)
- [ ] Verify `isInventoryDeducted` is true

### **2. View in Finance Dashboard:**
- [ ] Open Finance Dashboard
- [ ] Scroll to "Add Finance Record" section
- [ ] Verify "🍽️ Add from Portion Plan" button appears
- [ ] Verify button only shows if executed plans exist

### **3. Select Plan:**
- [ ] Click "Add from Portion Plan" button
- [ ] Modal opens with list of plans
- [ ] Click on a plan card
- [ ] Verify card gets yellow background
- [ ] Verify "✓ Selected" badge appears

### **4. Test Profit Calculations:**

**40% Margin:**
- [ ] Click "40%" button
- [ ] Verify button turns orange
- [ ] Check profit = cost × 0.4
- [ ] Check selling price = cost + profit

**60% Margin:**
- [ ] Click "60%" button
- [ ] Verify calculation updates instantly

**80% Margin:**
- [ ] Click "80%" button
- [ ] Verify calculation updates

**Custom Margin:**
- [ ] Enter "45" in custom field
- [ ] Verify quick buttons deactivate
- [ ] Check profit = cost × 0.45
- [ ] Try decimal: "45.5"
- [ ] Try high value: "150"

### **5. Add to Record:**
- [ ] Click "Add to Record" button
- [ ] Modal closes
- [ ] Verify form is filled:
  - Type = Income
  - Category = Sales
  - Amount = calculated selling price
  - Description includes all details
- [ ] Submit the record
- [ ] Verify record appears in table

### **6. Edge Cases:**
- [ ] Test with $0 cost plan (if possible)
- [ ] Test with very high cost (e.g., Rs 1,000,000)
- [ ] Test with negative custom profit (should it allow?)
- [ ] Test with 0% profit margin
- [ ] Close modal without selecting (should not affect form)

### **7. Mobile Responsiveness:**
- [ ] Test on mobile screen size
- [ ] Buttons stack vertically
- [ ] Modal fits screen
- [ ] All text readable
- [ ] Touch targets large enough

---

**Status:** ✅ Complete  
**Date:** October 5, 2025  
**Feature:** Portion Plan Integration with Finance Dashboard  
**Profit Options:** 40%, 60%, 80%, Custom%
