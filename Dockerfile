FROM node:18-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  libatk-bridge2.0-0 \
  libgbm1 \
  libgtk-3-0 \
  libxshmfence1 \
  fonts-liberation \
  libasound2 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libxrender1 \
  xdg-utils \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x ./node_modules/.bin/tsc
RUN npm run build

COPY public public

CMD ["node", "dist/src/bot.js"]
