# ==============================================================================
# Emertech Certify v2.0 — Production Backend Dockerfile
# Multi-stage optimized Node.js 20 microservice container
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# ------------------------------------------------------------------------------
# Production Runtime Stage
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PORT=5001

# Add non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Ensure storage directories exist with correct permissions
RUN mkdir -p storage/certificates && chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/v2/health || exit 1

CMD ["node", "src/server.js"]
