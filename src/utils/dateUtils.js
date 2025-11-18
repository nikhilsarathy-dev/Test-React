export const daysBetween = (start, end) => {
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

export const dateToPosition = (date, visaStart, visaEnd) => {
  const totalDays = (visaEnd - visaStart) / (1000 * 60 * 60 * 24);
  const daysFromStart = (date - visaStart) / (1000 * 60 * 60 * 24);
  return (daysFromStart / totalDays) * 100;
};

export const positionToDate = (position, visaStart, visaEnd) => {
  const totalDays = (visaEnd - visaStart) / (1000 * 60 * 60 * 24);
  const daysFromStart = (position / 100) * totalDays;
  return new Date(visaStart.getTime() + daysFromStart * 24 * 60 * 60 * 1000);
};

export const getMonthsArray = (visaStart, visaEnd) => {
  const months = [];
  let current = new Date(visaStart);
  while (current <= visaEnd) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
};

// Calculate rolling window from the END of the latest visit (forward-looking planning)
export const calculateCriticalWindow = (stays, daysIn18Months) => {
  if (stays.length === 0) {
    return {
      start: new Date(),
      end: new Date(),
      days: 0,
      name: 'No visits'
    };
  }

  // Find the latest visit end date (the planning horizon)
  const latestVisitEnd = stays.reduce((max, stay) =>
    stay.end > max ? stay.end : max, stays[0].end
  );

  // Calculate 18-month window ENDING at latest visit
  const windowStart = new Date(latestVisitEnd.getTime() - daysIn18Months * 24 * 60 * 60 * 1000);
  const windowEnd = latestVisitEnd;

  // Count days that fall within this window
  let daysInWindow = 0;
  stays.forEach(stay => {
    const overlapStart = new Date(Math.max(stay.start, windowStart));
    const overlapEnd = new Date(Math.min(stay.end, windowEnd));

    if (overlapStart <= overlapEnd) {
      daysInWindow += daysBetween(overlapStart, overlapEnd);
    }
  });

  return {
    start: windowStart,
    end: windowEnd,
    days: daysInWindow,
    name: 'Current 18-month window'
  };
};

// Calculate all possible 18-month windows for analysis
export const calculateAllWindows = (stays, daysIn18Months) => {
  const windows = [];

  // Add windows starting from each stay's start date
  stays.forEach(stay => {
    windows.push({
      start: new Date(stay.start),
      end: new Date(stay.start.getTime() + daysIn18Months * 24 * 60 * 60 * 1000),
      name: `From ${stay.name}`,
      stayRef: stay
    });
  });

  // Add windows ending at each stay's end date
  stays.forEach(stay => {
    const windowStart = new Date(stay.end.getTime() - daysIn18Months * 24 * 60 * 60 * 1000);
    windows.push({
      start: windowStart,
      end: new Date(stay.end),
      name: `To ${stay.name}`,
      stayRef: stay
    });
  });

  // Calculate days in each window
  windows.forEach(window => {
    let daysInWindow = 0;
    stays.forEach(stay => {
      const overlapStart = new Date(Math.max(stay.start, window.start));
      const overlapEnd = new Date(Math.min(stay.end, window.end));

      if (overlapStart <= overlapEnd) {
        daysInWindow += daysBetween(overlapStart, overlapEnd);
      }
    });
    window.days = daysInWindow;
  });

  return windows;
};

// Check for continuous stay violations (single visit >= 365 days)
export const checkContinuousStayViolation = (stays) => {
  const longestStay = stays.reduce((max, stay) => {
    const days = daysBetween(stay.start, stay.end);
    return days > max.days ? { stay, days } : max;
  }, { stay: null, days: 0 });

  return {
    violation: longestStay.days >= 365,
    longestStay: longestStay.stay,
    days: longestStay.days
  };
};
