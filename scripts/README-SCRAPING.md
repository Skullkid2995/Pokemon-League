# Script de Scraping de Cartas de Pokémon

Este directorio contiene scripts para descargar automáticamente imágenes de cartas de Pokémon desde `pokemon-zone.com`.

## Script Principal: `scrape-pokemon-cards.ts`

Script básico usando Cheerio y Axios para scrapear páginas estáticas.

### Instalación de Dependencias

Las dependencias ya deberían estar instaladas, pero si no:

```bash
npm install axios cheerio
```

### Uso

Ejecuta el script con:

```bash
npm run scrape-cards
```

O directamente:

```bash
npx tsx scripts/scrape-pokemon-cards.ts
```

### Características

- ✅ Descarga imágenes de cartas desde `https://www.pokemon-zone.com/cards/`
- ✅ Guarda las imágenes en `public/images/cards/`
- ✅ Genera un archivo `metadata.json` con información de las cartas
- ✅ Evita descargar imágenes duplicadas (verifica si ya existen)
- ✅ Espera 2 segundos entre peticiones para no saturar el servidor
- ✅ Incluye headers apropiados (User-Agent) para evitar bloqueos

### Salida

El script crea:
- `public/images/cards/` - Directorio con las imágenes descargadas
- `public/images/cards/metadata.json` - Metadata de las cartas descargadas

### Ejecución Periódica (Cron Job)

Para ejecutar el script automáticamente cada día, puedes configurar un cron job:

**En Linux/Mac:**
```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar cada día a las 2 AM
0 2 * * * cd /ruta/al/proyecto && npm run scrape-cards >> logs/scrape.log 2>&1
```

**En Windows (Task Scheduler):**
1. Abre "Task Scheduler"
2. Crea una nueva tarea básica
3. Programa la ejecución diaria
4. Acción: Ejecutar programa
5. Programa: `cmd.exe`
6. Argumentos: `/c cd /d "C:\ruta\al\proyecto" && npm run scrape-cards`

## Script Alternativo: `scrape-pokemon-cards-puppeteer.ts`

Script alternativo usando Puppeteer para páginas dinámicas que requieren JavaScript.

### Instalación

```bash
npm install puppeteer @types/puppeteer --save-dev
```

### Uso

Descomenta el código dentro del archivo y ejecuta:

```bash
npx tsx scripts/scrape-pokemon-cards-puppeteer.ts
```

**Nota:** Puppeteer descarga Chromium (~170MB), así que úsalo solo si el script principal no funciona.

## Configuración

Puedes ajustar las siguientes constantes en el script:

```typescript
const BASE_URL = 'https://www.pokemon-zone.com/cards/';  // URL base
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'cards');  // Directorio de salida
const DELAY_BETWEEN_REQUESTS = 2000;  // Tiempo de espera entre peticiones (ms)
```

## Troubleshooting

### Error: "No se encontraron imágenes"

- La página puede usar JavaScript para cargar contenido dinámicamente
- Usa el script con Puppeteer (`scrape-pokemon-cards-puppeteer.ts`)
- Verifica que los selectores CSS en el script coincidan con la estructura actual de la página

### Error: "Connection timeout"

- Verifica tu conexión a internet
- Aumenta el timeout en el script (actualmente 30 segundos)
- Verifica que `pokemon-zone.com` esté accesible

### Error: "Rate limiting"

- Aumenta el `DELAY_BETWEEN_REQUESTS` (actualmente 2 segundos)
- El servidor puede estar bloqueando peticiones frecuentes
- Considera usar un proxy o VPN

### Imágenes no se descargan correctamente

- Verifica que el directorio `public/images/cards/` tenga permisos de escritura
- Revisa el formato de las URLs de las imágenes
- Algunas imágenes pueden requerir autenticación o headers específicos

## Notas Legales

⚠️ **IMPORTANTE**: Asegúrate de:
- Respetar los términos de servicio de `pokemon-zone.com`
- No sobrecargar el servidor con demasiadas peticiones
- Usar las imágenes descargadas solo para fines legales
- Considerar contactar al sitio web para obtener permiso antes de scrapear en producción

## Integración con la Aplicación

Después de descargar las imágenes, puedes actualizar el componente `CardsCatalog.tsx` para leer desde el directorio `public/images/cards/`:

```typescript
// En components/cards/CardsCatalog.tsx
const cardImages = fs.readdirSync(path.join(process.cwd(), 'public', 'images', 'cards'))
  .filter(file => file.match(/\.(jpg|jpeg|png|gif|webp)$/i));
```

O usar el archivo `metadata.json` para obtener información estructurada de las cartas.

