FROM oven/bun:slim

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --production

COPY . .

ENV NODE_ENV=production
