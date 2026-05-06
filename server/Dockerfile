FROM node:24-alpine AS deps

WORKDIR /app

# Install build tools only in this stage. sqlite3 may need a native build on
# some platforms, but the compiler toolchain should not ship in the runtime.
RUN apk add --no-cache openssl \
  && apk add --no-cache --virtual .build-deps python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

RUN mkdir -p certs \
  && openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
     -keyout certs/ca-key.pem -out certs/ca.pem -subj "/CN=MAPDashboard Local CA" \
  && chmod 644 certs/ca.pem

FROM node:24-alpine

WORKDIR /app

# sqlite CLI is used by the compose startup command to initialize a mounted DB.
RUN apk add --no-cache sqlite

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/certs ./certs
COPY package*.json ./
COPY index.js ./
COPY utils ./utils
COPY sqlite_schema.sql ./

ENV NODE_ENV=production

EXPOSE 8191

CMD ["node", "index.js"]
