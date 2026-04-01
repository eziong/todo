# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public keys — baked into the client bundle at build time
ENV NEXT_PUBLIC_SUPABASE_URL=https://udgjjfkzpvqxqccotptb.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZ2pqZmt6cHZxeHFjY290cHRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMDU4ODYsImV4cCI6MjA5MDU4MTg4Nn0.Tr2SnCue1JqPWZKmpEE5dDNlLF38FeCeQqW8u_VBRxQ
ENV NEXT_PUBLIC_API_URL=https://command-server-549189599662.asia-northeast3.run.app

RUN npm run build

# Stage 3: Production
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080

CMD ["node", "server.js"]
