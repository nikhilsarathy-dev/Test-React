# Rolling Window Calculation - Mathematical Validation

## Current Implementation Analysis

### Two Key Metrics (Often Confused):

1. **Critical Window Days**: Maximum days in ANY 18-month window
   - This DOES decrease when visits are spaced apart
   - Minimum value = longest single visit duration

2. **Total Days**: Sum of all visit durations
   - This NEVER changes when moving visits
   - Only changes when adding/deleting/resizing visits

## Test Scenarios

### Scenario 1: Default Configuration
**Stays:**
- Stay #1: Oct 28, 2024 → Mar 22, 2025 = 145 days
- Stay #2: Jul 27, 2025 → Jan 7, 2026 = 164 days
- Gap: 127 days

**Expected:**
- Total Days: 309 days (145 + 164)
- Critical Window: 309 days
- Reason: Both stays fit within an 18-month window

### Scenario 2: Moving Stay #2 Forward (11 months)
**Stays:**
- Stay #1: Oct 28, 2024 → Mar 22, 2025 = 145 days
- Stay #2: Jul 1, 2026 → Nov 30, 2026 = 153 days
- Gap: ~15 months

**Expected:**
- Total Days: 298 days (145 + 153)
- Critical Window: 153 days (reduced!)
- Reason: 15-month gap means no 18-month window contains both stays

### Scenario 3: Maximum Spacing
**Stays:**
- Stay #1: Oct 28, 2024 → Mar 22, 2025 = 145 days
- Stay #2: Apr 1, 2027 → Jul 30, 2027 = 121 days
- Gap: ~24 months

**Expected:**
- Total Days: 266 days
- Critical Window: 145 days (just Stay #1)
- Reason: Stays are >18 months apart

## Window Calculation Formula

For each 18-month window:
1. Define window: [Start Date, Start Date + 548 days]
2. For each stay:
   - overlap_start = MAX(stay.start, window.start)
   - overlap_end = MIN(stay.end, window.end)
   - If overlap_start ≤ overlap_end: add days
3. Critical Window = MAX(all window totals)

## Identified Issue

Users may be watching "Total Days" expecting it to change when moving visits.
The "Critical Window" is the correct metric to watch for spacing validation.

## Solution

1. Add clearer labels distinguishing the two metrics
2. Add visual rolling window on visits timeline bar
3. Show real-time updates during dragging
