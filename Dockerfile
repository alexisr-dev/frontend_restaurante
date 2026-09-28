FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite congela estas variables en la compilacion, no en tiempo de ejecucion.
ARG VITE_API_DJANGO=http://localhost:8010
ARG VITE_API_FASTAPI=http://localhost:8011
ENV VITE_API_DJANGO=$VITE_API_DJANGO
ENV VITE_API_FASTAPI=$VITE_API_FASTAPI

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
