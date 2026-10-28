FROM node:24-bookworm-slim

WORKDIR /app

# Bibliotecas necessárias ao Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      openssl \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=7503

EXPOSE 7503

CMD ["npm", "run", "dev"]
