FROM node:17-alpine3.15

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .

RUN yarn install --production=false

CMD ["yarn", "dev"]
