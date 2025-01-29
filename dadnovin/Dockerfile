# Use official Node.js image
FROM node:18

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

# Set environment variables for development
ENV NODE_ENV=development

# Expose port 3000
EXPOSE 3000

# Start Next.js in development mode
CMD ["npm", "run", "dev"]
