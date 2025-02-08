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

# Copy package files
COPY package*.json ./

# Install dependencies with development packages
RUN npm install

# Copy the Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the project files
COPY . .

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3000

# Expose ports for Next.js and Prisma Studio
EXPOSE 3000
EXPOSE 5555

# Start in development mode with hot reloading
CMD ["npm", "run", "dev"]