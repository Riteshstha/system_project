FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files for both apps
COPY package*.json ./
COPY portal-app/package*.json ./portal-app/
COPY prisma ./prisma/
COPY portal-app/prisma ./portal-app/prisma/

# Install all dependencies
RUN npm ci
RUN cd portal-app && npm ci

# Generate Prisma clients
RUN npx prisma generate
RUN cd portal-app && npx prisma generate

# Copy all source code
COPY . .

# Build both apps
# Copy all source code
COPY . .

ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY


RUN npm run build
RUN cd portal-app && npm run build

# Production stage
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pm2

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy portal-app built artifacts
COPY --from=builder /app/portal-app/package*.json ./portal-app/
COPY --from=builder /app/portal-app/node_modules ./portal-app/node_modules
COPY --from=builder /app/portal-app/.next ./portal-app/.next
COPY --from=builder /app/portal-app/public ./portal-app/public
COPY --from=builder /app/portal-app/prisma ./portal-app/prisma

# Create PM2 ecosystem file
RUN cat > ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: "app",
      script: "./node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/app",
      env: { NODE_ENV: "production" }
    },
    {
      name: "portal-app",
      script: "./node_modules/.bin/next",
      args: "start -p 3200",
      cwd: "/app/portal-app",
      env: { NODE_ENV: "production" }
    }
  ]
};
PM2EOF

EXPOSE 3000 3200
CMD ["pm2-runtime", "ecosystem.config.js"]
