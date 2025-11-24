# Time Package Purchase Flow - User Dashboard

## Overview
When a user purchases a time package (5, 10, 30, or 60 minutes), the system performs several operations to deduct balance, update session time, and grant internet access.

---

## Step-by-Step Flow

### 1. **User Clicks a Time Package Button**
   - User selects a package (e.g., 30 minutes)
   - System calculates cost: `30 minutes × billingRatePerMinute (₱0.175) = ₱5.25`
   - Checks if user has sufficient balance
   - If insufficient balance → Shows error modal
   - If sufficient balance → Shows confirmation modal

### 2. **User Confirms Purchase**
   - User clicks "Confirm" in the confirmation modal
   - System starts the purchase process

### 3. **Balance Deduction**
   - Deducts the cost from user's balance in Firestore
   - Example: If balance was ₱100.00, it becomes ₱94.75

### 4. **Check for Saved Time & Grace Period**
   The system checks:
   - **Saved Time**: Time that was saved from a previous session (when user ended session early)
   - **Grace Period**: 5 minutes free time (only if it's a new day and user hasn't used it today)

### 5. **Calculate Total Time to Add**
   ```
   timeToAdd = purchasedMinutes + savedTime + gracePeriod (if eligible)
   ```

   **Scenario A: No Active Session + Has Saved Time**
   - Includes saved time in the calculation
   - If it's a new day → Adds 5-minute grace period
   - Example: 30 min purchased + 15 min saved + 5 min grace = 50 minutes total

   **Scenario B: Active Session Exists**
   - Only adds purchased time (doesn't include saved time)
   - Example: 30 minutes purchased → adds 30 minutes to existing session

### 6. **Update Session End Time**

   **If Active Session Exists:**
   ```
   newEndTime = currentSessionEndTime + (timeToAdd × 1000 milliseconds)
   ```
   - Extends the existing session
   - Time continues counting down from where it was

   **If No Active Session:**
   ```
   newEndTime = now + (timeToAdd × 1000 milliseconds)
   ```
   - Starts a new session from the current time
   - Includes saved time and grace period (if applicable)

### 7. **Clear Saved Time**
   - If saved time was included in the new session → Clears `savedRemainingTimeSeconds` and `savedTimeDate` from Firestore
   - This prevents double-counting the saved time

### 8. **Record Grace Period**
   - If grace period was granted → Records `lastGracePeriodDate` in Firestore
   - This prevents granting grace period again on the same day

### 9. **Save Transaction**
   - Creates a transaction record in Firestore
   - Document ID format: `PACK{number}-{6 random chars}` (e.g., `PACK2-ABC123`)
   - Transaction includes:
     - Type: "Deducted"
     - Amount: Cost of the package
     - Minutes purchased: Number of minutes
     - Timestamp: When purchased
     - Description: "Purchased X minutes of internet"

### 10. **Update Firestore**
   Updates the user document with:
   - New balance (decremented)
   - New `sessionEndTime` (when session will end)
   - New `sessionStartTime` (when session started)
   - Cleared saved time (if applicable)
   - Grace period date (if applicable)

### 11. **Update Local State**
   - Updates the dashboard UI to reflect:
     - New balance
     - New time remaining
     - Active session status

### 12. **Show Success Modal**
   - Displays success message
   - Shows total time available (including saved time and grace period if applicable)

---

## Important Notes

### ⏱️ **Time Only Deducts When Connected**
   - Time only counts down when you have an **active session** (`sessionEndTime > now`)
   - If you're not connected to WiFi, time is saved in `savedRemainingTimeSeconds` and **does NOT deduct**
   - When you purchase a new package, saved time is automatically included

### 💾 **Saved Time Behavior**
   - Saved time is included when starting a NEW session
   - Saved time is NOT included when EXTENDING an existing session
   - Saved time is cleared once it's used

### 🎁 **Grace Period**
   - 5 minutes free time
   - Only granted once per day
   - Only granted when starting a NEW session (not when extending)
   - Only granted if you have saved time from a previous day

### 🔄 **Active Session vs. No Active Session**

   **Active Session (Connected to WiFi):**
   - Time is actively counting down
   - Purchasing adds time to the existing session
   - Example: 10 min remaining → Purchase 30 min → Now 40 min remaining

   **No Active Session (Not Connected):**
   - Time is saved (not counting down)
   - Purchasing starts a new session
   - Includes saved time + grace period (if eligible)
   - Example: 15 min saved → Purchase 30 min → New session with 50 min (30 + 15 + 5 grace)

---

## Example Scenarios

### Scenario 1: Purchase While Connected
- Current: 20 minutes remaining (active session)
- Purchase: 30 minutes
- Result: 50 minutes remaining (session extended)

### Scenario 2: Purchase While Not Connected (Has Saved Time)
- Current: 15 minutes saved (no active session)
- Purchase: 30 minutes
- Result: New session with 50 minutes (30 + 15 + 5 grace period)

### Scenario 3: Purchase While Not Connected (No Saved Time)
- Current: 0 minutes (no active session, no saved time)
- Purchase: 30 minutes
- Result: New session with 30 minutes

---

## Orange Pi API Call (ez-vendo-ui only)
Note: The `ez-vendo-next` dashboard does NOT call the Orange Pi API directly. The Orange Pi API is called by:
- The ESP32 (when RFID is scanned)
- The `ez-vendo-ui` dashboard (when purchasing time packages)

The `ez-vendo-next` dashboard is for viewing/managing your account, not for granting WiFi access.

