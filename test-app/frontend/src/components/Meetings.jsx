import React, { useState, useEffect } from 'react';

// 🚨 Global memory leak
let meetingsData = [];

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚨 Heavy computation in render
  const processAllMeetings = () => {
    console.log('🚨 Heavy meetings processing!');
    
    const processed = [];
    for (let i = 0; i < 1000; i++) {
      processed.push({
        id: i,
        title: `Meeting ${i}`,
        attendees: new Array(20).fill(0).map((_, j) => `Attendee_${j}`),
        analytics: new Array(100).fill(0).map((_, j) => ({
          metric: `meeting_metric_${j}`,
          value: Math.random() * 1000
        })),
        recommendations: new Array(50).fill(0).map((_, j) => ({
          suggestion: `Meeting suggestion ${j}`,
          details: 'Meeting recommendation details '.repeat(25)
        }))
      });
    }

    meetingsData.push({ timestamp: new Date(), data: processed });
    return processed;
  };

  const processedMeetings = processAllMeetings();

  useEffect(() => {
    // Simulate heavy async processing
    setTimeout(() => {
      setMeetings(processedMeetings);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="loading">Loading meetings... ({meetingsData.length} cache entries)</div>;
  }

  return (
    <div className="meetings-container">
      <h1>Meetings ({meetings.length})</h1>
      <div className="meetings-list">
        {meetings.slice(0, 50).map((meeting, index) => (
          <div key={index} className="meeting-card">
            <h3>{meeting.title}</h3>
            <p>Attendees: {meeting.attendees?.length}</p>
            <p>Analytics: {meeting.analytics?.length}</p>
            <p>Recommendations: {meeting.recommendations?.length}</p>
          </div>
        ))}
      </div>
      
      {/* Hidden expensive data */}
      <div style={{ display: 'none' }}>
        Processed: {processedMeetings.length} meetings
      </div>
    </div>
  );
};

export default Meetings;
