import React, { useRef, useState } from 'react';
import { getMonthsArray, dateToPosition, positionToDate, calculateCriticalWindow } from '../utils/dateUtils';
import VisitBar from './VisitBar';

const Timeline = ({ stays, visaStart, visaEnd, maxDaysIn18Months, daysIn18Months, onUpdateStay, onDeleteStay, showWindow, currentViewedWindow }) => {
  const timelineRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  const months = getMonthsArray(visaStart, visaEnd);

  const handleMouseDown = (e, stayId, type, handle = null) => {
    const stay = stays.find(s => s.id === stayId);
    if (stay.completed) return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const stayBar = e.currentTarget.parentElement || e.currentTarget;
    const rect = stayBar.getBoundingClientRect();

    setDragState({
      type,
      stayId,
      startX: e.clientX,
      startLeft: ((rect.left - timelineRect.left) / timelineRect.width) * 100,
      stayWidth: (rect.width / timelineRect.width) * 100,
      handle,
      timelineRect
    });

    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!dragState) return;

    const stay = stays.find(s => s.id === dragState.stayId);
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaPercent = (deltaX / timelineRect.width) * 100;

    if (dragState.type === 'move') {
      const newLeft = Math.max(0, Math.min(100, dragState.startLeft + deltaPercent));
      const newStart = positionToDate(newLeft, visaStart, visaEnd);
      const newEnd = positionToDate(newLeft + dragState.stayWidth, visaStart, visaEnd);

      // Only restrict starting before visa start, allow planning beyond visa end
      if (newStart >= visaStart) {
        onUpdateStay(dragState.stayId, { start: newStart, end: newEnd });
      }
    } else if (dragState.type === 'resize') {
      if (dragState.handle === 'start') {
        const currentStart = dateToPosition(stay.start, visaStart, visaEnd);
        const newStart = Math.max(0, Math.min(dateToPosition(stay.end, visaStart, visaEnd) - 1, currentStart + deltaPercent));
        const newStartDate = positionToDate(newStart, visaStart, visaEnd);

        // Only restrict starting before visa start
        if (newStartDate >= visaStart && newStartDate < stay.end) {
          onUpdateStay(dragState.stayId, { start: newStartDate });
          setDragState({ ...dragState, startX: e.clientX });
        }
      } else if (dragState.handle === 'end') {
        const currentEnd = dateToPosition(stay.end, visaStart, visaEnd);
        const newEnd = Math.max(dateToPosition(stay.start, visaStart, visaEnd) + 1, Math.min(100, currentEnd + deltaPercent));
        const newEndDate = positionToDate(newEnd, visaStart, visaEnd);

        // Allow extending beyond visa end (planning for new visa)
        if (newEndDate > stay.start) {
          onUpdateStay(dragState.stayId, { end: newEndDate });
          setDragState({ ...dragState, startX: e.clientX });
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  React.useEffect(() => {
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragState]);

  // Calculate critical rolling window (18 months from latest visit)
  const criticalWindow = calculateCriticalWindow(stays, daysIn18Months);
  const windowToDisplay = currentViewedWindow || criticalWindow;

  return (
    <div className="timeline-container">
      <h3 className="timeline-title">📅 Timeline View</h3>
      <div className="timeline-wrapper">
        <div className="timeline" ref={timelineRef}>
          <div className="month-labels">
            {months.map((month, index) => (
              <div
                key={index}
                className={`month-label ${month.getMonth() === 0 ? 'year-start' : ''}`}
              >
                {month.getMonth() === 0
                  ? month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : month.toLocaleDateString('en-US', { month: 'short' })}
              </div>
            ))}
          </div>

          <div className="timeline-grid">
            {months.map((month, index) => (
              <div
                key={index}
                className={`month-column ${month.getMonth() === 0 ? 'year-start' : ''}`}
              />
            ))}
          </div>

          <div className="stays-layer">
            {showWindow && windowToDisplay && (
              <div
                className={`rolling-window-overlay ${
                  windowToDisplay.days > maxDaysIn18Months
                    ? 'invalid'
                    : windowToDisplay.days > 330
                    ? 'warning'
                    : 'valid'
                }`}
                style={{
                  left: `${dateToPosition(windowToDisplay.start, visaStart, visaEnd)}%`,
                  width: `${dateToPosition(windowToDisplay.end, visaStart, visaEnd) - dateToPosition(windowToDisplay.start, visaStart, visaEnd)}%`
                }}
              >
                <div className="window-label">🔄 18-Month Window</div>
                <div className="window-stats">
                  <div className="window-stats-title">{windowToDisplay.days} / {maxDaysIn18Months} days</div>
                  <div className="window-stats-subtitle">
                    {maxDaysIn18Months - windowToDisplay.days >= 0
                      ? `${maxDaysIn18Months - windowToDisplay.days} days buffer`
                      : `${Math.abs(maxDaysIn18Months - windowToDisplay.days)} days OVER`}
                  </div>
                </div>
              </div>
            )}

            {stays.map((stay, index) => (
              <VisitBar
                key={stay.id}
                stay={stay}
                index={index}
                visaStart={visaStart}
                visaEnd={visaEnd}
                onMouseDown={handleMouseDown}
                onDelete={onDeleteStay}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
