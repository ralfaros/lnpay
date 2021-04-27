FROM node:14-alpine AS BUILD_IMAGE

RUN apk upgrade

WORKDIR /usr/src/app

COPY ./*.js ./package.json ./yarn.lock ./

RUN yarn install --frozen-lockfile

USER 1000

CMD node index.js