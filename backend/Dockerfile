FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate --schema=src/prisma/schema.prisma

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push --schema=src/prisma/schema.prisma && node src/prisma/seed.js && node src/server.js"]
