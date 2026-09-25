# Node.js LTS base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package descriptors
COPY package*.json ./

# Install dependencies (production + build)
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
