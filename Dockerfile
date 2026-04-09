FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
RUN pnpm --filter @bmad/api build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/api/dist apps/api/dist/
COPY --from=build /app/apps/api/src/db/migrations apps/api/dist/db/migrations/
COPY --from=build /app/packages/shared/dist packages/shared/dist/

EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
