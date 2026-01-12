# Inicio Rápido - Desarrollo Local

## ⚠️ IMPORTANTE: Directorio Correcto

El proyecto está en: `Top Gaming\Pokemon-League`

**NO ejecutes comandos desde `God Gamer` (directorio raíz)**

## Pasos para Iniciar el Servidor

### 1. Abre una terminal (PowerShell o CMD)

### 2. Navega al directorio del proyecto:

```powershell
cd "C:\Users\Zombi\God Gamer\Top Gaming\Pokemon-League"
```

**O si ya estás en `God Gamer`:**
```powershell
cd "Top Gaming\Pokemon-League"
```

### 3. Verifica que estás en el directorio correcto:

```powershell
# Deberías ver: C:\Users\Zombi\God Gamer\Top Gaming\Pokemon-League
Get-Location

# Verifica que package.json existe:
Test-Path package.json
# Debería mostrar: True
```

### 4. Instala dependencias (solo la primera vez o si cambiaste de carpeta):

```bash
npm install
```

### 5. Inicia el servidor de desarrollo:

```bash
npm run dev
```

### 6. Espera a ver este mensaje:

```
✓ Ready in X.Xs
```

### 7. Abre tu navegador en:

**http://localhost:3000**

## Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia servidor (puerto 3000)

# Producción
npm run build        # Construye para producción
npm run start        # Inicia servidor de producción

# Utilidades
npm run lint         # Ejecuta linter
npm run create-admin # Crea usuario administrador
```

## Verificación Rápida

Antes de ejecutar `npm run dev`, asegúrate de estar en el directorio correcto:

✅ Debes ver `package.json` en el directorio actual
✅ Debes ver la carpeta `app` en el directorio actual
✅ Debes ver la carpeta `components` en el directorio actual
✅ El prompt debe mostrar: `PS ...\Pokemon-League>`

## Solución de Problemas

### Error: "Could not read package.json"
**Causa:** Estás en el directorio incorrecto
**Solución:** Ejecuta `cd "Top Gaming\Pokemon-League"` primero

### Error: "connection refused"
**Causa:** El servidor no ha terminado de compilar
**Solución:** Espera a ver "✓ Ready in X.Xs" antes de abrir el navegador

### El servidor no inicia
**Solución:** 
1. Verifica que estás en el directorio correcto
2. Ejecuta `npm install` para asegurar dependencias
3. Revisa los errores en la terminal

