# ==============================================================================
# Emertech Certify v2.0 — Production Frontend Dockerfile
# Multi-stage optimized React 19 SPA with Nginx
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
ENV CI=true
RUN npm run build

# ------------------------------------------------------------------------------
# Nginx Static Serving Stage
# ------------------------------------------------------------------------------
FROM nginx:alpine AS runner

COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# Custom Nginx configuration for Single Page Application routing
RUN echo 'server {' \
  '  listen 80;' \
  '  server_name localhost;' \
  '  location / {' \
  '    root /usr/share/nginx/html;' \
  '    index index.html index.htm;' \
  '    try_files $uri $uri/ /index.html;' \
  '  }' \
  '  error_page 500 502 503 504 /50x.html;' \
  '  location = /50x.html {' \
  '    root /usr/share/nginx/html;' \
  '  }' \
  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
