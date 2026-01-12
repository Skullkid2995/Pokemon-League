/**
 * Script para scrapear imágenes de cartas de Pokémon desde pokemon-zone.com
 * Este script descarga las imágenes de las cartas y las guarda localmente
 * 
 * Ejecutar con: npx tsx scripts/scrape-pokemon-cards.ts
 * O configurar como cron job para ejecutar periódicamente
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { load } from 'cheerio';

const BASE_URL = 'https://www.pokemon-zone.com/cards/';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'cards');
const DELAY_BETWEEN_REQUESTS = 2000; // 2 segundos entre peticiones para no saturar el servidor

interface CardImage {
  name: string;
  url: string;
  localPath: string;
}

// Crear directorio de salida si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Directorio creado: ${OUTPUT_DIR}`);
}

/**
 * Descarga una imagen desde una URL y la guarda localmente
 */
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.pokemon-zone.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    const localPath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(localPath, response.data);
    console.log(`  ✅ Descargada: ${filename}`);
    return localPath;
  } catch (error: any) {
    console.error(`  ❌ Error descargando ${filename}:`, error.message);
    return null;
  }
}

/**
 * Obtiene todas las URLs de las imágenes de cartas desde la página
 */
async function scrapeCardImages(pageUrl: string = BASE_URL): Promise<CardImage[]> {
  try {
    console.log(`🔍 Scrapeando página: ${pageUrl}`);
    
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.pokemon-zone.com/',
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Aceptar códigos 2xx y 3xx
      },
    });

    const $ = load(response.data);
    const cardImages: CardImage[] = [];

    // Buscar todas las imágenes de cartas
    // Ajustar estos selectores según la estructura real de la página
    $('img').each((index, element) => {
      const $img = $(element);
      const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
      const alt = $img.attr('alt') || $img.attr('title') || `card-${index}`;

      if (src) {
        // Convertir URL relativa a absoluta si es necesario
        let fullUrl = src;
        if (src.startsWith('/')) {
          fullUrl = `https://www.pokemon-zone.com${src}`;
        } else if (!src.startsWith('http')) {
          fullUrl = new URL(src, pageUrl).toString();
        }

        // Solo incluir si parece ser una imagen de carta
        if (
          fullUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
          alt.toLowerCase().includes('card') ||
          alt.toLowerCase().includes('pokemon') ||
          fullUrl.toLowerCase().includes('card')
        ) {
          // Generar nombre de archivo seguro
          const urlParts = fullUrl.split('/');
          const originalFilename = urlParts[urlParts.length - 1].split('?')[0];
          const safeAlt = alt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const filename = `${safeAlt}_${originalFilename}`.substring(0, 255);

          cardImages.push({
            name: alt,
            url: fullUrl,
            localPath: path.join(OUTPUT_DIR, filename),
          });
        }
      }
    });

    console.log(`  📦 Encontradas ${cardImages.length} imágenes potenciales`);
    return cardImages;
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error ${error.response.status} scrapeando ${pageUrl}:`, error.response.statusText);
      if (error.response.status === 403) {
        console.error('\n   ⚠️  El servidor está bloqueando las peticiones (403 Forbidden)');
        console.error('   💡 Esto puede deberse a:');
        console.error('      - Protección anti-bot (Cloudflare, etc.)');
        console.error('      - Requiere JavaScript para cargar contenido');
        console.error('      - Bloqueo de IP o User-Agent');
        console.error('\n   🔧 Soluciones:');
        console.error('      1. Instala Puppeteer: npm install puppeteer --save-dev');
        console.error('      2. Usa el script con Puppeteer: npx tsx scripts/scrape-pokemon-cards-puppeteer.ts');
        console.error('      3. O contacta al sitio web para obtener permiso de scraping');
        console.error('      4. Considera usar un servicio de scraping profesional\n');
      }
    } else {
      console.error(`❌ Error scrapeando ${pageUrl}:`, error.message);
    }
    return [];
  }
}

/**
 * Función principal del script
 */
async function main() {
  console.log('🚀 Iniciando scraping de cartas de Pokémon...\n');

  // Scrapear la página principal
  const cardImages = await scrapeCardImages(BASE_URL);

  if (cardImages.length === 0) {
    console.log('⚠️  No se encontraron imágenes. Puede que la página use JavaScript.');
    console.log('💡 Considera usar Puppeteer para páginas dinámicas.\n');
    return;
  }

  console.log(`\n📥 Descargando ${cardImages.length} imágenes...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < cardImages.length; i++) {
    const card = cardImages[i];
    
    // Verificar si la imagen ya existe localmente
    if (fs.existsSync(card.localPath)) {
      console.log(`  ⏭️  Ya existe: ${path.basename(card.localPath)}`);
      continue;
    }

    console.log(`[${i + 1}/${cardImages.length}] Descargando: ${card.name}`);

    const downloaded = await downloadImage(card.url, path.basename(card.localPath));
    
    if (downloaded) {
      successCount++;
    } else {
      failCount++;
    }

    // Esperar entre peticiones para no saturar el servidor
    if (i < cardImages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Descarga completada!`);
  console.log(`   ✅ Exitosas: ${successCount}`);
  console.log(`   ❌ Fallidas: ${failCount}`);
  console.log(`   📁 Ubicación: ${OUTPUT_DIR}`);
  console.log('='.repeat(50) + '\n');

  // Guardar metadata de las cartas descargadas
  const metadata = {
    lastUpdate: new Date().toISOString(),
    totalCards: successCount,
    cards: cardImages.slice(0, successCount).map(card => ({
      name: card.name,
      filename: path.basename(card.localPath),
      url: card.url,
    })),
  };

  const metadataPath = path.join(OUTPUT_DIR, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`💾 Metadata guardada en: ${metadataPath}\n`);
}

// Ejecutar script
main().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

