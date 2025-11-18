import React from 'react';

const Controls = ({ onAddStay, onReset, showWindow, onToggleWindow, visaStart, visaEnd }) => {
  return (
    <div className="controls">
      <button className="button" onClick={onAddStay}>➕ Add Visit</button>
      <button className="button" onClick={onReset}>🔄 Reset</button>
      <button className="button" onClick={onToggleWindow}>
        {showWindow ? '👁️ Hide Window' : '👁️ Show Window'}
      </button>
      <div className="visa-info">
        <strong>Visa Valid:</strong> {visaStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {visaEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
};

export default Controls;
