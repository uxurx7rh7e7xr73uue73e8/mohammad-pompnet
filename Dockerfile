FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm install --prefix frontend && npm install --prefix backend

COPY frontend ./frontend
COPY backend ./backend

RUN npm run build --prefix frontend
RUN npm run build --prefix backend

RUN mkdir -p ./backend/public && cp -r ./frontend/dist/* ./backend/public/

EXPOSE 8080

CMD ["sh", "-lc", "cd /app/backend && npx prisma generate && npx prisma db push && node dist/index.js"]
