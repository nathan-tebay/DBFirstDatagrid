FROM node:18-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

# copy source and build
COPY frontend/ ./
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
