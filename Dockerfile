FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci || npm install

# Copy all files
COPY . .

# Build Next.js
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy built application
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.js ./

# Install only production dependencies
RUN npm ci --only=production || npm install --only=production

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]