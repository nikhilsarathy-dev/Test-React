import React, { useMemo } from 'react';
import { calculateAllWindows, daysBetween } from '../utils/dateUtils';

const Dashboard = ({ stays, visaStart, visaEnd, maxDaysIn18Months, daysIn18Months, currentViewedWindow, setCurrentViewedWindow }) => {
  const validation = useMemo(() => {
    // Check visa validity
    const visaValidityIssue = stays.some(stay => stay.end > visaEnd);

    // Calculate total days
    const totalDaysAllVisits = stays.reduce((sum, stay) => sum + daysBetween(stay.start, stay.end), 0);

    // Calculate windows
    const windows = calculateAllWindows(stays, daysIn18Months);
    const criticalWindow = windows.reduce((max, window) => window.days > max.days ? window : max, windows[0] || { days: 0 });

    const maxDaysInWindow = criticalWindow?.days || 0;
    const percentage = (maxDaysInWindow / maxDaysIn18Months) * 100;
    const monthsConsumed = (maxDaysInWindow / 30).toFixed(1);
    const totalMonths = (totalDaysAllVisits / 30).toFixed(1);

    let statusClass, statusTitle, statusMessage;

    if (visaValidityIssue) {
      statusClass = 'invalid';
      statusTitle = '❌ Exceeds Visa Validity';
      statusMessage = 'Plan extends beyond visa period';
    } else if (maxDaysInWindow > maxDaysIn18Months) {
      statusClass = 'invalid';
      statusTitle = '❌ Exceeds Limit';
      statusMessage = `${maxDaysInWindow} days (${(maxDaysInWindow - maxDaysIn18Months)} over)`;
    } else if (maxDaysInWindow > 330) {
      statusClass = 'warning';
      statusTitle = '⚠️ Very Close to Limit';
      statusMessage = `${maxDaysInWindow} days (${maxDaysIn18Months - maxDaysInWindow} buffer)`;
    } else {
      statusClass = 'valid';
      statusTitle = '✅ Within Limits';
      statusMessage = `${maxDaysInWindow} days (${maxDaysIn18Months - maxDaysInWindow} buffer)`;
    }

    return {
      statusClass,
      statusTitle,
      statusMessage,
      maxDaysInWindow,
      totalDaysAllVisits,
      monthsConsumed,
      totalMonths,
      percentage,
      criticalWindow,
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
          <div className="metric-card">
            <div className="metric-label">Critical Window (Max in 18mo)</div>
            <div className="metric-value">{validation.maxDaysInWindow}d</div>
            <div className="metric-sublabel">~{validation.monthsConsumed} mo</div>
            <div className="metric-note">↑ Changes when visits are spaced</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Days (All Visits)</div>
            <div className="metric-value">{validation.totalDaysAllVisits}d</div>
            <div className="metric-sublabel">~{validation.totalMonths} mo</div>
            <div className="metric-note">↑ Sum of all visit durations</div>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(validation.percentage, 100)}%` }}>
            {validation.maxDaysInWindow} / {maxDaysIn18Months}
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
                  {visit.stay.name}: {visit.months}mo ({visit.days}d)
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
