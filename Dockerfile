FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/
WORKDIR /app/server
RUN apk add --no-cache python3 make g++ \
    && npm ci \
    && apk del python3 make g++
WORKDIR /app/client
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules
COPY server/ ./server/
COPY client/ ./client/
COPY README.md README.zh.md ./
RUN cd server && npm run build \
    && npm prune --production
RUN cd client && npm run build

FROM base AS runner
RUN apk add --no-cache su-exec \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 appuser
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/README.md /app/README.zh.md ./
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server/dist/index.js"]
