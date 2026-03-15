<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<h1 align="center">Auth API</h1>

## 📋 Description

API REST construida con NestJS para autenticación y gestión de usuarios.
Incluye login con JWT, refresh token, control de roles, soft delete, seeder y Swagger.

## 🚀 Technologies

- NestJS 11
- TypeScript
- MongoDB + Mongoose
- Passport JWT
- class-validator / class-transformer
- Swagger / OpenAPI
- Jest

## Project Structure

```text
src/
 ├─ auth/          # Login, logout, refresh, forgot-password, guards, strategies
 ├─ users/         # CRUD de usuarios, esquema y DTOs
 ├─ seeder/        # Datos semilla y limpieza lógica
 ├─ app.module.ts
 └─ main.ts
test/
 └─ app.e2e-spec.ts
```

## 🔧 Installation

### Clone the repository

```bash
git clone <tu-repo-url>
cd auth-api
```

### Install dependencies

```bash
npm install
```

### Environment variables (.env)

```env
PORT=3000
MONGO_URL=mongodb://localhost:27017/nest-auth
JWT_SECRET=super-secret-key
PASSWORD_RECOVERY_SECRET=another-secret-key
```

## E2E en este proyecto

```bash
# Ejecutar pruebas end-to-end
npm run test:e2e
```

El archivo base está en `test/app.e2e-spec.ts`.

## 📚 API Documentation

Once the application is running, access the interactive Swagger documentation at:

`http://localhost:3000/docs`

The API includes the following tags:

- Auth
- Users
- Seeder

## ✅ Data Validation

The project implements automatic validation using class-validator:

- Required fields validation
- Data type validation
- Custom business rules validation
- Automatic whitelist and forbidden properties filtering


## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🏛️ Architecture

- `AuthModule`: autenticación, emisión/validación de tokens y recuperación de contraseña.
- `UsersModule`: lógica de usuarios, esquema Mongoose y operaciones administrativas.
- `SeederModule`: creación y limpieza lógica de datos de prueba.
- `AppModule`: composición principal y conexión a MongoDB.

## License

Nest is MIT licensed.
