# Forward-Looking Rolling Window Calculation

## New Calculation Logic (Implemented)

### Critical Window: Days Ending at Latest Visit

The app now calculates the "Critical Window" as the 18-month period **ENDING at the latest (most recent) visit**.

This is a **forward-looking planning approach**:
- You're planning your next visit
- You need to know: "How many days have I used in the 18 months ending NOW?"
- This tells you how much room you have for the current/next visit

### Formula

```javascript
// Find the latest visit end date
const latestVisitEnd = MAX(all visit end dates);

// Calculate 18-month window ENDING at this date
const windowStart = latestVisitEnd - 548 days;
const windowEnd = latestVisitEnd;

// Count all days that fall within this window
criticalWindowDays = SUM(overlapping days from all visits);
```

### Why This CAN Be Zero

**Example Scenario:**
```
Stay #1: Oct 2024 - Mar 2025 (145 days) [COMPLETED]
Stay #2: Jul 2027 - Nov 2027 (120 days) [FUTURE]

Latest visit: Stay #2 ends Nov 2027
18-month window: May 2026 - Nov 2027

Visits in this window:
- Stay #1 ended Mar 2025 (BEFORE window starts) → 0 days
- Stay #2: Jul-Nov 2027 (fully in window) → 120 days

Critical Window: 120 days ✅
```

If you delete Stay #2, the latest visit becomes Stay #1 (Mar 2025):
```
Latest visit: Stay #1 ends Mar 2025
18-month window: Sep 2023 - Mar 2025

Visits in this window:
- Stay #1: Oct 2024 - Mar 2025 → 145 days

Critical Window: 145 days
```

**Zero scenario would require no visits at all** or all visits to be outside the 18-month window from the latest visit (which is logically impossible since the latest visit IS in its own window).

**Minimum Critical Window = Days of the longest visit**

## Two Key Metrics

### 1. Critical Window (18mo from latest) ⭐

**What it shows:**
Days consumed in the 18 months ending at your latest/next visit.

**Why it matters:**
This is what validates your plan. Must stay ≤ 365 days.

**When it changes:**
- When you move visits to different dates
- When you add/delete/resize visits
- As time progresses and old visits "fall out" of the window

**Can be zero?**
Technically, if you have NO visits, it's zero. But with any visits, minimum = longest single visit duration.

### 2. Total Days (All Visits) ℹ️

**What it shows:**
Simple sum of all visit durations.

**Why it's useful:**
Reference metric to see cumulative time spent.

**When it changes:**
- When you add/delete/resize visits
- Does NOT change when moving visits

**Can be zero?**
Yes, if you have no visits.

## Validation Rules

### Priority 1: Continuous Stay Violation ❌

```
IF any single visit ≥ 365 days
THEN visa auto-cancels
```

**Example:**
- Stay #1: 370 days → INVALID (visa cancelled at day 365)

### Priority 2: Rolling 18-Month Limit ❌

```
IF critical window > 365 days
THEN violates Condition 8558
```

**Example:**
- Stay #1: 200 days (Oct 2024 - Apr 2025)
- Stay #2: 180 days (May 2025 - Oct 2025)
- Critical window (to Stay #2 end): 380 days → INVALID

### Priority 3: Close to Limit ⚠️

```
IF 330 < critical window ≤ 365
THEN warning (very little buffer)
```

**Example:**
- Critical window: 350 days → WARNING (only 15 days buffer)

### All Clear ✅

```
IF critical window ≤ 330
AND no continuous stay violation
THEN valid
```

## Planning Beyond Current Visa

### New Feature: No Hard Restriction

**Previous behavior:**
- Could not add visits beyond Sep 30, 2027
- Could not drag visits past visa end date

**New behavior:**
- Can plan visits beyond current visa period
- Dashboard shows warning: "Planning beyond current visa. New visa required."
- **Critical Point:** 18-month rule STILL APPLIES even with new visa!

### Example

```
Current visa: Oct 2024 - Sep 2027

Stay #1: Oct 2024 - Mar 2025 (145d) [Current visa]
Stay #2: Jul 2027 - Dec 2027 (153d) [Current visa]
Stay #3: Jul 2028 - Nov 2028 (120d) [NEW VISA NEEDED]

Critical Window (to Stay #3 end):
  Window: Jan 2027 - Nov 2028 (18 months)
  Stay #1: Ended before window → 0 days
  Stay #2: Partially overlaps → ~90 days
  Stay #3: Fully in window → 120 days
  Total: 210 days ✅ VALID

Even with a new visa, your previous stays from the old visa
still count if they're within 18 months of your new visit!
```

## Practical Usage

### Scenario 1: Extending Current Stay

**Question:** "Can I extend Stay #2 by 1 month?"

**How to check:**
1. Drag the right handle of Stay #2 to extend it
2. Watch the "Critical Window" number
3. If it stays ≤ 365, you're good!
4. The 18-month window automatically adjusts as you drag

### Scenario 2: Planning Future Visit

**Question:** "I want to visit again in July 2026. How long can I stay?"

**How to check:**
1. Click "Add Visit" to create Stay #3
2. Drag it to July 2026
3. Drag the right handle to extend duration
4. Watch "Critical Window" - stop when it approaches 330-340 days
5. That's your maximum safe duration

### Scenario 3: Maximizing Time in Australia

**Strategy:**
1. Space visits 18+ months apart
2. Each visit can be up to 11-12 months
3. Critical window = just the current visit
4. Example pattern:
   - Visit 1: 11 months, end Mar 2025
   - Gap: 19 months
   - Visit 2: 11 months, start Oct 2026
   - Critical window = max(11, 11) = 11 months ✅

## Testing the Calculation

### Test 1: Default Stays (Overlapping)

```
Input:
  Stay #1: Oct 28, 2024 - Mar 22, 2025 (145 days)
  Stay #2: Jul 27, 2025 - Jan 7, 2026 (164 days)

Latest visit: Stay #2 (Jan 7, 2026)
Window: Jul 7, 2024 - Jan 7, 2026

Days in window:
  - Stay #1: Fully in window → 145 days
  - Stay #2: Fully in window → 164 days

Critical Window: 309 days ✅
Total Days: 309 days
```

### Test 2: Spaced Out Visits

```
Input:
  Stay #1: Oct 28, 2024 - Mar 22, 2025 (145 days)
  Stay #2: Jul 1, 2026 - Nov 30, 2026 (153 days)

Latest visit: Stay #2 (Nov 30, 2026)
Window: May 30, 2025 - Nov 30, 2026

Days in window:
  - Stay #1: Ended Mar 2025 (before window) → 0 days
  - Stay #2: Fully in window → 153 days

Critical Window: 153 days ✅ (REDUCED!)
Total Days: 298 days
```

### Test 3: Continuous Stay Violation

```
Input:
  Stay #1: Oct 28, 2024 - Nov 15, 2025 (383 days)

Critical Window: 383 days
Continuous Stay: 383 days

Result: ❌ INVALID
Reason: Continuous stay exceeds 365 days
Message: "Visa auto-cancels at day 365"
```

## Key Differences from Old Logic

| Aspect | Old Logic | New Logic |
|--------|-----------|-----------|
| Window Anchor | Multiple windows from each stay | Single window from latest visit |
| Critical Window | Maximum across ALL windows | Days in window ending at latest visit |
| Can be zero? | No (always had some days) | Theoretically yes (if no visits) |
| Planning beyond visa | ❌ Blocked | ✅ Allowed with warning |
| Focus | Validation of all scenarios | Forward-looking planning |
| Continuous stay check | Not explicit | ✅ Dedicated check |

## Summary

The new calculation gives you a **real-time planning tool**:
- "I have X days used in my current 18-month window"
- "I can add Y more days before hitting the limit"
- "Old visits fall out of the window as time passes"
- "I can plan beyond my current visa, but the rule still applies"

This matches how you would naturally think about planning visits: "Given what I've already done, how much more can I do?"
