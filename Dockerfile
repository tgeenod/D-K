FROM node:lts-alpine
  
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install && \
    npm install -g pm2

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
