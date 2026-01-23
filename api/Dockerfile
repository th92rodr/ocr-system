# ---------- Base ----------
FROM node:24.13.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apk add --no-cache openssl libc6-compat
RUN apk add ghostscript graphicsmagick
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# ---------- Build ----------
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# ---------- Runtime ----------
FROM base AS runner
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml prisma.config.ts ./
COPY .env.docker ./.env

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 3000

COPY docker.start.sh /start.sh
CMD ["/start.sh"]
