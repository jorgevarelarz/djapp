# DJ App

App para pedir canciones en un evento y gestionarlas desde el panel del DJ.

## Requisitos

- Node.js 18+

## Configuracion

### Backend

1. Copia `backend/.env.example` a `backend/.env` y configura:
   - `JWT_SECRET`
   - `FRONTEND_URL` (por ejemplo `http://localhost:5173`)
   - `DJ_INVITE_CODE` (codigo opcional para crear DJs)
2. Instala dependencias y levanta el servidor:

```
cd backend
npm install
npm run dev
```

### Frontend

1. Copia `.env.example` a `.env` y ajusta `VITE_API_URL` si aplica.
2. Instala dependencias y levanta Vite:

```
npm install
npm run dev
```

## Flujo basico

- El DJ se registra con el `DJ_INVITE_CODE` para obtener rol DJ.
- El DJ crea un evento y comparte el `joinCode` con el publico.
- Los usuarios envian peticiones con ese codigo.
