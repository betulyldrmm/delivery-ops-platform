FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/customer-web ./apps/customer-web
RUN npm install
WORKDIR /app/apps/customer-web
CMD ["npm", "run", "dev"]
