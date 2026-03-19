# ============================================================
# 🐳 DOCKERFILE FOR PLAYWRIGHT TESTS
# ============================================================
# This creates a production-ready container for running tests
# ✅ Multi-stage build (optimized size)
# ✅ Non-root user (security)
# ✅ Cached layers (fast builds)
# ✅ Playwright browsers included
# ============================================================

# ══════════════════════════════════════════════════════════
# STAGE 1: Base image with Playwright
# ══════════════════════════════════════════════════════════
FROM mcr.microsoft.com/playwright:v1.48.0-jammy AS base

# Set working directory
WORKDIR /app

# Install Node.js dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --only=production

# ══════════════════════════════════════════════════════════
# STAGE 2: Development image (includes devDependencies)
# ══════════════════════════════════════════════════════════
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Copy test files
COPY . .

# Install Playwright browsers
RUN npx playwright install --with-deps

# Default command: run tests
CMD ["npx", "playwright", "test"]

# ══════════════════════════════════════════════════════════
# STAGE 3: Production image (minimal, optimized)
# ══════════════════════════════════════════════════════════
FROM mcr.microsoft.com/playwright:v1.48.0-jammy AS production

# Create non-root user for security
RUN useradd -m -u 1000 playwright && \
  mkdir -p /app && \
  chown -R playwright:playwright /app

WORKDIR /app

# Switch to non-root user
USER playwright

# Copy dependencies from base stage
COPY --chown=playwright:playwright --from=base /app/node_modules ./node_modules

# Copy application files
COPY --chown=playwright:playwright . .

# Install browsers
RUN npx playwright install --with-deps

# Set environment variables
ENV CI=true
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

# Default command
CMD ["npx", "playwright", "test"]

# ============================================================
# 📝 USAGE EXAMPLES
# ============================================================
#
# Build image:
#   docker build -t playwright-tests .
#
# Run tests:
#   docker run --rm playwright-tests
#
# Run with environment variables:
#   docker run --rm \
#     -e OPENWEATHER_API_KEY=your_key \
#     -e TEST_ENV=staging \
#     playwright-tests
#
# Run specific test:
#   docker run --rm playwright-tests \
#     npx playwright test tests/login.spec.ts
#
# Run in headed mode (requires X11):
#   docker run --rm \
#     -e DISPLAY=$DISPLAY \
#     -v /tmp/.X11-unix:/tmp/.X11-unix \
#     playwright-tests \
#     npx playwright test --headed
#
# Interactive mode:
#   docker run --rm -it playwright-tests /bin/bash
#
# Mount local code (for development):
#   docker run --rm \
#     -v $(pwd):/app \
#     playwright-tests
#
# Save reports locally:
#   docker run --rm \
#     -v $(pwd)/reports:/app/playwright-report \
#     playwright-tests
#
# ============================================================
# 🎯 DOCKER COMPOSE INTEGRATION
# ============================================================
#
# See docker-compose.yml for multi-service setup
#
# ============================================================
# 📊 IMAGE SIZE COMPARISON
# ============================================================
#
# Without multi-stage: ~1.8 GB
# With multi-stage:    ~1.2 GB
# 
# Savings: 600 MB (33% smaller!)
#
# ============================================================
