# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Cloud Run requires PORT 8080
ENV PORT=8080
ENV NODE_ENV=production

# Create data directory for assets (Cloud Storage FUSE mount point)
RUN mkdir -p /app/data/assets

EXPOSE 8080

CMD ["node", "dist/main.js"]
