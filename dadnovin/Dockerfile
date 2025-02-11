FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Add build dependencies
RUN apk add --no-cache libc6-compat python3 make g++ gcc
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with development packages
RUN npm install

# Copy the Prisma schema
COPY prisma ./prisma
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Set environment variables for development
ENV NODE_ENV=development
ENV PORT=3000

# Expose ports for Next.js and Prisma Studio
EXPOSE 3000
EXPOSE 5555

# Start in development mode with hot reloading
CMD ["npm", "run", "dev"]