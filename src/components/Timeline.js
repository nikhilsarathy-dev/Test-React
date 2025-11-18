import React, { useRef, useState } from 'react';
import { getMonthsArray, dateToPosition, positionToDate, calculateCriticalWindow } from '../utils/dateUtils';
import VisitBar from './VisitBar';

const Timeline = ({ stays, visaStart, visaEnd, maxDaysIn18Months, daysIn18Months, onUpdateStay, onDeleteStay, showWindow, currentViewedWindow, onAddStay, onReset, onToggleWindow }) => {
  const timelineRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  // Calculate dynamic timeline end (extend beyond visa if needed)
  const getTimelineEnd = () => {
    if (stays.length === 0) return visaEnd;
    const latestVisitEnd = stays.reduce((max, stay) => stay.end > max ? stay.end : max, visaEnd);
    // Add 6 months buffer beyond latest visit for planning
    const bufferEnd = new Date(latestVisitEnd);
    bufferEnd.setMonth(bufferEnd.getMonth() + 6);
    return bufferEnd > visaEnd ? bufferEnd : visaEnd;
  };

  const timelineEnd = getTimelineEnd();
  const months = getMonthsArray(visaStart, timelineEnd);

  const handleMouseDown = (e, stayId, type, handle = null) => {
    const stay = stays.find(s => s.id === stayId);
    if (stay.completed) return;

    // Calculate position from the actual stay dates, not DOM position
    const stayStartPercent = dateToPosition(stay.start, visaStart, timelineEnd);
    const stayEndPercent = dateToPosition(stay.end, visaStart, timelineEnd);
    const stayWidth = stayEndPercent - stayStartPercent;

    setDragState({
      type,
      stayId,
      startX: e.clientX,
      startLeft: stayStartPercent,
      stayWidth: stayWidth,
      handle,
      originalStart: stay.start,
      originalEnd: stay.end
    });

    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!dragState || !timelineRef.current) return;

    const stay = stays.find(s => s.id === dragState.stayId);
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaPercent = (deltaX / timelineRect.width) * 100;

    if (dragState.type === 'move') {
      const newLeft = dragState.startLeft + deltaPercent;
      const newStart = positionToDate(newLeft, visaStart, timelineEnd);
      const newEnd = positionToDate(newLeft + dragState.stayWidth, visaStart, timelineEnd);

      // Only restrict starting before visa start
      if (newStart >= visaStart) {
        onUpdateStay(dragState.stayId, { start: newStart, end: newEnd });
      }
    } else if (dragState.type === 'resize') {
      if (dragState.handle === 'start') {
        const currentStart = dateToPosition(stay.start, visaStart, timelineEnd);
        const newStart = Math.max(0, Math.min(dateToPosition(stay.end, visaStart, timelineEnd) - 1, currentStart + deltaPercent));
        const newStartDate = positionToDate(newStart, visaStart, timelineEnd);

        // Only restrict starting before visa start
        if (newStartDate >= visaStart && newStartDate < stay.end) {
          onUpdateStay(dragState.stayId, { start: newStartDate });
          setDragState({ ...dragState, startX: e.clientX });
        }
      } else if (dragState.handle === 'end') {
        const currentEnd = dateToPosition(stay.end, visaStart, timelineEnd);
        const newEnd = Math.max(dateToPosition(stay.start, visaStart, timelineEnd) + 1, Math.min(100, currentEnd + deltaPercent));
        const newEndDate = positionToDate(newEnd, visaStart, timelineEnd);

        // Allow extending beyond visa end
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
      <div className="timeline-header">
        <h3 className="timeline-title">📅 Timeline View</h3>
        <div className="timeline-controls">
          <button className="button" onClick={onAddStay}>➕ Add Visit</button>
          <button className="button" onClick={onReset}>🔄 Reset</button>
          <button className="button" onClick={onToggleWindow}>
            {showWindow ? '👁️ Hide Window' : '👁️ Show Window'}
          </button>
        </div>
      </div>
      <div className="timeline-wrapper">
        <div
          className="timeline"
          ref={timelineRef}
          style={{ '--month-count': months.length }}
        >
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
                  left: `${dateToPosition(windowToDisplay.start, visaStart, timelineEnd)}%`,
                  width: `${dateToPosition(windowToDisplay.end, visaStart, timelineEnd) - dateToPosition(windowToDisplay.start, visaStart, timelineEnd)}%`
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
                visaEnd={timelineEnd}
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
