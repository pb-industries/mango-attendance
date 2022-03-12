# Stage 1:
# Provision the container with all packages and build to the dist directory
FROM node:17-alpine3.15 AS builder

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .

RUN yarn
COPY . .
RUN yarn build

# Stage 2
# Copy built assets to run here.
FROM node:17-alpine3.15

WORKDIR /app

COPY --from=0 /app/dist ./dist
COPY --from=0 /app/package.json .
COPY --from=0 /app/yarn.lock .

RUN yarn --prod

CMD ["node", "./dist/server/index.js"]
