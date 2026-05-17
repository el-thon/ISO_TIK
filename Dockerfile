FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ARG VITE_STORAGE_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STORAGE_BASE_URL=$VITE_STORAGE_BASE_URL
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
