import React, { useState } from 'react';
import './styles/App.css';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import Timeline from './components/Timeline';

const VISA_START = new Date('2024-10-01');
const VISA_END = new Date('2027-09-30');
const MAX_DAYS_IN_18_MONTHS = 365;
const DAYS_IN_18_MONTHS = 548;

const defaultStays = [
  {
    id: 1,
    name: 'Stay #1',
    start: new Date('2024-10-28'),
    end: new Date('2025-03-22'),
    completed: true
  },
  {
    id: 2,
    name: 'Stay #2',
    start: new Date('2025-07-27'),
    end: new Date('2026-01-07'),
    completed: false
  }
];

function App() {
  const [stays, setStays] = useState(defaultStays);
  const [nextId, setNextId] = useState(3);
  const [showWindow, setShowWindow] = useState(true);
  const [currentViewedWindow, setCurrentViewedWindow] = useState(null);

  const addNewStay = () => {
    const lastStay = stays[stays.length - 1];
    const newStart = new Date(lastStay.end);
    newStart.setDate(newStart.getDate() + 30);
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 3);

    if (newEnd > VISA_END) {
      alert('Cannot add stay beyond visa validity period.');
      return;
    }

    setStays([...stays, {
      id: nextId,
      name: `Stay #${nextId}`,
      start: newStart,
      end: newEnd,
      completed: false
    }]);
    setNextId(nextId + 1);
  };

  const deleteStay = (stayId) => {
    const stay = stays.find(s => s.id === stayId);
    if (stay && !stay.completed) {
      if (window.confirm(`Delete ${stay.name}?`)) {
        setStays(stays.filter(s => s.id !== stayId));
      }
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to default stays?')) {
      setStays(defaultStays);
      setNextId(3);
      setCurrentViewedWindow(null);
    }
  };

  const updateStay = (stayId, updates) => {
    setStays(stays.map(stay =>
      stay.id === stayId ? { ...stay, ...updates } : stay
    ));
  };

  return (
    <div className="app">
      <Header />
      <div className="content">
        <Controls
          onAddStay={addNewStay}
          onReset={resetToDefault}
          showWindow={showWindow}
          onToggleWindow={() => setShowWindow(!showWindow)}
          visaStart={VISA_START}
          visaEnd={VISA_END}
        />
        <Dashboard
          stays={stays}
          visaStart={VISA_START}
          visaEnd={VISA_END}
          maxDaysIn18Months={MAX_DAYS_IN_18_MONTHS}
          daysIn18Months={DAYS_IN_18_MONTHS}
          currentViewedWindow={currentViewedWindow}
          setCurrentViewedWindow={setCurrentViewedWindow}
        />
        <Timeline
          stays={stays}
          visaStart={VISA_START}
          visaEnd={VISA_END}
          maxDaysIn18Months={MAX_DAYS_IN_18_MONTHS}
          daysIn18Months={DAYS_IN_18_MONTHS}
          onUpdateStay={updateStay}
          onDeleteStay={deleteStay}
          showWindow={showWindow}
          currentViewedWindow={currentViewedWindow}
        />
      </div>
    </div>
  );
}

export default App;
