import React, { useState, useEffect } from 'react';

let profileCache = [];

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🚨 Heavy profile computation
  const generateProfileData = () => {
    console.log('🚨 Heavy profile processing!');
    
    const profile = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      avatar: '/default-avatar.png',
      preferences: new Array(100).fill(0).map((_, i) => ({
        key: `pref_${i}`,
        value: Math.random() > 0.5,
        metadata: 'Preference metadata '.repeat(15)
      })),
      activityHistory: new Array(1000).fill(0).map((_, i) => ({
        action: `Action_${i}`,
        timestamp: new Date(),
        details: 'Activity details '.repeat(25),
        impact: Math.random() * 100
      })),
      analytics: new Array(500).fill(0).map((_, i) => ({
        metric: `profile_metric_${i}`,
        value: Math.random() * 1000,
        trend: Math.random() * 50 - 25,
        history: new Array(365).fill(0).map(() => Math.random() * 100)
      })),
      socialConnections: new Array(200).fill(0).map((_, i) => ({
        userId: i,
        strength: Math.random(),
        interactions: Math.floor(Math.random() * 1000),
        metadata: 'Connection metadata '.repeat(20)
      }))
    };

    profileCache.push({ timestamp: new Date(), profile });
    return profile;
  };

  const profileData = generateProfileData();

  useEffect(() => {
    setTimeout(() => {
      setUserProfile(profileData);
      setLoading(false);
    }, 600);
  }, []);

  if (loading) {
    return <div className="loading">Loading profile... ({profileCache.length} cache entries)</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <img src={userProfile.avatar} alt="Avatar" className="profile-avatar" />
        <h1 className="profile-name">{userProfile.name}</h1>
        <p className="profile-email">{userProfile.email}</p>
        
        <div className="profile-stats">
          <div>Preferences: {userProfile.preferences?.length}</div>
          <div>Activity History: {userProfile.activityHistory?.length}</div>
          <div>Analytics: {userProfile.analytics?.length}</div>
          <div>Connections: {userProfile.socialConnections?.length}</div>
        </div>

        <div className="profile-sections">
          <div className="preferences-section">
            <h3>Recent Preferences</h3>
            {userProfile.preferences?.slice(0, 10).map((pref, index) => (
              <div key={index} className="preference-item">
                {pref.key}: {pref.value ? 'Enabled' : 'Disabled'}
              </div>
            ))}
          </div>

          <div className="activity-section">
            <h3>Recent Activity</h3>
            {userProfile.activityHistory?.slice(0, 10).map((activity, index) => (
              <div key={index} className="activity-item">
                <strong>{activity.action}</strong>
                <span>Impact: {activity.impact?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
