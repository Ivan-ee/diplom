FROM node:22-alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY apps/web/ ./apps/web/
COPY packages/ ./packages/

ARG NEXT_PUBLIC_API_URL=http://api:4000
ARG NEXT_PUBLIC_MINIO_URL=http://minio:9000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_URL=$NEXT_PUBLIC_MINIO_URL

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@bakery/web...

WORKDIR /app/apps/web
EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]
