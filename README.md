# The Spot Bot (Render – FIX CJS)

Esta versión usa **CommonJS** (`require`) para evitar el error de imports ESM que viste en Render:
> Named export 'LocalAuth' not found ...

## Pasos
1) Sube estos archivos a tu repo (reemplazando los anteriores).
2) En Render, en tu servicio, pulsa **Manual Deploy → Clear build cache & deploy**.
3) Abre **Logs** y escanea el **QR**.

### Comandos en Render
- Build: `npm install`
- Start: `npm start`

### Notas
- Guarda la sesión en `./.wwebjs_auth` (ephemeral en plan free).
- Si Render reinicia, puede pedirte escanear el QR nuevamente.
