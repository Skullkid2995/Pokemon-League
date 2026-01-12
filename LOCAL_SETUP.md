# Guía de Despliegue Local - Solución de Problemas

## Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El servidor debería iniciarse en: **http://localhost:3000**

## Problemas Comunes y Soluciones

### Error: "Connection Refused"

Si ves "connection refused" al intentar acceder a http://localhost:3000:

#### 1. Verificar que el servidor esté corriendo

Ejecuta en PowerShell:
```powershell
netstat -ano | findstr :3000
```

Si no ves ninguna línea, el servidor no está corriendo. Inícialo con:
```bash
npm run dev
```

#### 2. Verificar variables de entorno

Asegúrate de que el archivo `.env.local` existe y contiene:

```
NEXT_PUBLIC_SUPABASE_URL=https://gyhqldjqjkotmbtnidta.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Nota:** El archivo `.env.local` debe estar en la raíz del proyecto (mismo nivel que `package.json`)

#### 3. Verificar que no haya otro proceso usando el puerto 3000

Si el puerto está ocupado, puedes:
- Cerrar el otro proceso
- O usar un puerto diferente:
  ```bash
  PORT=3001 npm run dev
  ```

#### 4. Verificar errores en la consola del servidor

Cuando ejecutes `npm run dev`, revisa si hay errores en la terminal. Errores comunes:

- **"Cannot find module"**: Ejecuta `npm install`
- **Variables de entorno no encontradas**: Verifica que `.env.local` existe y tiene el formato correcto
- **Error de conexión a Supabase**: Verifica que las URLs y keys en `.env.local` sean correctas

#### 5. Limpiar caché y reiniciar

Si el problema persiste, intenta:

```bash
# Eliminar caché de Next.js
rm -rf .next
# O en Windows PowerShell:
Remove-Item -Recurse -Force .next

# Reinstalar dependencias (opcional)
rm -rf node_modules
npm install

# Iniciar de nuevo
npm run dev
```

### Error: Variables de entorno no encontradas

Si ves errores sobre variables de entorno:

1. Verifica que `.env.local` existe en `Top Gaming/Pokemon-League/.env.local`
2. Verifica que no tenga espacios antes/después del `=`
3. Verifica que no tenga comillas alrededor de los valores (a menos que sea necesario)
4. Reinicia el servidor después de cambiar `.env.local`

### Error: Cannot connect to Supabase

Si la aplicación carga pero no puede conectar a Supabase:

1. Verifica que las URLs y keys en `.env.local` sean correctas
2. Verifica que tu proyecto de Supabase esté activo
3. Revisa la consola del navegador (F12) para ver errores específicos

## Pasos de Verificación Rápida

1. ✅ Node.js instalado: `node --version` (debe ser 18+)
2. ✅ Dependencias instaladas: `npm install`
3. ✅ Archivo `.env.local` existe con las variables correctas
4. ✅ Servidor inicia: `npm run dev` (debe mostrar "Ready in X.Xs")
5. ✅ Navegador puede acceder: http://localhost:3000

## Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (puerto 3000)

# Producción (local)
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción

# Utilidades
npm run lint         # Ejecuta linter
npm run create-admin # Crea usuario administrador
```

## Obtener Ayuda Adicional

Si el problema persiste:
1. Revisa los logs en la terminal donde ejecutaste `npm run dev`
2. Revisa la consola del navegador (F12 → Console)
3. Verifica los logs de errores en la pestaña Network del navegador

