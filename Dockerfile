# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY package*.json ./

# Install dependencies
RUN cd backend && npm ci --only=production

# Copy backend source
COPY backend ./backend

# Build backend
RUN cd backend && npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "backend/dist/index.js"]