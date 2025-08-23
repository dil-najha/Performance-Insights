import React, { useState, useEffect } from 'react';

let resourcesCache = [];

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🚨 Heavy computation
  const generateResourceData = () => {
    console.log('🚨 Heavy resources processing!');
    
    const data = [];
    for (let i = 0; i < 500; i++) {
      data.push({
        id: i,
        name: `Resource ${i}`,
        type: 'conference_room',
        utilization: new Array(365).fill(0).map(() => Math.random() * 100),
        analytics: new Array(200).fill(0).map((_, j) => ({
          metric: `resource_metric_${j}`,
          value: Math.random() * 1000,
          metadata: 'Resource analytics metadata '.repeat(20)
        })),
        maintenance: new Array(100).fill(0).map((_, j) => ({
          date: new Date(),
          type: 'scheduled',
          details: 'Maintenance details '.repeat(30)
        }))
      });
    }

    resourcesCache.push({ timestamp: new Date(), data });
    return data;
  };

  const resourceData = generateResourceData();

  useEffect(() => {
    setTimeout(() => {
      setResources(resourceData);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return <div className="loading">Loading resources... ({resourcesCache.length} cache entries)</div>;
  }

  return (
    <div className="resources-container">
      <h1>Resources ({resources.length})</h1>
      <div className="resource-grid">
        {resources.slice(0, 30).map((resource, index) => (
          <div key={index} className="resource-card">
            <h3>{resource.name}</h3>
            <p>Type: {resource.type}</p>
            <p>Utilization data: {resource.utilization?.length} points</p>
            <p>Analytics: {resource.analytics?.length}</p>
            <p>Maintenance: {resource.maintenance?.length}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
