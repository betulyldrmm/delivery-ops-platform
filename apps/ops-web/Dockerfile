FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/ops-web ./apps/ops-web
RUN npm install
WORKDIR /app/apps/ops-web
CMD ["npm", "run", "dev"]
