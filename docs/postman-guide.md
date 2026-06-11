# Guia rapida de Postman

Base URL:

```text
http://localhost:3000
```

## 1. Registrar usuario

`POST /users`

```json
{
  "name": "User One",
  "email": "user1@test.com",
  "password": "123456"
}
```

Repite con otro correo para crear el segundo usuario.

## 2. Login

`POST /auth/login`

```json
{
  "email": "user1@test.com",
  "password": "123456"
}
```

Guarda el `access_token`.

## 3. Header para rutas privadas

```http
Authorization: Bearer TU_TOKEN
```

## 4. Ver suscripcion actual

`GET /subscriptions/me`

## 5. Cambiar plan

`PATCH /subscriptions/me`

```json
{
  "plan": "GOLD"
}
```

## 6. Crear interaccion

`POST /interactions`

```json
{
  "targetUserId": 2,
  "type": "LIKE"
}
```

Haz la misma accion desde el segundo usuario hacia el primero para generar match.

## 7. Ver matches

`GET /matches`

## 8. Enviar mensaje

`POST /messages`

```json
{
  "matchId": 1,
  "content": "Hola"
}
```

## 9. Ver mensajes

`GET /messages/1`

## 10. Probar RBAC

### Ver mi acceso

`GET /auth/access/me`

### Listar accesos de usuarios

`GET /auth/access/users`

Solo responde si el usuario tiene rol `ADMIN`.

### Actualizar roles

`PATCH /auth/access/users/:userId/roles`

```json
{
  "roles": ["USER", "PREMIUM"]
}
```
