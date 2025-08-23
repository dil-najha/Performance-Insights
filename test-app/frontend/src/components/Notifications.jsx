import React, { useState, useEffect } from 'react';

let notificationsCache = [];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚨 Heavy notifications processing
  const generateNotifications = () => {
    console.log('🚨 Heavy notifications processing!');
    
    const data = [];
    for (let i = 0; i < 800; i++) {
      data.push({
        id: i,
        title: `Notification ${i}`,
        message: `This is notification message ${i}`,
        type: ['info', 'warning', 'error', 'success'][Math.floor(Math.random() * 4)],
        priority: Math.floor(Math.random() * 5) + 1,
        timestamp: new Date(),
        read: Math.random() > 0.7,
        metadata: new Array(50).fill(0).map((_, j) => ({
          key: `meta_${j}`,
          value: `value_${j}`,
          description: 'Notification metadata description '.repeat(20)
        })),
        analytics: new Array(100).fill(0).map((_, j) => ({
          metric: `notification_metric_${j}`,
          value: Math.random() * 1000,
          impact: Math.random() * 100
        })),
        relatedActions: new Array(30).fill(0).map((_, j) => ({
          action: `Action_${j}`,
          description: 'Related action description '.repeat(15),
          priority: Math.floor(Math.random() * 5) + 1
        }))
      });
    }

    notificationsCache.push({ timestamp: new Date(), data });
    return data;
  };

  const notificationData = generateNotifications();

  useEffect(() => {
    setTimeout(() => {
      setNotifications(notificationData);
      setLoading(false);
    }, 700);
  }, []);

  // 🚨 Heavy filtering computation on every render
  const unreadNotifications = notifications.filter(n => !n.read);
  const priorityNotifications = notifications.filter(n => n.priority >= 4);

  if (loading) {
    return <div className="loading">Loading notifications... ({notificationsCache.length} cache entries)</div>;
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications ({notifications.length})</h1>
        <div className="notification-stats">
          <span>Unread: {unreadNotifications.length}</span>
          <span>High Priority: {priorityNotifications.length}</span>
        </div>
      </div>

      <div className="notifications-list">
        {notifications.slice(0, 50).map((notification, index) => (
          <div 
            key={index} 
            className={`notification ${notification.read ? 'read' : 'unread'} ${notification.type}`}
          >
            <h3>{notification.title}</h3>
            <p>{notification.message}</p>
            <div className="notification-metadata">
              <span>Type: {notification.type}</span>
              <span>Priority: {notification.priority}</span>
              <span>Metadata: {notification.metadata?.length}</span>
              <span>Analytics: {notification.analytics?.length}</span>
              <span>Actions: {notification.relatedActions?.length}</span>
            </div>
            <div className="notification-time">
              {notification.timestamp.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden expensive computation */}
      <div style={{ display: 'none' }}>
        Generated: {notificationData.length} notifications
        Filtered unread: {unreadNotifications.length}
        Filtered priority: {priorityNotifications.length}
      </div>
    </div>
  );
};

export default Notifications;
