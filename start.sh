#!/bin/bash

echo "🚀 Starting Performance Insights Dashboard..."
echo

echo "📦 Installing dependencies..."
npm run install:all

echo
echo "🔧 Starting backend and frontend servers..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo

npm run start:dev &

echo "✅ Both servers are starting..."
echo "📱 Frontend will be available at: http://localhost:5173"
echo "🔌 Backend API at: http://localhost:3001"
echo
echo "Press Ctrl+C to stop servers..."

# Wait for user to press Ctrl+C
wait
