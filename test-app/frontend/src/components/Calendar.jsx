import React, { useState, useEffect } from 'react';
import moment from 'moment';
import _ from 'lodash';

// 🚨 PERFORMANCE ISSUE: Global calendar cache
let calendarCache = [];
let eventComputations = [];

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [loading, setLoading] = useState(true);

  // 🚨 PERFORMANCE ISSUE: Heavy calendar computation on every render
  const generateCalendarData = () => {
    console.log('🚨 Heavy calendar computation in render!');
    
    const calendar = {};
    
    // Generate massive calendar data
    for (let month = 0; month < 12; month++) {
      for (let day = 1; day <= 31; day++) {
        const dateKey = `${month}-${day}`;
        calendar[dateKey] = {
          events: new Array(50).fill(0).map((_, i) => ({
            id: i,
            title: `Event ${i}`,
            time: `${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60)}`,
            duration: Math.random() * 4,
            attendees: new Array(20).fill(0).map((_, j) => `Attendee_${j}`),
            resources: new Array(10).fill(0).map((_, j) => `Resource_${j}`),
            metadata: 'Event metadata '.repeat(30)
          })),
          conflicts: new Array(100).fill(0).map((_, i) => ({
            type: 'time_conflict',
            severity: Math.random() * 10,
            resolution: 'Conflict resolution '.repeat(20)
          })),
          analytics: generateDayAnalytics(month, day)
        };
      }
    }
    
    // Store in global cache (memory leak)
    calendarCache.push({
      timestamp: new Date(),
      data: calendar,
      size: JSON.stringify(calendar).length
    });
    
    return calendar;
  };

  function generateDayAnalytics(month, day) {
    const analytics = {};
    for (let i = 0; i < 500; i++) {
      analytics[`day_metric_${i}`] = Math.random() * 1000;
    }
    return analytics;
  }

  // Not memoized - runs every render
  const calendarData = generateCalendarData();

  // 🚨 PERFORMANCE ISSUE: Heavy event processing
  useEffect(() => {
    const processEvents = () => {
      const processed = [];
      
      for (let i = 0; i < 2000; i++) {
        const event = {
          id: i,
          title: `Calendar Event ${i}`,
          start: moment().add(Math.random() * 365, 'days').toDate(),
          end: moment().add(Math.random() * 365 + 1, 'days').toDate(),
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
          attendees: generateEventAttendees(),
          resources: generateEventResources(),
          analytics: generateEventAnalytics(),
          conflicts: detectEventConflicts(),
          recommendations: generateEventRecommendations()
        };
        
        processed.push(event);
      }
      
      setEvents(processed);
      setLoading(false);
    };

    processEvents();
  }, [selectedDate, view]); // Causes re-processing on every date/view change

  function generateEventAttendees() {
    return new Array(30).fill(0).map((_, i) => ({
      id: i,
      name: `Attendee_${i}`,
      email: `attendee${i}@test.com`,
      availability: Math.random() > 0.7,
      preferences: new Array(10).fill(0).map((_, j) => `Pref_${j}`),
      analytics: new Array(50).fill(0).map((_, j) => ({
        metric: `attendee_metric_${j}`,
        value: Math.random() * 100
      }))
    }));
  }

  function generateEventResources() {
    return new Array(15).fill(0).map((_, i) => ({
      id: i,
      name: `Resource_${i}`,
      type: 'conference_room',
      capacity: Math.floor(Math.random() * 50) + 1,
      cost: Math.random() * 1000,
      utilization: Math.random() * 100,
      maintenance: new Array(20).fill(0).map((_, j) => ({
        date: moment().add(j, 'days').toISOString(),
        type: 'scheduled_maintenance',
        duration: Math.random() * 8
      }))
    }));
  }

  function generateEventAnalytics() {
    const analytics = {};
    for (let i = 0; i < 200; i++) {
      analytics[`event_metric_${i}`] = {
        value: Math.random() * 1000,
        trend: Math.random() * 50 - 25,
        forecast: new Array(30).fill(0).map(() => Math.random() * 100),
        correlations: new Array(10).fill(0).map((_, j) => ({
          variable: `Var_${j}`,
          correlation: Math.random() * 2 - 1
        }))
      };
    }
    return analytics;
  }

  function detectEventConflicts() {
    return new Array(50).fill(0).map((_, i) => ({
      id: i,
      type: 'scheduling_conflict',
      severity: Math.random() * 10,
      description: 'Event conflict description '.repeat(15),
      resolution: 'Conflict resolution strategy '.repeat(20),
      alternatives: new Array(8).fill(0).map((_, j) => ({
        option: `Alternative_${j}`,
        score: Math.random() * 100,
        details: 'Alternative details '.repeat(10)
      }))
    }));
  }

  function generateEventRecommendations() {
    return new Array(25).fill(0).map((_, i) => ({
      id: i,
      type: 'optimization',
      priority: Math.floor(Math.random() * 5) + 1,
      suggestion: `Event suggestion ${i}`,
      impact: Math.random() * 100,
      effort: Math.random() * 10,
      details: 'Event recommendation details '.repeat(20)
    }));
  }

  // 🚨 PERFORMANCE ISSUE: Heavy render with all events
  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h1>Calendar ({events.length} events)</h1>
        <div className="calendar-controls">
          <button onClick={() => setView('month')}>Month</button>
          <button onClick={() => setView('week')}>Week</button>
          <button onClick={() => setView('day')}>Day</button>
          <span>Cache entries: {calendarCache.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading calendar data...</div>
      ) : (
        <div className="calendar-content">
          {/* 🚨 ISSUE: Rendering all events without virtualization */}
          <div className="events-grid">
            {events.slice(0, 100).map((event, index) => (
              <div key={index} className="calendar-event">
                <h3>{event.title}</h3>
                <p>Start: {moment(event.start).format('YYYY-MM-DD HH:mm')}</p>
                <p>Attendees: {event.attendees?.length}</p>
                <p>Resources: {event.resources?.length}</p>
                <p>Analytics: {Object.keys(event.analytics || {}).length}</p>
                <p>Conflicts: {event.conflicts?.length}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚨 Hidden expensive data */}
      <div style={{ display: 'none' }}>
        Calendar data: {Object.keys(calendarData).length} days
      </div>
    </div>
  );
};

export default Calendar;
