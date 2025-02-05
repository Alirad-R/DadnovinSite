#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
/app/node_modules/.bin/prisma db push --accept-data-loss

# Start the application
echo "Starting the application..."
node server.js 