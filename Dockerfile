FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --package-lock=false

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY scripts/docker-entrypoint.mjs /usr/local/bin/docker-entrypoint.mjs

ENTRYPOINT ["node", "/usr/local/bin/docker-entrypoint.mjs"]
CMD ["node", "build/index.js"]
