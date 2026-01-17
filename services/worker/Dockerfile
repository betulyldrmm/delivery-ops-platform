FROM node:20-bookworm-slim
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY packages ./packages
COPY services/worker ./services/worker
COPY services/api/package.json ./services/api/package.json
COPY services/api/prisma ./services/api/prisma
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install
RUN ./node_modules/.bin/prisma generate --schema /app/services/api/prisma/schema.prisma
WORKDIR /app/services/worker
CMD ["npm", "run", "dev"]
