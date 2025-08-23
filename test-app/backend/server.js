import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import http from 'http';
import _ from 'lodash';
import { format, addDays, subDays } from 'date-fns';

// 🚨 PERFORMANCE ISSUE #1: Global variables causing memory leaks
let globalUserCache = {};
let sessionData = [];
let notificationQueue = [];
let heavyComputationResults = [];

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 🚨 ISSUE: Unnecessarily large limit

// 🚨 PERFORMANCE ISSUE #2: Database without connection pooling
const db = new sqlite3.Database('test_app.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database with heavy operations
function initializeDatabase() {
  // 🚨 PERFORMANCE ISSUE #3: Synchronous database operations
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profile_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`);

    // Meetings table
    db.run(`CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      created_by INTEGER,
      location TEXT,
      resources TEXT,
      attendees TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )`);

    // Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      read_status INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 1,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Resources table
    db.run(`CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      availability TEXT,
      capacity INTEGER,
      location TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Calendar events table
    db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      all_day INTEGER DEFAULT 0,
      recurring_pattern TEXT,
      category TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // 🚨 PERFORMANCE ISSUE #4: Insert massive test data synchronously
    insertTestData();
  });
}

// 🚨 PERFORMANCE ISSUE #5: Heavy data insertion without batching
function insertTestData() {
  console.log('Inserting test data...');
  
  // Insert users
  for (let i = 1; i <= 1000; i++) {
    const hashedPassword = bcrypt.hashSync('password123', 10); // 🚨 ISSUE: Synchronous hashing
    const profileData = JSON.stringify({
      firstName: `User${i}`,
      lastName: `Test${i}`,
      department: `Department${i % 10}`,
      avatar: `https://randomuser.me/api/portraits/lego/${i % 9}.jpg`,
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      },
      skills: generateRandomSkills(),
      projects: generateRandomProjects(i)
    });

    db.run(`INSERT OR IGNORE INTO users (username, email, password, profile_data) 
            VALUES (?, ?, ?, ?)`, 
            [`user${i}`, `user${i}@testapp.com`, hashedPassword, profileData]);
  }

  // Insert massive amounts of calendar events
  for (let i = 1; i <= 5000; i++) {
    const startTime = addDays(new Date(), Math.floor(Math.random() * 365) - 180);
    const endTime = addDays(startTime, Math.random() * 3);
    
    db.run(`INSERT INTO calendar_events (user_id, title, description, start_time, end_time, category, color)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              Math.floor(Math.random() * 1000) + 1,
              `Event ${i}`,
              `Description for event ${i} with lots of detail that makes the database heavy`,
              startTime.toISOString(),
              endTime.toISOString(),
              ['meeting', 'personal', 'work', 'deadline'][Math.floor(Math.random() * 4)],
              ['#ff0000', '#00ff00', '#0000ff', '#ffff00'][Math.floor(Math.random() * 4)]
            ]);
  }

  // Insert resources
  for (let i = 1; i <= 500; i++) {
    db.run(`INSERT INTO resources (name, type, description, capacity, location, metadata)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
              `Resource ${i}`,
              ['conference_room', 'projector', 'laptop', 'whiteboard'][Math.floor(Math.random() * 4)],
              `Description for resource ${i}`,
              Math.floor(Math.random() * 50) + 1,
              `Building ${Math.floor(Math.random() * 5) + 1}, Floor ${Math.floor(Math.random() * 10) + 1}`,
              JSON.stringify({ features: generateRandomFeatures(), cost: Math.random() * 1000 })
            ]);
  }

  console.log('Test data insertion completed');
}

// 🚨 PERFORMANCE ISSUE #6: Heavy computation in utility functions
function generateRandomSkills() {
  const skills = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker'];
  const result = [];
  
  // Intentionally inefficient skill generation
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < skills.length; j++) {
      if (Math.random() > 0.7) {
        // Inefficient duplicate checking
        let isDuplicate = false;
        for (let k = 0; k < result.length; k++) {
          if (result[k] === skills[j]) {
            isDuplicate = true;
            break;
          }
        }
        if (!isDuplicate) {
          result.push(skills[j]);
        }
      }
    }
  }
  return result;
}

function generateRandomProjects(userId) {
  const projects = [];
  for (let i = 0; i < 50; i++) { // 🚨 ISSUE: Generating too many projects
    projects.push({
      id: i,
      name: `Project ${i} for User ${userId}`,
      status: ['active', 'completed', 'on-hold'][Math.floor(Math.random() * 3)],
      description: 'A'.repeat(1000), // 🚨 ISSUE: Unnecessarily large descriptions
      team: new Array(10).fill(0).map((_, idx) => `User${userId + idx}`),
      milestones: new Array(20).fill(0).map((_, idx) => ({
        id: idx,
        title: `Milestone ${idx}`,
        description: 'B'.repeat(500)
      }))
    });
  }
  return projects;
}

function generateRandomFeatures() {
  return new Array(30).fill(0).map((_, i) => `Feature ${i}`); // 🚨 ISSUE: Too many features
}

// 🚨 PERFORMANCE ISSUE #7: Authentication without proper middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  // 🚨 ISSUE: Synchronous token verification
  try {
    const user = jwt.verify(token, 'your_secret_key');
    req.user = user;
    
    // 🚨 ISSUE: Heavy operations in middleware
    for (let i = 0; i < 10000; i++) {
      Math.random() * Math.random(); // Unnecessary computation
    }
    
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

// API Routes

// 🚨 PERFORMANCE ISSUE #8: Login with inefficient database query
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // 🚨 ISSUE: No prepared statements, vulnerable to SQL injection
  db.get(`SELECT * FROM users WHERE username = '${username}'`, async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🚨 ISSUE: Synchronous password comparison
    const isValidPassword = bcrypt.compareSync(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🚨 ISSUE: Heavy computation during login
    for (let i = 0; i < 100000; i++) {
      heavyComputationResults.push(Math.random() * i);
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, 'your_secret_key');
    
    // 🚨 ISSUE: Update last_login without async/await
    db.run(`UPDATE users SET last_login = ? WHERE id = ?`, [new Date().toISOString(), user.id]);
    
    res.json({ token, user: { id: user.id, username: user.username } });
  });
});

// 🚨 PERFORMANCE ISSUE #9: N+1 Query Problem - Get all users with their meetings
app.get('/api/users', authenticateToken, (req, res) => {
  // First query to get all users
  db.all(`SELECT id, username, email, profile_data FROM users LIMIT 100`, (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const usersWithMeetings = [];
    let processedUsers = 0;

    // 🚨 MAJOR ISSUE: N+1 Query - One query per user
    users.forEach((user, index) => {
      // Query meetings for each user separately
      db.all(`SELECT * FROM meetings WHERE created_by = ?`, [user.id], (err, meetings) => {
        if (err) {
          console.error('Error fetching meetings:', err);
          meetings = [];
        }

        // 🚨 ISSUE: Query calendar events for each user separately  
        db.all(`SELECT * FROM calendar_events WHERE user_id = ? ORDER BY start_time DESC LIMIT 10`, 
               [user.id], (err, events) => {
          if (err) {
            console.error('Error fetching events:', err);
            events = [];
          }

          // 🚨 ISSUE: Query notifications for each user separately
          db.all(`SELECT * FROM notifications WHERE user_id = ? AND read_status = 0 ORDER BY created_at DESC`, 
                 [user.id], (err, notifications) => {
            if (err) {
              console.error('Error fetching notifications:', err);
              notifications = [];
            }

            // 🚨 ISSUE: Heavy processing for each user
            const processedUser = {
              ...user,
              profile_data: JSON.parse(user.profile_data || '{}'),
              meetings,
              recentEvents: events,
              unreadNotifications: notifications,
              computedStats: computeUserStats(user, meetings, events), // Heavy computation
              socialGraph: generateSocialGraph(user.id) // Another heavy computation
            };

            usersWithMeetings.push(processedUser);
            processedUsers++;

            // Send response when all users are processed
            if (processedUsers === users.length) {
              res.json(usersWithMeetings);
            }
          });
        });
      });
    });

    // Handle empty users array
    if (users.length === 0) {
      res.json([]);
    }
  });
});

// 🚨 PERFORMANCE ISSUE #10: Heavy computation functions
function computeUserStats(user, meetings, events) {
  // Intentionally inefficient statistics computation
  const stats = {
    totalMeetings: meetings.length,
    totalEvents: events.length,
    activityScore: 0,
    collaborationIndex: 0,
    productivityMetrics: {}
  };

  // Heavy nested loops
  for (let i = 0; i < meetings.length; i++) {
    for (let j = 0; j < events.length; j++) {
      // Unnecessary computation
      for (let k = 0; k < 1000; k++) {
        stats.activityScore += Math.sin(i + j + k) * Math.cos(i * j * k);
      }
    }
  }

  return stats;
}

function generateSocialGraph(userId) {
  const connections = [];
  
  // 🚨 ISSUE: Generating massive social graph data
  for (let i = 1; i <= 1000; i++) {
    if (i !== userId) {
      connections.push({
        userId: i,
        connectionStrength: Math.random(),
        sharedProjects: Math.floor(Math.random() * 20),
        communicationFrequency: Math.random() * 100,
        collaborationHistory: new Array(50).fill(0).map((_, idx) => ({
          date: subDays(new Date(), idx).toISOString(),
          activity: `Activity ${idx}`,
          impact: Math.random()
        }))
      });
    }
  }

  return connections;
}

// 🚨 PERFORMANCE ISSUE #11: Calendar endpoint with heavy queries
app.get('/api/calendar/:userId', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  // 🚨 ISSUE: Complex query without indexes
  const query = `
    SELECT ce.*, u.username, u.profile_data
    FROM calendar_events ce
    JOIN users u ON ce.user_id = u.id
    WHERE ce.user_id = ? 
    AND ce.start_time >= ?
    AND ce.end_time <= ?
    ORDER BY ce.start_time ASC
  `;

  db.all(query, [userId, startDate, endDate], (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // 🚨 ISSUE: Heavy post-processing of each event
    const processedEvents = events.map(event => {
      // Heavy computation for each event
      const attendeesData = computeAttendeesAnalytics(event);
      const conflictAnalysis = analyzeTimeConflicts(event, events);
      const resourceRequirements = computeResourceRequirements(event);

      return {
        ...event,
        attendeesData,
        conflictAnalysis,
        resourceRequirements,
        weatherForecast: getWeatherForEvent(event), // Expensive API call simulation
        travelTime: computeTravelTime(event.location),
        smartSuggestions: generateSmartSuggestions(event)
      };
    });

    res.json(processedEvents);
  });
});

// More heavy computation functions
function computeAttendeesAnalytics(event) {
  // Simulate heavy attendee analysis
  const analytics = {};
  for (let i = 0; i < 10000; i++) {
    analytics[`metric_${i}`] = Math.random() * i;
  }
  return analytics;
}

function analyzeTimeConflicts(currentEvent, allEvents) {
  const conflicts = [];
  // Inefficient O(n²) conflict detection
  for (let i = 0; i < allEvents.length; i++) {
    for (let j = i + 1; j < allEvents.length; j++) {
      // Heavy date comparison logic
      const event1 = allEvents[i];
      const event2 = allEvents[j];
      
      for (let k = 0; k < 100; k++) { // Unnecessary loop
        if (new Date(event1.start_time) < new Date(event2.end_time) &&
            new Date(event1.end_time) > new Date(event2.start_time)) {
          conflicts.push({ event1: event1.id, event2: event2.id, severity: Math.random() });
        }
      }
    }
  }
  return conflicts;
}

function computeResourceRequirements(event) {
  // Simulate expensive resource computation
  const requirements = [];
  for (let i = 0; i < 1000; i++) {
    requirements.push({
      resourceType: `Type_${i}`,
      quantity: Math.floor(Math.random() * 100),
      priority: Math.random(),
      alternatives: new Array(20).fill(0).map((_, idx) => `Alternative_${idx}`)
    });
  }
  return requirements;
}

function getWeatherForEvent(event) {
  // Simulate heavy weather API processing
  const weatherData = {
    temperature: Math.random() * 40,
    humidity: Math.random() * 100,
    pressure: 1000 + Math.random() * 50,
    forecast: []
  };

  // Generate 7-day forecast with heavy computation
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 24; j++) { // Hourly data
      weatherData.forecast.push({
        hour: j,
        day: i,
        temperature: Math.random() * 40,
        conditions: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
        windSpeed: Math.random() * 50,
        humidity: Math.random() * 100
      });
    }
  }

  return weatherData;
}

function computeTravelTime(location) {
  // Simulate heavy travel computation
  const travelOptions = [];
  for (let i = 0; i < 100; i++) {
    travelOptions.push({
      mode: ['car', 'bus', 'train', 'walk'][Math.floor(Math.random() * 4)],
      duration: Math.random() * 120,
      cost: Math.random() * 50,
      route: new Array(20).fill(0).map((_, idx) => `Stop_${idx}`)
    });
  }
  return travelOptions;
}

function generateSmartSuggestions(event) {
  // Heavy AI-like suggestions generation
  const suggestions = [];
  for (let i = 0; i < 500; i++) {
    suggestions.push({
      type: ['time_optimization', 'resource_suggestion', 'attendee_recommendation'][Math.floor(Math.random() * 3)],
      suggestion: `Smart suggestion ${i} based on complex analysis`,
      confidence: Math.random(),
      impact: Math.random() * 10,
      reasoning: 'A'.repeat(200) // Large reasoning text
    });
  }
  return suggestions;
}

// 🚨 PERFORMANCE ISSUE #12: Meeting creation with multiple heavy operations
app.post('/api/meetings', authenticateToken, (req, res) => {
  const { title, description, startTime, endTime, attendees, resources } = req.body;

  // 🚨 ISSUE: Validate attendees with N+1 queries
  const attendeeValidation = [];
  let validatedCount = 0;

  if (attendees && attendees.length > 0) {
    attendees.forEach(attendeeId => {
      db.get(`SELECT id, username, profile_data FROM users WHERE id = ?`, [attendeeId], (err, user) => {
        if (user) {
          // 🚨 ISSUE: Check availability with heavy computation
          db.all(`SELECT * FROM calendar_events WHERE user_id = ? AND 
                   ((start_time <= ? AND end_time > ?) OR 
                    (start_time < ? AND end_time >= ?))`,
                 [attendeeId, startTime, startTime, endTime, endTime], (err, conflicts) => {
            
            // Heavy conflict analysis
            const conflictAnalysis = conflicts.map(conflict => {
              // Unnecessary heavy processing
              const analysis = {};
              for (let i = 0; i < 1000; i++) {
                analysis[`conflict_metric_${i}`] = Math.random() * i;
              }
              return { ...conflict, analysis };
            });

            attendeeValidation.push({ 
              user, 
              conflicts: conflictAnalysis,
              availability: conflicts.length === 0,
              recommendations: generateAvailabilityRecommendations(user, conflicts)
            });

            validatedCount++;

            if (validatedCount === attendees.length) {
              // Create meeting after all validations
              createMeetingWithValidation();
            }
          });
        } else {
          validatedCount++;
          if (validatedCount === attendees.length) {
            createMeetingWithValidation();
          }
        }
      });
    });
  } else {
    createMeetingWithValidation();
  }

  function createMeetingWithValidation() {
    db.run(`INSERT INTO meetings (title, description, start_time, end_time, created_by, attendees, resources)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
           [title, description, startTime, endTime, req.user.userId, 
            JSON.stringify(attendees), JSON.stringify(resources)], 
           function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create meeting' });
      }

      // 🚨 ISSUE: Generate notifications for each attendee separately
      if (attendees && attendees.length > 0) {
        attendees.forEach(attendeeId => {
          db.run(`INSERT INTO notifications (user_id, type, title, message, priority)
                  VALUES (?, ?, ?, ?, ?)`,
                 [attendeeId, 'meeting_invite', 'New Meeting Invitation', 
                  `You have been invited to: ${title}`, 2]);
        });
      }

      res.json({ 
        id: this.lastID, 
        message: 'Meeting created successfully',
        attendeeValidation,
        suggestedOptimizations: generateMeetingOptimizations(title, startTime, endTime)
      });
    });
  }
});

function generateAvailabilityRecommendations(user, conflicts) {
  // Heavy recommendation generation
  const recommendations = [];
  for (let i = 0; i < 200; i++) {
    recommendations.push({
      timeSlot: addDays(new Date(), Math.floor(Math.random() * 30)).toISOString(),
      score: Math.random() * 100,
      reasoning: 'X'.repeat(300),
      alternatives: new Array(10).fill(0).map((_, idx) => ({
        option: `Alternative ${idx}`,
        score: Math.random() * 100
      }))
    });
  }
  return recommendations;
}

function generateMeetingOptimizations(title, startTime, endTime) {
  // Simulate heavy meeting optimization analysis
  const optimizations = [];
  for (let i = 0; i < 100; i++) {
    optimizations.push({
      type: 'optimization',
      suggestion: `Optimization suggestion ${i}`,
      impact: Math.random() * 10,
      effort: Math.random() * 5,
      details: 'Z'.repeat(500)
    });
  }
  return optimizations;
}

// 🚨 PERFORMANCE ISSUE #13: Resource management with heavy queries
app.get('/api/resources', authenticateToken, (req, res) => {
  const { type, date, capacity } = req.query;

  let query = `SELECT * FROM resources`;
  let params = [];

  if (type || capacity) {
    query += ` WHERE`;
    if (type) {
      query += ` type = ?`;
      params.push(type);
    }
    if (capacity) {
      if (type) query += ` AND`;
      query += ` capacity >= ?`;
      params.push(capacity);
    }
  }

  db.all(query, params, (err, resources) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // 🚨 ISSUE: Check availability for each resource with separate queries
    const resourcesWithAvailability = [];
    let processedResources = 0;

    resources.forEach(resource => {
      // Heavy availability check for each resource
      db.all(`SELECT m.* FROM meetings m 
              WHERE m.resources LIKE ? 
              AND m.start_time <= ? 
              AND m.end_time >= ?`,
             [`%${resource.id}%`, date, date], (err, bookings) => {
        
        if (err) {
          console.error('Error checking resource availability:', err);
          bookings = [];
        }

        // Heavy processing for each resource
        const availability = {
          ...resource,
          metadata: JSON.parse(resource.metadata || '{}'),
          currentBookings: bookings,
          utilizationRate: calculateUtilizationRate(resource.id, date),
          maintenanceSchedule: generateMaintenanceSchedule(resource),
          costAnalysis: performCostAnalysis(resource),
          recommendations: generateResourceRecommendations(resource),
          predictiveAnalytics: generatePredictiveAnalytics(resource.id)
        };

        resourcesWithAvailability.push(availability);
        processedResources++;

        if (processedResources === resources.length) {
          res.json(resourcesWithAvailability);
        }
      });
    });

    if (resources.length === 0) {
      res.json([]);
    }
  });
});

function calculateUtilizationRate(resourceId, date) {
  // Simulate heavy utilization calculation
  let rate = 0;
  for (let i = 0; i < 10000; i++) {
    rate += Math.sin(i * resourceId) * Math.cos(i * Date.parse(date));
  }
  return Math.abs(rate) % 100;
}

function generateMaintenanceSchedule(resource) {
  const schedule = [];
  for (let i = 0; i < 365; i++) { // Full year schedule
    schedule.push({
      date: addDays(new Date(), i).toISOString(),
      type: ['cleaning', 'repair', 'upgrade', 'inspection'][Math.floor(Math.random() * 4)],
      duration: Math.random() * 8,
      cost: Math.random() * 1000,
      description: 'M'.repeat(200)
    });
  }
  return schedule;
}

function performCostAnalysis(resource) {
  const analysis = {
    operationalCost: 0,
    maintenanceCost: 0,
    utilizationCost: 0,
    breakdown: []
  };

  // Heavy cost computation
  for (let i = 0; i < 1000; i++) {
    analysis.operationalCost += Math.random() * 100;
    analysis.maintenanceCost += Math.random() * 50;
    analysis.utilizationCost += Math.random() * 75;
    
    analysis.breakdown.push({
      category: `Cost Category ${i}`,
      amount: Math.random() * 200,
      frequency: ['daily', 'weekly', 'monthly', 'yearly'][Math.floor(Math.random() * 4)],
      details: 'Cost detail '.repeat(50)
    });
  }

  return analysis;
}

function generateResourceRecommendations(resource) {
  const recommendations = [];
  for (let i = 0; i < 150; i++) {
    recommendations.push({
      type: 'resource_optimization',
      priority: Math.floor(Math.random() * 5) + 1,
      suggestion: `Resource recommendation ${i}`,
      impact: Math.random() * 100,
      implementation: 'Implementation details '.repeat(30),
      alternatives: new Array(15).fill(0).map((_, idx) => `Alternative ${idx}`)
    });
  }
  return recommendations;
}

function generatePredictiveAnalytics(resourceId) {
  const analytics = {
    futureUtilization: [],
    demandForecasting: [],
    maintenancePredictions: [],
    costProjections: []
  };

  // Generate massive predictive data
  for (let i = 0; i < 1000; i++) {
    analytics.futureUtilization.push({
      period: addDays(new Date(), i).toISOString(),
      utilization: Math.random() * 100,
      confidence: Math.random(),
      factors: new Array(20).fill(0).map((_, idx) => `Factor ${idx}`)
    });

    analytics.demandForecasting.push({
      period: addDays(new Date(), i).toISOString(),
      demand: Math.random() * 200,
      trend: Math.random() * 50 - 25,
      seasonality: Math.sin(i / 365 * 2 * Math.PI) * 10
    });

    analytics.maintenancePredictions.push({
      period: addDays(new Date(), i).toISOString(),
      probability: Math.random(),
      type: ['preventive', 'corrective', 'emergency'][Math.floor(Math.random() * 3)],
      estimatedCost: Math.random() * 2000
    });

    analytics.costProjections.push({
      period: addDays(new Date(), i).toISOString(),
      projectedCost: Math.random() * 1000,
      variance: Math.random() * 200 - 100,
      factors: new Array(10).fill(0).map((_, idx) => ({
        factor: `Cost Factor ${idx}`,
        impact: Math.random() * 50
      }))
    });
  }

  return analytics;
}

// WebSocket for real-time notifications (with performance issues)
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 🚨 PERFORMANCE ISSUE #14: WebSocket with memory leaks
const activeConnections = new Map();
let notificationInterval;

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');
  
  // 🚨 ISSUE: Store connection without cleanup mechanism
  const connectionId = Date.now() + Math.random();
  activeConnections.set(connectionId, {
    ws,
    userId: null,
    connectionTime: new Date(),
    messageHistory: [], // This will grow indefinitely
    largeData: new Array(10000).fill(0).map((_, i) => ({ id: i, data: 'X'.repeat(1000) }))
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'authenticate') {
        // 🚨 ISSUE: Heavy authentication for each WebSocket message
        jwt.verify(data.token, 'your_secret_key', (err, decoded) => {
          if (!err) {
            const connection = activeConnections.get(connectionId);
            connection.userId = decoded.userId;
            
            // 🚨 ISSUE: Load user data for every WebSocket connection
            db.get(`SELECT * FROM users WHERE id = ?`, [decoded.userId], (err, user) => {
              if (user) {
                connection.userData = JSON.parse(user.profile_data || '{}');
                
                // 🚨 ISSUE: Send large amounts of data on connection
                ws.send(JSON.stringify({
                  type: 'connection_established',
                  userData: connection.userData,
                  systemStats: generateSystemStats(),
                  recommendations: generateConnectionRecommendations()
                }));
              }
            });
          }
        });
      }

      // Store message history (memory leak)
      const connection = activeConnections.get(connectionId);
      if (connection) {
        connection.messageHistory.push({
          timestamp: new Date(),
          message: data,
          processed: false
        });
      }

    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    // 🚨 ISSUE: Incomplete cleanup - connections map never cleared properly
    console.log('WebSocket connection closed');
    // activeConnections.delete(connectionId); // This line is commented out intentionally
  });
});

function generateSystemStats() {
  const stats = {
    serverLoad: Math.random() * 100,
    memoryUsage: process.memoryUsage(),
    activeUsers: activeConnections.size,
    databaseStats: {},
    performanceMetrics: []
  };

  // Heavy stats generation
  for (let i = 0; i < 1000; i++) {
    stats.performanceMetrics.push({
      metric: `Metric_${i}`,
      value: Math.random() * 1000,
      trend: Math.random() * 20 - 10,
      history: new Array(100).fill(0).map(() => Math.random() * 1000)
    });
  }

  return stats;
}

function generateConnectionRecommendations() {
  const recommendations = [];
  for (let i = 0; i < 200; i++) {
    recommendations.push({
      id: i,
      type: 'performance_tip',
      message: `Performance recommendation ${i}`,
      priority: Math.floor(Math.random() * 5) + 1,
      details: 'Recommendation details '.repeat(20),
      actions: new Array(10).fill(0).map((_, idx) => `Action ${idx}`)
    });
  }
  return recommendations;
}

// 🚨 PERFORMANCE ISSUE #15: Periodic heavy operations
function startPeriodicTasks() {
  // Send notifications every 5 seconds with heavy processing
  notificationInterval = setInterval(() => {
    // 🚨 ISSUE: Query all users to send notifications
    db.all(`SELECT id FROM users`, (err, users) => {
      if (!err && users) {
        users.forEach(user => {
          // Heavy notification generation for each user
          const notifications = generateHeavyNotifications(user.id);
          
          // Find WebSocket connection for user
          activeConnections.forEach((connection, connectionId) => {
            if (connection.userId === user.id && connection.ws.readyState === 1) {
              // 🚨 ISSUE: Send large notification payload
              connection.ws.send(JSON.stringify({
                type: 'notifications',
                data: notifications,
                timestamp: new Date(),
                serverStats: generateSystemStats() // Unnecessary heavy data
              }));
            }
          });
        });
      }
    });

    // 🚨 ISSUE: Grow global arrays indefinitely
    notificationQueue.push({
      timestamp: new Date(),
      processed: false,
      data: new Array(1000).fill(0).map((_, i) => ({ id: i, content: 'N'.repeat(100) }))
    });

    sessionData.push({
      timestamp: new Date(),
      connections: activeConnections.size,
      memoryUsage: process.memoryUsage(),
      heavyData: new Array(500).fill(0).map((_, i) => ({ id: i, data: 'S'.repeat(200) }))
    });

  }, 5000);
}

function generateHeavyNotifications(userId) {
  const notifications = [];
  
  // Generate many notifications with heavy processing
  for (let i = 0; i < 50; i++) {
    notifications.push({
      id: Date.now() + i,
      userId,
      type: ['meeting', 'reminder', 'update', 'alert'][Math.floor(Math.random() * 4)],
      title: `Notification ${i}`,
      message: 'Notification message '.repeat(20),
      priority: Math.floor(Math.random() * 5) + 1,
      metadata: {
        analytics: generateNotificationAnalytics(),
        recommendations: generateNotificationRecommendations(),
        relatedData: new Array(100).fill(0).map((_, idx) => ({
          id: idx,
          content: 'Related data '.repeat(10)
        }))
      },
      created_at: new Date().toISOString()
    });
  }

  return notifications;
}

function generateNotificationAnalytics() {
  const analytics = {};
  for (let i = 0; i < 200; i++) {
    analytics[`metric_${i}`] = {
      value: Math.random() * 1000,
      trend: Math.random() * 50 - 25,
      history: new Array(50).fill(0).map(() => Math.random() * 100)
    };
  }
  return analytics;
}

function generateNotificationRecommendations() {
  return new Array(30).fill(0).map((_, i) => ({
    id: i,
    suggestion: `Notification recommendation ${i}`,
    priority: Math.random() * 5,
    impact: Math.random() * 10,
    details: 'Recommendation details '.repeat(15)
  }));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log(`Test application backend running on port ${PORT}`);
  console.log('🚨 WARNING: This application contains intentional performance issues for testing purposes');
  
  // Start periodic tasks with performance issues
  startPeriodicTasks();
});

// 🚨 PERFORMANCE ISSUE #16: No graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  // 🚨 ISSUE: No cleanup of intervals, database connections, or WebSocket connections
  process.exit(0);
});
