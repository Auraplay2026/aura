# ==============================================================================
# AURAPLAY - ENTERPRISE MULTI-STAGE DOCKERFILE FOR RED HAT OPENSHIFT / KUBERNETES
# Compliant with Red Hat Non-Root Security Context Constraints (SCC)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Dependencies
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma engine
RUN npm ci
RUN npx prisma generate

# ------------------------------------------------------------------------------
# Stage 2: Builder
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production build environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build Next.js application
RUN npx prisma generate
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runner (Red Hat OpenShift & Cloud Compatible)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create standard unprivileged system user for Red Hat arbitrary UID compatibility
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy runtime assets and build output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/data ./data
COPY --from=builder /app/data_template ./data_template
COPY --from=builder /app/create_admin.js ./create_admin.js
COPY --from=builder /app/server.js ./server.js

# Ensure OpenShift arbitrary UIDs have read/write access to runtime directories
RUN chown -R nextjs:nodejs /app && \
    chmod -R 775 /app/data /app/scripts /app/prisma

# Switch to unprivileged user
USER 1001

EXPOSE 3000

# Healthcheck for Kubernetes / OpenShift probes
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "scripts/start-production.js"]
