FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services/api ./services/api
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install
WORKDIR /app/services/api
RUN npm run prisma:generate
CMD ["npm", "run", "dev"]
