# Use official Node.js image
FROM node:18

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the Prisma schema before generating the client
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the project files
COPY . .

# Create data directory if it doesn't exist
RUN mkdir -p data

# Set environment variables for development
ENV NODE_ENV=development

# Expose port 3000
EXPOSE 3000

# Start Next.js in development mode
CMD ["npm", "run", "dev"]