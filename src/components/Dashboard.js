import React, { useMemo } from 'react';
import { calculateCriticalWindow, calculateAllWindows, daysBetween, checkContinuousStayViolation } from '../utils/dateUtils';

const Dashboard = ({ stays, visaStart, visaEnd, maxDaysIn18Months, daysIn18Months, currentViewedWindow, setCurrentViewedWindow }) => {
  const validation = useMemo(() => {
    // Calculate total days across all visits
    const totalDaysAllVisits = stays.reduce((sum, stay) => sum + daysBetween(stay.start, stay.end), 0);

    // Calculate CRITICAL WINDOW: 18 months ending at the latest visit
    const criticalWindow = calculateCriticalWindow(stays, daysIn18Months);
    const criticalWindowDays = criticalWindow.days;

    // Check for continuous stay violation (any visit >= 365 days)
    const continuousStayCheck = checkContinuousStayViolation(stays);

    // Check if any visits are beyond current visa
    const visitsOutsideVisa = stays.filter(stay => stay.end > visaEnd);
    const requiresNewVisa = visitsOutsideVisa.length > 0;

    // Calculate all windows for detailed analysis
    const windows = calculateAllWindows(stays, daysIn18Months);

    const percentage = (criticalWindowDays / maxDaysIn18Months) * 100;
    const monthsConsumed = (criticalWindowDays / 30).toFixed(1);
    const totalMonths = (totalDaysAllVisits / 30).toFixed(1);

    let statusClass, statusTitle, statusMessage;

    // Priority 1: Continuous stay violation
    if (continuousStayCheck.violation) {
      statusClass = 'invalid';
      statusTitle = '❌ Continuous Stay Violation';
      statusMessage = `${continuousStayCheck.longestStay?.name || 'A visit'} exceeds 12 months (${continuousStayCheck.days} days). Visa auto-cancels at 365 days continuous stay.`;
    }
    // Priority 2: Rolling 18-month window violation
    else if (criticalWindowDays > maxDaysIn18Months) {
      statusClass = 'invalid';
      statusTitle = '❌ Exceeds 18-Month Limit';
      statusMessage = `${criticalWindowDays} days in current 18-month window (${criticalWindowDays - maxDaysIn18Months} days over). Rule applies even with new visa.`;
    }
    // Priority 3: Close to limit
    else if (criticalWindowDays > 330) {
      statusClass = 'warning';
      statusTitle = '⚠️ Very Close to Limit';
      statusMessage = `${criticalWindowDays} days in window (only ${maxDaysIn18Months - criticalWindowDays} days buffer remaining)`;
    }
    // All good
    else {
      statusClass = 'valid';
      statusTitle = '✅ Within Limits';
      statusMessage = requiresNewVisa
        ? `${criticalWindowDays} days used (${maxDaysIn18Months - criticalWindowDays} buffer). Note: New visa needed for visits beyond ${visaEnd.toLocaleDateString()}.`
        : `${criticalWindowDays} days used (${maxDaysIn18Months - criticalWindowDays} days buffer remaining)`;
    }

    return {
      statusClass,
      statusTitle,
      statusMessage,
      criticalWindowDays,
      totalDaysAllVisits,
      monthsConsumed,
      totalMonths,
      percentage,
      criticalWindow,
      requiresNewVisa,
      visitsOutsideVisa,
      continuousStayViolation: continuousStayCheck.violation,
      continuousStayDays: continuousStayCheck.days,
      windows: windows.sort((a, b) => b.days - a.days).slice(0, 3)
    };
  }, [stays, visaEnd, maxDaysIn18Months, daysIn18Months]);

  const viewWindowByIndex = (index) => {
    setCurrentViewedWindow(validation.windows[index]);
  };

  // Calculate visit timeline positions for rolling window overlay
  const getVisitTimelineData = () => {
    if (stays.length === 0) return null;

    const totalVisaDays = (visaEnd - visaStart) / (1000 * 60 * 60 * 24);
    const criticalWindow = validation.criticalWindow;

    const visits = stays.map(stay => {
      const startPercent = ((stay.start - visaStart) / (1000 * 60 * 60 * 24)) / totalVisaDays * 100;
      const days = daysBetween(stay.start, stay.end);
      const durationPercent = (days / totalVisaDays) * 100;
      const months = (days / 30).toFixed(1);

      return {
        stay,
        startPercent,
        durationPercent,
        days,
        months
      };
    });

    // Calculate rolling window overlay position
    if (criticalWindow) {
      const windowStartPercent = ((criticalWindow.start - visaStart) / (1000 * 60 * 60 * 24)) / totalVisaDays * 100;
      const windowEndPercent = ((criticalWindow.end - visaStart) / (1000 * 60 * 60 * 24)) / totalVisaDays * 100;

      return {
        visits,
        rollingWindow: {
          startPercent: Math.max(0, windowStartPercent),
          widthPercent: Math.min(100, windowEndPercent) - Math.max(0, windowStartPercent),
          days: criticalWindow.days
        }
      };
    }

    return { visits, rollingWindow: null };
  };

  const timelineData = getVisitTimelineData();

  return (
    <div className="dashboard">
      <div className={`validation-status ${validation.statusClass}`}>
        <div className="status-header">
          <div className="status-title">{validation.statusTitle}</div>
          <div className="status-message">{validation.statusMessage}</div>
        </div>

        <div className="metrics-grid">
          <div className={`metric-card critical-window-card ${validation.statusClass}`}>
            <div className="metric-label">Critical Window (18mo from latest)</div>
            <div className="metric-value">{validation.criticalWindowDays}d</div>
            <div className="metric-sublabel">~{validation.monthsConsumed} mo</div>
            <div className="metric-note">Days in 18mo ending at latest visit (can be 0)</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Days (All Visits)</div>
            <div className="metric-value">{validation.totalDaysAllVisits}d</div>
            <div className="metric-sublabel">~{validation.totalMonths} mo</div>
            <div className="metric-note">Cumulative across all visits</div>
          </div>
        </div>

        {validation.requiresNewVisa && (
          <div className="visa-notice">
            ⚠️ Planning beyond current visa ({visaEnd.toLocaleDateString()}). New visa required. 18-month rule still applies.
          </div>
        )}

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(validation.percentage, 100)}%` }}>
            {validation.criticalWindowDays} / {maxDaysIn18Months}
          </div>
        </div>

        {timelineData && (
          <div className="visits-timeline-wrapper">
            <div className="visits-timeline">
              {/* Rolling window overlay */}
              {timelineData.rollingWindow && (
                <div
                  className="rolling-window-timeline-overlay"
                  style={{
                    left: `${timelineData.rollingWindow.startPercent}%`,
                    width: `${timelineData.rollingWindow.widthPercent}%`
                  }}
                  title={`18-Month Critical Window: ${timelineData.rollingWindow.days} days`}
                >
                  <div className="rolling-window-label">🔄 18mo Window</div>
                </div>
              )}

              {/* Visit blocks */}
              {timelineData.visits.map((visit) => (
                <div
                  key={visit.stay.id}
                  className={`visit-block ${visit.stay.completed ? 'completed' : 'current'}`}
                  style={{
                    left: `${visit.startPercent}%`,
                    width: `${visit.durationPercent}%`
                  }}
                  title={`${visit.stay.name}: ${visit.stay.start.toLocaleDateString()} - ${visit.stay.end.toLocaleDateString()}`}
                >
                  <div className="visit-pole start-pole"></div>
                  <div className="visit-flag start-flag">🚩</div>
                  <span className="visit-block-text">{visit.stay.name}: {visit.months}mo ({visit.days}d)</span>
                  <div className="visit-flag end-flag">🏁</div>
                  <div className="visit-pole end-pole"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="window-cards">
          {validation.windows.map((window, index) => (
            <div
              key={index}
              className={`window-card ${index === 0 ? 'critical' : ''}`}
              onClick={() => viewWindowByIndex(index)}
            >
              <div className="window-name">{index === 0 ? '🔴' : '⚪'} {window.name}</div>
              <div className="window-days">{window.days}d / {maxDaysIn18Months}d</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
