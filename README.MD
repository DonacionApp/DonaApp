<h1 style="text-align: center"><b>DONACIONAPP</b></h1>

DonacionApp es una aplicación para gestionar donaciones, usuarios, publicaciones y notificaciones. Esta repository contiene dos carpetas principales: `backend/` (API construida con NestJS + TypeORM) y `frontend/` (interfaces y vistas — código separado en su propia carpeta).

## Resumen del proyecto

- Nombre: DonacionApp
- Stack principal (backend): Node.js, NestJS, TypeORM, Passport (JWT), PostgreSQL (u otra DB compatible con TypeORM)
- Stack (frontend): código en la carpeta `frontend/` (detalles del framework pueden estar en `frontend/instrucciones.txt`)

## Contribuidores / Mapeo GitHub -> Nombre real

Por solicitud, se añade la siguiente lista con los GitHub usernames y sus nombres reales:

- GitHubName: IlesAndres  --> Breiner Andres Iles Sambony
- GitHubName: Kevincl03  --> Kevin Alexander Chanchi
- GitHubName: AudinoPantoja2025 --> Abel Audino Pantoja Rodrigues
- GitHubName: EmersonILES --> Emerson Esneyder Iles Sambony
- GitHubName: juanCpastuzan99 --> Juan Carlos Pastuzan
- GitHubName: EmerIlesS --> Emerson Esneyder Iles Sambony



## Estructura principal del repositorio

- `backend/` - código del servidor (NestJS)
	- `src/` - código fuente
		- `modules/` - funcionalidades por dominio (auth, user, rol, post, donation, etc.)
		- `shared/` - guards, pipes, y utilidades compartidas
		- `core/` - servicios centrales (por ejemplo: mail)
		- `main.ts` - arranque de la aplicación
	- `package.json`, `tsconfig.json`, `README.md` (específico del backend)
- `frontend/` - código del cliente (vistas y lógica del front; revisa `frontend/instrucciones.txt`)

## Cómo ejecutar (backend)

1. Instalar dependencias (desde la raíz o dentro de `backend/` según tu flujo):

```powershell
cd backend
npm install
```

2. Configurar variables de entorno:
- Crea un `.env` (o usa tu método preferido) con al menos:
	- JWT_SECRET
	- JWT_EXPIRES_IN
	- Database connection vars (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)

3. Ejecutar en desarrollo:

```powershell
npm run start:dev
```

4. Build / producción:

```powershell
npm run build
npm run start:prod
```

Nota: Si el proyecto usa `pnpm` o `yarn`, adapta los comandos correspondientes.

## Endpoints importantes

- Revisa `backend/src/modules/auth` para los endpoints de autenticación (login, registro, verificación de email, reset de contraseña).
- Rutas protegidas utilizan `JwtAuthGuard` y `RolesGuard`. Asegúrate de incluir el header `Authorization: Bearer <token>` al probar.

## Convenciones de token y roles

- Los JWT generados por la aplicación contienen campos como `sub`, `userName`, `email` y `rol` (según implementaciones actuales). Ten en cuenta que existe `rol` en lugar de `role` en partes del código: si cambias la forma del payload, actualiza también `JwtStrategy` y `RolesGuard`.
- Si recibes `401 Unauthorized`, revisa que el token no esté expirado (`exp`) y que `JWT_SECRET` coincida con el valor usado para firmarlo.

## Sugerencias rápidas de debugging (autenticación/roles)

- Si el `RolesGuard` no valida aunque el token muestre `"rol":"admin"`:
	- Revisa que `JwtAuthGuard` esté aplicado antes del `RolesGuard` en los controladores: `@UseGuards(JwtAuthGuard, RolesGuard)`.
	- Asegúrate de que `JwtStrategy.validate()` devuelva un objeto con la propiedad `rol` (o modifica el guard para aceptar `role` y `rol`).
	- Verifica `exp` del token (no sea menor o igual a `iat`).

## Notas finales

Este README es una base rápida para que cualquier desarrollador del equipo pueda arrancar y entender la estructura. Si quieres, amplío secciones (por ejemplo: scripts disponibles, migraciones de BD, detalles del frontend, o ejemplos de requests para endpoints principales).

---
Si quieres que haga cambios adicionales (añadir ejemplos curl, Postman collection, o documentación más detallada por módulo), dime qué parte te interesa y la agrego.