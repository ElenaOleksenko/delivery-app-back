FROM node:16

ENV TZ=Europe/Kiev

WORKDIR /clon2_my_delivery_app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

COPY .env ./

CMD [ "npm", "start" ]