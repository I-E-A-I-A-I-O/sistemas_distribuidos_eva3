FROM node:lts-alpine
ARG PORT=3001
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm i
COPY dev ./
COPY tsconfig.json ./
COPY custom.d.ts ./
EXPOSE ${PORT}
CMD [ "npm", "run", "start" ]