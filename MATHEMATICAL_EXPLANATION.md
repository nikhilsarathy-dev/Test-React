# Mathematical Explanation: Rolling Window Calculation

## Understanding the Two Key Metrics

### 1. Critical Window (Net Balance) ⚠️ This is what matters!

**What it is:**
The MAXIMUM number of days spent in ANY 18-month window period.

**How it's calculated:**
- Create multiple 18-month windows from different anchor points
- For each window, sum all overlapping visit days
- The highest total is your "Critical Window"

**Why it changes when you move visits:**
- When visits are spaced >18 months apart, they fall into different windows
- This reduces the maximum days in any single 18-month period

**Example:**
```
Scenario A: Visits close together
Stay #1: Oct 2024 - Mar 2025 (145 days)
Stay #2: Jul 2025 - Jan 2026 (164 days)
Gap: 4 months

Window from Stay #1 start (Oct 2024 + 18mo):
  ✓ Contains Stay #1: 145 days
  ✓ Contains Stay #2: 164 days
  Total: 309 days ← CRITICAL WINDOW

Scenario B: Visits spread apart
Stay #1: Oct 2024 - Mar 2025 (145 days)
Stay #2: Jul 2026 - Nov 2026 (153 days)
Gap: 15 months

Window from Stay #1 start (Oct 2024 + 18mo):
  ✓ Contains Stay #1: 145 days
  ✗ Stay #2 starts AFTER window ends
  Total: 145 days

Window from Stay #2 start (Jul 2026 + 18mo):
  ✗ Stay #1 ended BEFORE window starts
  ✓ Contains Stay #2: 153 days
  Total: 153 days ← CRITICAL WINDOW

Result: Critical window REDUCED from 309 to 153 days! ✅
```

### 2. Total Days (All Visits) ℹ️ Just for information

**What it is:**
Simple sum of all visit durations.

**How it's calculated:**
```javascript
totalDays = Stay1.days + Stay2.days + Stay3.days + ...
```

**Why it doesn't change when moving visits:**
- It's just addition
- Moving a 153-day visit doesn't change that it's still 153 days
- Only changes when you add/delete/resize visits

**Example:**
```
Stay #1: 145 days
Stay #2: 164 days
Total: 309 days

(Move Stay #2 to different date)
Stay #1: 145 days
Stay #2: 164 days (same duration, different date)
Total: STILL 309 days
```

## Visualizing the Rolling Window

### Dashboard Timeline Bar Enhancement

The new rolling window overlay shows:

1. **Visit Blocks**: Colored bars representing each visit
   - Green: Completed visits
   - Purple: Current/future visits

2. **Rolling Window Overlay**: Semi-transparent purple bar
   - Shows the 18-month critical window
   - Spans backwards from the critical point
   - Visually shows which portions of visits are included

### How the Window "Rolls"

```
Timeline: |---Stay1---|___gap___|---Stay2---|

Window 1 (from Stay1 start):
|========18 months========|
|---Stay1---|---Stay2---|
Total: Stay1 + Stay2

Window 2 (from Stay2 start):
              |========18 months========|
              |---Stay2---|
Total: Just Stay2

As you move Stay2 further right →
The critical window shrinks because:
- Window 1 no longer contains Stay2
- Window 2 only contains Stay2
- Critical = MAX(Stay1 only, Stay2 only) < Previous total
```

## Testing the Calculation

### Test Case 1: Default Stays
```
Input:
  Stay #1: Oct 28, 2024 - Mar 22, 2025 = 145d
  Stay #2: Jul 27, 2025 - Jan 7, 2026 = 164d

Expected Output:
  ✓ Critical Window: 309 days
  ✓ Total Days: 309 days
  ✓ Status: Valid (56 days buffer)
```

### Test Case 2: Move Stay #2 Forward
```
Input:
  Stay #1: Oct 28, 2024 - Mar 22, 2025 = 145d
  Stay #2: Jul 1, 2026 - Nov 30, 2026 = 153d (moved 11 months later)

Expected Output:
  ✓ Critical Window: 153 days (REDUCED!)
  ✓ Total Days: 298 days
  ✓ Status: Valid (212 days buffer)
```

### Test Case 3: Maximum Spacing
```
Input:
  Stay #1: Oct 28, 2024 - Mar 22, 2025 = 145d
  Stay #2: Apr 1, 2027 - Jul 30, 2027 = 121d (24 months gap)

Expected Output:
  ✓ Critical Window: 145 days (minimum possible = longest single visit)
  ✓ Total Days: 266 days
  ✓ Status: Valid (220 days buffer)
```

## Common Misconceptions

### ❌ "Total Days should decrease when I space visits"
**Wrong!** Total Days is just addition. It never accounts for spacing.

### ✅ "Critical Window decreases when I space visits"
**Correct!** This is the metric that validates your plan.

### ❌ "The critical window can reach zero"
**Wrong!** Minimum critical window = longest single visit duration.

### ✅ "With proper spacing, critical window = longest visit"
**Correct!** When all visits are >18 months apart, each is in its own window.

## Implementation Notes

### Window Creation
```javascript
// Forward windows (from each stay start)
stays.forEach(stay => {
  windows.push({
    start: stay.start,
    end: stay.start + 548 days
  });
});

// Backward windows (to each stay end)
stays.forEach(stay => {
  windows.push({
    start: stay.end - 548 days,
    end: stay.end
  });
});
```

### Overlap Calculation
```javascript
windows.forEach(window => {
  let total = 0;
  stays.forEach(stay => {
    const overlapStart = MAX(stay.start, window.start);
    const overlapEnd = MIN(stay.end, window.end);

    if (overlapStart <= overlapEnd) {
      total += daysBetween(overlapStart, overlapEnd);
    }
  });
  window.days = total;
});
```

### Critical Window Selection
```javascript
const criticalWindow = windows.reduce((max, window) =>
  window.days > max.days ? window : max
);
```

## UI Changes Summary

1. **Clearer Labels**
   - "Critical Window (Max in 18mo)" with note "↑ Changes when visits are spaced"
   - "Total Days (All Visits)" with note "↑ Sum of all visit durations"

2. **Visual Rolling Window**
   - New timeline bar below progress bar
   - Shows critical 18-month window as overlay
   - Updates in real-time during dragging

3. **Better Feedback**
   - Users can now SEE which portions of visits are in the critical window
   - More intuitive understanding of spacing impact

## Validation

The calculation is mathematically sound and matches immigration requirements:
- Visa Condition 8558: "Must not stay in Australia for more than 12 months in any 18-month period"
- Our implementation: Checks ALL possible 18-month windows, not just a single one
- Result: Conservative and compliant validation

---

**Summary**: When you move visits apart, watch the "Critical Window" metric. The "Total Days" is just informational and doesn't validate your plan.
