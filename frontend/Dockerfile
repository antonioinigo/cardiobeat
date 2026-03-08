# Base para dependencias
FROM node:18-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Etapa de desarrollo (para desarrollo live)
FROM base as development
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]

# Etapa de construcción para producción
FROM base as build
RUN npm run build

# Etapa final de producción con Nginx
FROM nginx:alpine as production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
