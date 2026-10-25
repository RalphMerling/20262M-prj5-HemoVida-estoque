
# Imagem base com Node.js 24
FROM node:24-bookworm-slim

# Diretório de trabalho da aplicação
WORKDIR /app

# Instalar dependências necessárias para o Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências do projeto
RUN npm ci

# Copiar os arquivos do projeto
COPY . .

# Gerar Prisma Client sem credenciais reais
RUN DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder" \
    npx prisma generate

# Compilar o NestJS
RUN npm run build

# Porta utilizada pela API
EXPOSE 7503

# Iniciar a aplicação compilada
CMD ["node", "dist/main.js"]
