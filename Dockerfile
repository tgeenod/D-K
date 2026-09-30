FROM node:lts-bookworm
  
WORKDIR /usr/src/app

COPY package.json .

RUN npm install && npm install pm2

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
