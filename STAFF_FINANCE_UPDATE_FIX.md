# Staff Finance Update Fix

## Problem
When trying to update staff finance details (basic salary, salary type, or bank details) from the Staff Finance Management page, the system returned an error:
```
Failed to update staff details: Server error
```

## Root Cause
The backend `updateStaff` controller function was designed to handle **full staff profile updates** and expected ALL required fields (firstName, lastName, email, phone, position, etc.) to be present in the request body.

When the Staff Finance Management component sent only finance-related fields:
- `salary`
- `salaryType`
- `bankDetails`

The backend tried to parse all fields using the `parseStaffData()` function, which resulted in validation errors because required fields were missing.

## Solution

### Backend Changes (staffController.js)

Modified the `updateStaff` function to detect and handle **partial updates** for finance details:

```javascript
// Check if this is a partial finance update
const isFinanceUpdate = req.body.salary !== undefined && 
                       !req.body.firstName && 
                       !req.body.email;

if (isFinanceUpdate) {
  // Handle partial finance update - only update the fields provided
  updatedData = {
    updatedAt: Date.now()
  };
  
  if (req.body.salary !== undefined) {
    updatedData.salary = Number(req.body.salary);
  }
  
  if (req.body.salaryType) {
    updatedData.salaryType = req.body.salaryType;
  }
  
  if (req.body.bankDetails) {
    updatedData.bankDetails = {
      accountNumber: req.body.bankDetails.accountNumber || staff.bankDetails?.accountNumber || '',
      bankName: req.body.bankDetails.bankName || staff.bankDetails?.bankName || '',
      branchCode: req.body.bankDetails.branchCode || staff.bankDetails?.branchCode || ''
    };
  }
} else {
  // Handle full staff update with all fields
  updatedData = parseStaffData(req.body, req.file, req.user.userId);
}
```

**Key Benefits:**
1. ✅ Supports partial updates without requiring all staff fields
2. ✅ Maintains backward compatibility with full profile updates
3. ✅ Preserves existing data that's not being updated
4. ✅ Properly handles nested bankDetails object

### Frontend Changes (StaffFinanceManagement.js)

Added better logging for debugging:

```javascript
console.log("Sending update data:", updateData);
console.log("Update response:", response.data);
```

This helps track exactly what data is being sent and received.

## How It Works Now

1. **User edits finance details** in Staff Finance Management page
2. **Frontend sends** only the fields being edited:
   ```json
   {
     "salary": 50000,
     "salaryType": "monthly",
     "bankDetails": {
       "accountNumber": "123456789",
       "bankName": "Bank of Ceylon",
       "branchCode": ""
     }
   }
   ```

3. **Backend detects** this is a finance update (has salary but no firstName/email)
4. **Backend updates** only the provided fields, leaving other staff data unchanged
5. **Response** returns the complete updated staff object
6. **Frontend refreshes** the staff list and displays the updated information

## Testing Checklist

- [x] Backend code updated to handle partial updates
- [x] Frontend has proper error logging
- [x] Backend server restarted to apply changes
- [ ] Test updating basic salary
- [ ] Test updating salary type (monthly/daily/hourly)
- [ ] Test updating bank account number
- [ ] Test updating bank name
- [ ] Test updating multiple fields at once
- [ ] Verify other staff fields remain unchanged
- [ ] Check console logs for proper data flow

## How to Test

1. Navigate to Finance Dashboard
2. Click on "Total Staff" card to go to Staff Finance Management
3. Select any staff member
4. Click "Edit Finance Details"
5. Modify the basic salary, salary type, or bank details
6. Click "Save Changes"
7. Verify success message appears
8. Check that the changes are reflected in the staff details
9. Open browser console (F12) to see the logged data

## Expected Behavior

✅ **Success Case:**
- Alert: "Staff finance details updated successfully!"
- Modal closes automatically
- Staff details refresh and show new values
- No errors in console

❌ **Error Case:**
- If error occurs, check browser console for:
  - "Sending update data:" - shows what was sent
  - "Error details:" - shows backend error response
- Common issues:
  - Invalid salary value (not a number)
  - Backend not running
  - Authentication token expired

## Additional Notes

- The fix maintains backward compatibility - full staff profile updates still work
- Only finance-related fields can be updated from the Staff Finance Management page
- To update other fields (name, email, position, etc.), use the main Staff Management page
- The bankDetails object is properly merged, preserving any existing values not being updated

## Files Modified

1. `backend/controllers/staffController.js` - Lines 105-145
   - Added logic to detect and handle partial finance updates
   - Added console.error for better error logging

2. `frontend/src/components/StaffFinanceManagement.js` - Lines 80-138
   - Added console.log statements for debugging
   - Error handling already in place

## Next Steps

After testing, if everything works correctly:
1. Remove or reduce console.log statements in production
2. Consider adding similar partial update support for other specific fields
3. Update API documentation to reflect partial update capability
