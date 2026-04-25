# ── Stage 1: Build ────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (layer cacheado si package.json no cambia)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copiar fuentes y construir
COPY . .
RUN npm run build
# El build de Vite en modo production usa .env.production automáticamente.
# Sourcemaps desactivados por defecto en Vite production build.

# ── Stage 2: Serve con Nginx ───────────────────────────────────
FROM nginx:1.27-alpine

# Remover config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar nuestra config y el build
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
