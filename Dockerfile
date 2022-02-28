FROM node:17-alpine3.15

WORKDIR /app

COPY package.json .
COPY yarn.lock .
COPY tsconfig.json .
COPY .env .
COPY migrations .

RUN npm install -g tsc-watch pino-pretty
RUN yarn install --production=false

CMD ["yarn", "dev"]
