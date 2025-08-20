# syntax=docker/dockerfile:1
FROM node:20-slim

# Install git for cloning repos
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src ./src

ENV PORT=3001
EXPOSE 3001
CMD ["node", "src/server.js"]


