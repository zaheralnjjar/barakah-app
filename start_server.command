#!/bin/bash
cd /Users/zaher/Baraka2/barakah_life_management
echo "🚀 Starting Barakah Native Bridge..."
node bridge-server.js &
BRIDGE_PID=$!

echo "🚀 Starting Barakah System..."
npm run dev

# Cleanup bridge on exit
kill $BRIDGE_PID
