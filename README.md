# 💰 Cash Control — BFF

Backend for Frontend do **Cash Control**, app mobile de controle financeiro pessoal.
API REST em **NestJS** que serve o app Flutter: autenticação, CRUD de despesas,
agregações por período e perfil/configurações do usuário.

## 🧱 Stack

- **NestJS** (Node.js + TypeScript)
- **PostgreSQL** com **Prisma** (ou TypeORM)
- **JWT** para autenticação
- **class-validator / class-transformer** para validação de DTOs
- **Swagger** para documentação da API

## 📋 Pré-requisitos

- Node.js 18+
- npm ou pnpm
- PostgreSQL 14+ (ou Docker)

## 🚀 Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Subir o banco (via Docker)
docker compose up -d

# 4. Rodar as migrations
npx prisma migrate dev

# 5. (opcional) popular o banco
npx prisma db seed

# 6. Iniciar em modo desenvolvimento
npm run start:dev
```

API disponível em `http://localhost:3000` · Docs em `http://localhost:3000/docs`.

## 🔑 Variáveis de ambiente

| Variável         | Descrição                              | Exemplo                                     |
| ---------------- | -------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`   | String de conexão do PostgreSQL        | `postgresql://user:pass@localhost:5432/cash`|
| `JWT_SECRET`     | Chave de assinatura do token           | `sua-chave-secreta`                         |
| `JWT_EXPIRES_IN` | Tempo de expiração do token            | `7d`                                        |
| `PORT`           | Porta da aplicação                     | `3000`                                      |

## 📂 Estrutura