FROM node:24-alpine

WORKDIR /app

# copy server package manifest and install
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# copy server sources
COPY / ./

# ensure the runtime helper script is executable
RUN chmod +x scripts/generate_certs.sh || true

# ensure a cert file exists so the server does not fail on startup
RUN apk add --no-cache openssl sqlite \
  && mkdir -p certs \
  && openssl req -x509 -newkey rsa:2048 -days 365 -nodes \
     -keyout certs/ca-key.pem -out certs/ca.pem -subj "/CN=MAPDashboard Local CA" \
  && chmod 644 certs/ca.pem

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "index.js"]
