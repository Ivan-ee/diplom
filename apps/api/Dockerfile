FROM node:22-alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json turbo.json ./
COPY apps/api/ ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@bakery/api...

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
