# Admin Dockerfile (Vite + React)
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean install - remove lock files and reinstall
RUN rm -f package-lock.json && npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy entire dist folder
COPY --from=build /app/dist /tmp/dist

# Move app content to nginx root and keep assets
RUN cp -r /tmp/dist/app/* /usr/share/nginx/html/ && \
    cp -r /tmp/dist/assets /usr/share/nginx/html/ && \
    cp /tmp/dist/vite.svg /usr/share/nginx/html/ && \
    rm -rf /tmp/dist

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
