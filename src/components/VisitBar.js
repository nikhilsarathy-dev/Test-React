import React from 'react';
import { dateToPosition, daysBetween } from '../utils/dateUtils';

const VisitBar = ({ stay, index, visaStart, visaEnd, onMouseDown, onDelete }) => {
  const leftPos = dateToPosition(stay.start, visaStart, visaEnd);
  const rightPos = dateToPosition(stay.end, visaStart, visaEnd);
  const days = daysBetween(stay.start, stay.end);

  return (
    <div
      className={`stay-bar ${stay.completed ? 'completed' : ''}`}
      style={{
        left: `${leftPos}%`,
        width: `${rightPos - leftPos}%`,
        top: `${index * 140}px`
      }}
      onMouseDown={(e) => !stay.completed && onMouseDown(e, stay.id, 'move')}
    >
      {!stay.completed && (
        <>
          <div
            className="handle left"
            onMouseDown={(e) => {
              e.stopPropagation();
              onMouseDown(e, stay.id, 'resize', 'start');
            }}
          >
            ⫷
          </div>
          <div
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(stay.id);
            }}
          >
            ✕
          </div>
        </>
      )}

      <div className="stay-content">
        <div className="stay-name">{stay.name}</div>
        <div className="stay-dates">
          <div className="date-badge start-date">
            <div className="date-label">START</div>
            <div className="date-value">{stay.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div className="date-separator">→</div>
          <div className="date-badge end-date">
            <div className="date-label">END</div>
            <div className="date-value">{stay.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        <div className="stay-duration">{days} days (~{(days / 30).toFixed(1)} mo)</div>
      </div>

      {!stay.completed && (
        <div
          className="handle right"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDown(e, stay.id, 'resize', 'end');
          }}
        >
          ⫸
        </div>
      )}
    </div>
  );
};

export default VisitBar;
