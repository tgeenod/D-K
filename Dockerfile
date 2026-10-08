FROM node:lts-alpine
  
WORKDIR /usr/src/app

COPY package.json .

RUN apk add --no-cache git && \
    npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
