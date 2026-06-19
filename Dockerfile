FROM oven/bun:1

WORKDIR /app

COPY package.json ./
COPY server.js ./

RUN mkdir -p /app/data

EXPOSE 18273

ENV PORT=18273
ENV SQLITE_DB_PATH=/app/data/data.db

CMD ["bun", "server.js"]
