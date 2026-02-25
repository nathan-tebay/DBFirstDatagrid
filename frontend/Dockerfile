FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

# copy source and build
COPY frontend/ ./
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
