# SecureApp — Proyecto 2: Aplicación Web Segura

**ISW-1013 · Calidad del Software · I Cuatrimestre 2026**

---

## Descripción

Aplicación web segura que implementa el ciclo completo Blue Team / Red Team:
- Gestión de productos y usuarios con control de acceso basado en roles (RBAC)
- Autenticación JWT con cookies HttpOnly
- Log de auditoría completo
- Protecciones contra SQLi, XSS, CSRF, Brute Force y más

---

## Stack Tecnológico

| Capa       | Tecnología                     | Justificación de seguridad                          |
|------------|--------------------------------|-----------------------------------------------------|
| Backend    | Node.js 20 + Express 4         | Maduro, ecosistema amplio, fácil de asegurar        |
| ORM        | Prisma 5                       | Previene SQLi automáticamente (RS-01)               |
| Base datos | PostgreSQL 16                  | ACID, soporte de roles nativo, auditoría            |
| Auth       | JWT (HS256) + cookies HttpOnly | Previene XSS sobre tokens (RS-05)                   |
| Passwords  | bcryptjs (cost=12)             | Hash adaptativo, resistente a fuerza bruta (RF-02)  |
| Headers    | Helmet 7                       | CSP, X-Frame-Options, HSTS, nosniff (RS-06)         |
| Frontend   | React 18 + Vite + Tailwind CSS | SPA moderna, separación cliente/servidor            |

---

## Ejecución Rápida

### Opción A — Docker

```bash
docker-compose up --build
```

Accede en: **http://localhost**

### Opción B — Desarrollo local con PostgreSQL

#### Requisitos previos
- Node.js ≥ 20
- PostgreSQL corriendo en `localhost:5432`

#### 1. Crear la base de datos
```bash
psql -U postgres -c "CREATE DATABASE proyecto2;"
```

#### 2. Backend
```bash
cd backend
cp .env.example .env
# Edita .env con tu password de PostgreSQL y asegúrate que DATABASE_URL apunte a "proyecto2"

npm install
npx prisma generate --schema=src/prisma/schema.prisma
npx prisma db push --schema=src/prisma/schema.prisma
node src/prisma/seed.js

npm run dev
# → http://localhost:4000
```

#### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Credenciales por defecto

| Usuario       | Contraseña         | Rol         | Capacidades                           |
|---------------|--------------------|-------------|---------------------------------------|
| `superadmin`  | `Admin1234!`       | SuperAdmin  | Todo: CRUD usuarios, roles, auditoría |
| `auditor`     | `Auditor1234!`     | Auditor     | Solo lectura (usuarios + productos)   |
| `registrador` | `Registrador1234!` | Registrador | CRUD productos, leer usuarios         |

> ⚠️ **Cambia estas contraseñas antes de exponer el sistema públicamente.**

---

## Exponer con ngrok (pentest cruzado)

```bash
# 1. Levanta el proyecto con Docker
docker-compose up --build

# 2. En otra terminal, expón el puerto 80
ngrok http 80

# 3. ngrok genera algo como: https://abc123.ngrok-free.app
```

**URL pública ngrok:** `[COMPLETAR EN SEMANA 13]`

---

## Controles de Seguridad Implementados

| Req   | Control                        | Implementación                                                        |
|-------|--------------------------------|-----------------------------------------------------------------------|
| RS-01 | SQL Injection                  | Prisma ORM — prepared statements automáticos en todas las queries     |
| RS-02 | XSS + CSP                      | `express-validator .escape()` + Helmet CSP                           |
| RS-03 | CSRF                           | Double-submit cookie: `csrf_token` + header `X-CSRF-Token`           |
| RS-04 | Gestión segura de sesiones     | Timeout 5 min, regeneración de JWT post-login, HttpOnly + Secure     |
| RS-05 | JWT seguro                     | `algorithms: ['HS256']` — rechaza `alg:none`, expiración 1h          |
| RS-06 | Headers HTTP                   | Helmet: CSP, X-Frame-Options: DENY, nosniff, HSTS, Referrer-Policy   |
| RS-07 | Rate limiting login            | Persistente en BD (`LoginAttempt`), bloqueo 5 min por IP + usuario   |
| RF-02 | Hash seguro de contraseñas     | `bcrypt` con `cost=12`                                                |
| RF-05 | RBAC validado en backend       | `requirePermission()` middleware en cada ruta                        |
| RF-06 | Log de auditoría               | Todos los eventos con timestamp + IP                                 |

### Mejoras adicionales implementadas

| Mejora | Descripción |
|--------|-------------|
| Token blacklist | Al hacer logout el JWT se revoca en BD (`RevokedToken`). Aunque sea robado, el middleware lo rechaza |
| Rate limiting persistente | Los intentos fallidos sobreviven reinicios del servidor al guardarse en PostgreSQL |
| Content-Type estricto | Requests sin `Content-Type: application/json` reciben `415` — evita ataques de confusión de parser |

---

## Estructura del Proyecto

```
proyecto2/
├── docker-compose.yml
├── README.md
├── api_docs/
│   └── postman_collection.json        ← Entregable 5
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma              ← Modelos BD
│   └── src/
│       ├── server.js                  ← Entry point
│       ├── app.js                     ← Express config + middlewares globales
│       ├── config/
│       │   └── index.js               ← Variables centralizadas
│       ├── controllers/
│       │   ├── auth.controller.js     ← Login, logout, me
│       │   ├── users.controller.js    ← CRUD usuarios
│       │   ├── products.controller.js ← CRUD productos
│       │   ├── audit.controller.js    ← Consulta logs
│       │   └── roles.controller.js    ← Gestión roles/permisos
│       ├── middleware/
│       │   ├── auth.middleware.js     ← JWT verify + inactivity timeout + blacklist
│       │   ├── rbac.middleware.js     ← requirePermission()
│       │   ├── security.middleware.js ← Helmet + CSRF token
│       │   ├── audit.middleware.js    ← logEvent()
│       │   └── contenttype.middleware.js ← Valida Content-Type: application/json
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── users.routes.js
│       │   ├── products.routes.js
│       │   ├── audit.routes.js
│       │   └── roles.routes.js
│       ├── validators/
│       │   └── index.js               ← Reglas de validación backend
│       └── prisma/
│           └── seed.js                ← Datos iniciales (roles, permisos, usuarios)
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx                   ← Entry point
        ├── App.jsx                    ← Router + ProtectedRoute
        ├── index.css                  ← Tailwind + clases globales
        ├── context/
        │   └── AuthContext.jsx        ← Estado global de sesión
        ├── utils/
        │   └── api.js                 ← Axios + interceptor CSRF automático
        ├── components/
        │   ├── Layout.jsx             ← Sidebar + navegación
        │   └── ui/
        │       ├── Modal.jsx          ← Modal reutilizable
        │       └── index.jsx          ← Badge, Button, Input, Select, Textarea
        └── pages/
            ├── Login.jsx              ← Formulario de autenticación
            ├── Dashboard.jsx          ← Panel principal con estadísticas
            ├── Products.jsx           ← CRUD productos
            ├── Users.jsx              ← CRUD usuarios
            ├── AuditLog.jsx           ← Log de auditoría paginado
            └── Roles.jsx              ← Matriz de permisos por rol
```

---

## Endpoints de la API (RF-07)

Todos los endpoints protegidos requieren cookie `access_token` (JWT HttpOnly).
Las mutaciones (POST/PUT/DELETE) requieren header `X-CSRF-Token`.
Todos los endpoints requieren `Content-Type: application/json`.

### Auth
| Método | Ruta              | Auth | Descripción                          |
|--------|-------------------|------|--------------------------------------|
| POST   | /api/auth/login   | ❌   | Login — devuelve JWT en cookie       |
| POST   | /api/auth/logout  | ✅   | Logout — revoca JWT y limpia cookies |
| GET    | /api/auth/me      | ✅   | Usuario autenticado actual           |

### Productos
| Método | Ruta              | Permiso requerido | Descripción  |
|--------|-------------------|-------------------|--------------|
| GET    | /api/products     | VIEW_PRODUCTS     | Listar todos |
| GET    | /api/products/:id | VIEW_PRODUCTS     | Ver uno      |
| POST   | /api/products     | CREATE_PRODUCT    | Crear        |
| PUT    | /api/products/:id | EDIT_PRODUCT      | Editar       |
| DELETE | /api/products/:id | DELETE_PRODUCT    | Eliminar     |

### Usuarios
| Método | Ruta          | Permiso requerido | Descripción |
|--------|---------------|-------------------|-------------|
| GET    | /api/users    | VIEW_USERS        | Listar      |
| GET    | /api/users/:id| VIEW_USERS        | Ver uno     |
| POST   | /api/users    | CREATE_USER       | Crear       |
| PUT    | /api/users/:id| EDIT_USER         | Editar      |
| DELETE | /api/users/:id| DELETE_USER       | Eliminar    |

### Auditoría
| Método | Ruta        | Permiso requerido | Descripción                          |
|--------|-------------|-------------------|--------------------------------------|
| GET    | /api/audit  | VIEW_AUDIT_LOG    | Logs paginados (?page=1&limit=20)    |

### Roles
| Método | Ruta                       | Permiso requerido | Descripción                 |
|--------|----------------------------|-------------------|-----------------------------|
| GET    | /api/roles                 | VIEW_ROLES        | Listar roles con permisos   |
| GET    | /api/roles/permissions     | VIEW_ROLES        | Listar todos los permisos   |
| PUT    | /api/roles/:id/permissions | MANAGE_ROLES      | Actualizar permisos del rol |

---

## Uso de IA Generativa

Este proyecto fue desarrollado con asistencia de **Claude (Anthropic)** para:
- Estructura y scaffolding del proyecto
- Implementación de middlewares de seguridad
- Componentes de React con tema oscuro
- Mejoras de seguridad adicionales (token blacklist, rate limiting persistente, validación Content-Type)

Todo el código fue revisado y comprendido por el equipo. Los integrantes pueden explicar cualquier decisión de diseño o implementación durante la defensa.

---

## Autores
Kasandra Cruz Arroyo.
Guillermo Antonio Solórzano Ochoa.