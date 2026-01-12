# Configuración de Supabase Storage para Cartas de Pokémon

## Crear el Bucket Manualmente

1. Ve a tu [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Click en **"New bucket"**
5. Configura el bucket:
   - **Name**: `pokemon-cards`
   - **Public bucket**: ✅ Sí (para que las imágenes sean accesibles públicamente)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/gif`
     - `image/svg+xml`
6. Click en **"Create bucket"**

## Configurar Políticas RLS (Row Level Security)

Después de crear el bucket, configura las políticas RLS:

### Política de Lectura (SELECT)
```sql
-- Permitir lectura pública de las imágenes
CREATE POLICY "Public Access for Pokemon Cards"
ON storage.objects
FOR SELECT
USING (bucket_id = 'pokemon-cards');
```

### Política de Escritura (INSERT/UPDATE)
```sql
-- Permitir escritura solo con service role key (para el script)
-- Esto se maneja automáticamente cuando usas el service role key
-- No necesitas una política RLS para esto si usas el service role
```

## Variables de Entorno Necesarias

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**⚠️ IMPORTANTE**: 
- El `SUPABASE_SERVICE_ROLE_KEY` se necesita para subir archivos al Storage desde el script
- Esta clave tiene permisos completos, manténla segura y nunca la expongas en el cliente

## Verificar Configuración

Después de configurar, puedes verificar ejecutando:

```bash
npm run scrape-and-upload
```

El script intentará crear el bucket automáticamente si no existe. Si hay errores, el script te indicará cómo crear el bucket manualmente.

