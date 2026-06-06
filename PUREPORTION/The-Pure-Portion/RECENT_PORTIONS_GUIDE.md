# Quick Guide: Recent Portions Actions

## 🎯 What Each Button Does

### 👁️ VIEW Button (Blue)
**Purpose**: Look at an existing plan and use it

**What happens:**
1. ✅ Opens results page immediately
2. ✅ Shows all plan details
3. ✅ Can download PDF
4. ✅ Can execute/send to inventory
5. ✅ Does NOT create a new plan
6. ✅ Uses same Plan ID

**When to use:**
- Want to see what's in a plan
- Need to download PDF again
- Want to execute an existing plan
- Just reviewing past plans

---

### 📋 COPY Button (Green)
**Purpose**: Create a brand new plan with same recipes

**What happens:**
1. ✅ Creates NEW plan in database
2. ✅ Gets NEW Plan ID (e.g., PLAN-0023)
3. ✅ Adds " (Copy)" to name
4. ✅ Recalculates all ingredients
5. ✅ Opens results page immediately
6. ✅ Can download PDF
7. ✅ Can execute/send to inventory
8. ✅ Original plan stays unchanged

**When to use:**
- Want to make similar plan for different day
- Need fresh copy with new Plan ID
- Want to track as separate order
- Planning multiple similar events

---

### 🗑️ DELETE Button (Red)
**Purpose**: Permanently remove a plan

**What happens:**
1. ⚠️ Shows confirmation popup
2. ✅ Removes from database forever
3. ✅ Cannot be undone
4. ✅ Disappears from list

**When to use:**
- Plan was created by mistake
- Old plan no longer needed
- Cleaning up test data
- Removing duplicates

---

## 📊 Comparison Table

| Feature | VIEW | COPY | DELETE |
|---------|------|------|--------|
| Creates new plan | ❌ No | ✅ Yes | ❌ N/A |
| Gets new Plan ID | ❌ No | ✅ Yes | ❌ N/A |
| Changes database | ❌ No | ✅ Yes (adds) | ✅ Yes (removes) |
| Shows results | ✅ Yes | ✅ Yes | ❌ No |
| Can download PDF | ✅ Yes | ✅ Yes | ❌ N/A |
| Can execute | ✅ Yes | ✅ Yes | ❌ N/A |
| Requires confirm | ❌ No | ❌ No | ✅ Yes |
| Reversible | ✅ N/A | ✅ N/A | ❌ No |

---

## 🔄 Typical Workflows

### Scenario 1: Review Yesterday's Plan
```
Goal: Check what was planned yesterday

Steps:
1. Click "Recent Portions"
2. Find yesterday's plan
3. Click "👁️ View"
4. Review ingredients and costs
5. Download PDF if needed
6. Click back arrow when done
```

### Scenario 2: Repeat Same Menu Today
```
Goal: Use same recipes for today

Steps:
1. Click "Recent Portions"
2. Find the plan to repeat
3. Click "📋 Copy"
4. New plan created automatically (PLAN-0024)
5. Results page opens
6. Click "Send to Inventory"
7. Done! Inventory updated for today's plan
```

### Scenario 3: Monthly Meal Planning
```
Goal: Create 4 weekly plans based on same template

Steps:
1. Create initial plan (Week 1)
2. Click "Recent Portions"
3. Click "📋 Copy" on Week 1 plan
4. Execute for Week 2 (gets PLAN-0025)
5. Click "Recent Portions" again
6. Click "📋 Copy" on Week 1 plan again
7. Execute for Week 3 (gets PLAN-0026)
8. Repeat for Week 4

Result: 4 separate plans tracked individually
```

### Scenario 4: Clean Up Test Plans
```
Goal: Remove plans created during testing

Steps:
1. Click "Recent Portions"
2. Find test plans
3. Click "🗑️ Delete" on each
4. Confirm deletion
5. Plans removed from system
```

---

## ⚡ Quick Tips

### Speed Tips
- **VIEW** is fastest - no API call
- **COPY** takes ~1 second (creates new plan)
- **DELETE** needs confirmation (safety feature)

### Cost Tracking
- Each COPY gets unique Plan ID
- Each execution tracked separately
- Good for accounting/budgeting

### Inventory Management
- VIEW doesn't affect inventory
- COPY doesn't affect inventory (until executed)
- Execute button deducts from inventory

### PDF Downloads
- VIEW: Downloads PDF of original plan
- COPY: Downloads PDF of new plan (new Plan ID)
- Each has separate PDF with correct ID

---

## ❓ FAQ

**Q: What's difference between VIEW and COPY?**
A: VIEW shows existing plan. COPY creates brand new plan.

**Q: Can I edit a plan's recipes?**
A: Not directly. Use COPY then modify if needed (future feature).

**Q: Does COPY affect my inventory?**
A: No, only Execute button affects inventory.

**Q: Can I undo DELETE?**
A: No, deletion is permanent. Use COPY first if unsure.

**Q: Why doesn't VIEW create new Plan ID?**
A: It's showing the original plan, not creating new one.

**Q: Can I COPY multiple times?**
A: Yes! Each COPY creates separate plan with new ID.

**Q: Does COPY duplicate Plan ID?**
A: No, each copy gets fresh unique ID (e.g., PLAN-0025).

**Q: What happens if I COPY then Execute twice?**
A: Each plan can only be executed once (inventory already deducted).

---

## 🚨 Important Notes

### ⚠️ Before Deleting
- Make sure you don't need the plan
- Check if it was already executed
- Consider COPY if you might need it later

### ⚠️ When Copying
- New plan created immediately
- Gets new Plan ID automatically
- Original plan unchanged
- Both exist independently

### ⚠️ When Viewing
- Read-only view of existing plan
- Can still Execute if not done yet
- Can download PDF anytime
- Doesn't create duplicate

---

## 🎓 Best Practices

1. **Use VIEW for**: Checking details, downloading PDFs, executing existing plans

2. **Use COPY for**: Making similar plans, monthly repetitions, different batches

3. **Use DELETE for**: Mistakes, old test data, unwanted duplicates

4. **Name Convention**: Original plan stays as is, copies get " (Copy)" suffix

5. **Tracking**: Each copied plan tracked separately - good for accounting

6. **Safety**: Always confirm before DELETE, can't undo

---

## 💡 Pro Tips

- **Batch Planning**: Create one good plan, COPY it multiple times
- **Cost Comparison**: VIEW old plans to compare costs over time
- **Inventory Planning**: COPY plans ahead, Execute when ready
- **PDF Archive**: Download PDFs of all plans for records
- **Clean Regularly**: DELETE test/old plans monthly

