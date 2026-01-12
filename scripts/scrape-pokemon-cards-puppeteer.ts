/**
 * Script de scraping usando Puppeteer para páginas con protección anti-bot
 * Este script simula un navegador real y puede manejar páginas dinámicas con JavaScript
 * 
 * Instalar primero: npm install puppeteer --save-dev
 * Ejecutar con: npx tsx scripts/scrape-pokemon-cards-puppeteer.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Intentar importar Puppeteer (intentar puppeteer primero, luego puppeteer-core)
let puppeteer: any = null;
try {
  puppeteer = require('puppeteer');
  console.log('✅ Puppeteer cargado correctamente\n');
} catch (error) {
  try {
    puppeteer = require('puppeteer-core');
    console.log('✅ Puppeteer-core cargado correctamente\n');
  } catch (e) {
    console.error('❌ Puppeteer no está instalado.');
    console.error('💡 Instala con: npm install puppeteer --save-dev\n');
    process.exit(1);
  }
}

const BASE_URL = 'https://www.pokemon-zone.com/cards/';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'cards');
const DELAY_BETWEEN_REQUESTS = 2000;

interface CardImage {
  name: string;
  url: string;
  localPath: string;
}

// Crear directorio de salida si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✅ Directorio creado: ${OUTPUT_DIR}\n`);
}

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    // Verificar si ya existe
    const localPath = path.join(OUTPUT_DIR, filename);
    if (fs.existsSync(localPath)) {
      return localPath;
    }

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

    fs.writeFileSync(localPath, response.data);
    console.log(`  ✅ Descargada: ${filename}`);
    return localPath;
  } catch (error: any) {
    console.error(`  ❌ Error descargando ${filename}:`, error.message);
    return null;
  }
}

/**
 * Scrapea usando Puppeteer (para páginas dinámicas con JavaScript)
 */
async function scrapeWithPuppeteer(): Promise<CardImage[]> {
  console.log('🚀 Iniciando scraping con Puppeteer...\n');
  console.log('⏳ Esto puede tomar unos minutos (Puppeteer descarga Chromium si es necesario)...\n');

  // Intentar encontrar Chrome/Chromium en ubicaciones comunes
  let executablePath: string | undefined;
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      executablePath = path;
      console.log(`✅ Chrome encontrado en: ${path}\n`);
      break;
    }
  }

  const launchOptions: any = {
    headless: false, // Modo visible para poder ver qué está pasando
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized', // Maximizar ventana para mejor visualización
    ],
    slowMo: 100, // Ralentizar acciones 100ms para poder verlas
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  } else {
    console.log('⚠️  Chrome no encontrado en ubicaciones comunes.');
    console.log('💡 Puppeteer intentará usar Chromium incluido (si está disponible)\n');
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    
    // Configurar User-Agent y otros headers
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navegar a la página
    console.log(`🔍 Accediendo a: ${BASE_URL}`);
    console.log('👀 Se abrirá una ventana del navegador - observa el proceso...\n');
    
    await page.goto(BASE_URL, { 
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('✅ Página cargada. Guardando HTML para análisis...');
    
    // Guardar HTML de la página para análisis
    try {
      const htmlContent = await page.content();
      const htmlPath = path.join(OUTPUT_DIR, 'page-content.html');
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`📄 HTML guardado en: ${htmlPath}`);
    } catch (e) {
      console.log('⚠️  No se pudo guardar HTML');
    }

    // Esperar a que las imágenes se carguen
    console.log('\n⏳ Esperando 5 segundos para que el contenido se cargue completamente...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Hacer scroll para cargar contenido lazy-load
    console.log('📜 Haciendo scroll para cargar contenido lazy-load...');
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0); // Volver arriba
            resolve();
          }
        }, 200); // Más lento para poder ver el scroll
      });
    });

    console.log('⏳ Esperando 3 segundos después del scroll...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Esperar después del scroll

    // Esperar a que aparezcan imágenes
    try {
      await page.waitForSelector('img', { timeout: 10000 });
      console.log('✅ Imágenes encontradas en la página');
    } catch (e) {
      console.log('⚠️  No se encontraron etiquetas img, continuando de todas formas...');
    }

    // Guardar screenshot para diagnóstico (solo vista visible para evitar error)
    try {
      const screenshotPath = path.join(OUTPUT_DIR, 'page-screenshot.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot guardado en: ${screenshotPath}\n`);
    } catch (e) {
      console.log('⚠️  No se pudo guardar screenshot (página muy grande), continuando...\n');
    }

    // Buscar imágenes de cartas
    console.log('\n🔍 Buscando imágenes de cartas en la página...');
    const cardImages = await page.evaluate(() => {
      const imgElements = document.querySelectorAll('img');
      console.log(`Total de elementos <img> encontrados: ${imgElements.length}`);
      
      const foundImages: any[] = [];

      console.log(`Total de elementos <img> encontrados: ${imgElements.length}`);
      
      imgElements.forEach((img: HTMLImageElement, index: number) => {
        const src = img.src || 
                    img.getAttribute('data-src') ||
                    img.getAttribute('data-lazy-src') ||
                    img.getAttribute('data-original') ||
                    (img.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0]) ||
                    img.currentSrc;
        const alt = img.alt || 
                   img.title || 
                   img.getAttribute('aria-label') ||
                   `image-${index}`;

        const rect = img.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         rect.top < window.innerHeight && 
                         rect.bottom > 0;

        if (src && src !== 'undefined' && !src.startsWith('data:') && src.length > 10) {
          foundImages.push({
            name: alt || `image-${index}`,
            url: src,
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
            className: img.className || '',
            visible: isVisible,
            index: index,
          });
        }
      });

      // Devolver todas las imágenes encontradas para análisis
      return foundImages;
    });

    console.log(`\n📊 ANÁLISIS DE IMÁGENES ENCONTRADAS:`);
    console.log(`   Total de elementos <img>: ${cardImages.length}`);
    
    if (cardImages.length > 0) {
      console.log(`\n   Primeras 10 imágenes encontradas:`);
      cardImages.slice(0, 10).forEach((img: any, idx: number) => {
        console.log(`   ${idx + 1}. ${img.name || 'Sin nombre'}`);
        console.log(`      URL: ${img.url.substring(0, 80)}${img.url.length > 80 ? '...' : ''}`);
        console.log(`      Tamaño: ${img.width}x${img.height} | Visible: ${img.visible ? 'Sí' : 'No'}`);
        console.log(`      Clase: ${img.className || 'N/A'}`);
        console.log(``);
      });

      // Guardar todas las imágenes encontradas en un archivo JSON para análisis
      const analysisPath = path.join(OUTPUT_DIR, 'images-found.json');
      fs.writeFileSync(analysisPath, JSON.stringify(cardImages, null, 2));
      console.log(`   💾 Análisis completo guardado en: ${analysisPath}\n`);
    }
    
    // Filtrar imágenes de cartas
    const filteredCardImages = cardImages.filter((img: any) => {
      const url = img.url.toLowerCase();
      const name = (img.name || '').toLowerCase();
      const className = (img.className || '').toLowerCase();
      const hasImageExtension = url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
      
      // Verificar si es una imagen de carta por múltiples criterios
      const isCardRelated = 
        name.includes('card') ||
        name.includes('pokemon') ||
        name.includes('carta') ||
        url.includes('cardpreviews') || // ¡IMPORTANTE! Las cartas tienen "CardPreviews" en la URL
        url.includes('card') ||
        url.includes('pokemon') ||
        url.includes('carta') ||
        className.includes('game-card') || // Clase específica de las cartas: "game-card-image__img"
        className.includes('card-image'); // Otra clase posible
      
      const isLargeEnough = img.width > 200 && img.height > 200; // Cartas son grandes (350x488)
      const isVisible = img.visible !== false;
      const isNotLogo = !url.includes('logo') && !name.includes('logo'); // Excluir logos

      return hasImageExtension && isNotLogo && (isCardRelated || (isLargeEnough && isVisible));
    });

    console.log(`✅ Imágenes filtradas como cartas: ${filteredCardImages.length}`);

    // Si no encontramos con filtros, usar imágenes visibles y grandes
    const fallbackImages = cardImages.filter((img: any) => {
      return img.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) && 
             img.visible !== false && 
             img.width > 150 && 
             img.height > 150;
    });

    const finalCardImages = filteredCardImages.length > 0 
      ? filteredCardImages 
      : fallbackImages.slice(0, 30); // Usar hasta 30 imágenes como fallback
    
    console.log(`📦 Imágenes finales para descarga: ${finalCardImages.length}\n`);
    
    if (finalCardImages.length === 0) {
      console.log('⚠️  No se encontraron imágenes para descargar.');
      console.log('💡 Revisa el archivo images-found.json para ver todas las imágenes encontradas.');
      console.log('💡 El navegador permanecerá abierto por 10 segundos para que puedas inspeccionar la página...\n');
      await new Promise(resolve => setTimeout(resolve, 10000));
      await browser.close();
      return [];
    }

    // Si no encontramos imágenes, intentar buscar en todos los elementos con fondo de imagen
    if (cardImages.length === 0) {
      console.log('⚠️  No se encontraron imágenes con img tags, buscando en estilos CSS...');
      
      const backgroundImages = await page.evaluate(() => {
        const images: Array<{ name: string; url: string }> = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          const bgImage = style.backgroundImage;
          
          if (bgImage && bgImage !== 'none') {
            const urlMatch = bgImage.match(/url\(['"]?(.+?)['"]?\)/);
            if (urlMatch && urlMatch[1]) {
              const url = urlMatch[1];
              if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                images.push({
                  name: `bg-image-${images.length}`,
                  url: url.startsWith('http') ? url : new URL(url, window.location.href).toString(),
                });
              }
            }
          }
        });
        
        return images;
      });

      if (backgroundImages.length > 0) {
        console.log(`📦 Encontradas ${backgroundImages.length} imágenes en estilos CSS\n`);
        cardImages.push(...backgroundImages);
      }
    }

    await browser.close();
    
    // Convertir URLs relativas a absolutas y generar paths
    return finalCardImages.map((img: any) => {
      let fullUrl = img.url;
      if (!fullUrl.startsWith('http')) {
        fullUrl = new URL(img.url, BASE_URL).toString();
      }

      const urlParts = fullUrl.split('/');
      const originalFilename = urlParts[urlParts.length - 1].split('?')[0] || 'card.jpg';
      const safeAlt = img.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeAlt}_${Date.now()}_${originalFilename}`.substring(0, 255);

      return {
        name: img.name,
        url: fullUrl,
        localPath: path.join(OUTPUT_DIR, filename),
      };
    });
  } catch (error: any) {
    await browser.close();
    throw error;
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    const cardImages = await scrapeWithPuppeteer();

    if (cardImages.length === 0) {
      console.log('⚠️  No se encontraron imágenes de cartas.');
      console.log('💡 Puede que la estructura de la página haya cambiado o las imágenes estén en un formato diferente.\n');
      return;
    }

    console.log(`📥 Descargando ${cardImages.length} imágenes...\n`);

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < cardImages.length; i++) {
      const card = cardImages[i];

      // Verificar si ya existe
      if (fs.existsSync(card.localPath)) {
        console.log(`[${i + 1}/${cardImages.length}] ⏭️  Ya existe: ${path.basename(card.localPath)}`);
        skippedCount++;
        continue;
      }

      console.log(`[${i + 1}/${cardImages.length}] Descargando: ${card.name}`);

      const downloaded = await downloadImage(card.url, path.basename(card.localPath));

      if (downloaded) {
        successCount++;
      } else {
        failCount++;
      }

      // Esperar entre peticiones
      if (i < cardImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Descarga completada!`);
    console.log(`   ✅ Exitosas: ${successCount}`);
    console.log(`   ⏭️  Omitidas (ya existían): ${skippedCount}`);
    console.log(`   ❌ Fallidas: ${failCount}`);
    console.log(`   📁 Ubicación: ${OUTPUT_DIR}`);
    console.log('='.repeat(50) + '\n');

    // Guardar metadata
    const metadata = {
      lastUpdate: new Date().toISOString(),
      totalCards: successCount + skippedCount,
      source: BASE_URL,
      cards: cardImages
        .filter((card, index) => index < successCount + skippedCount)
        .map(card => ({
          name: card.name,
          filename: path.basename(card.localPath),
          url: card.url,
        })),
    };

    const metadataPath = path.join(OUTPUT_DIR, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`💾 Metadata guardada en: ${metadataPath}\n`);
  } catch (error: any) {
    console.error('💥 Error fatal:', error.message);
    if (error.message.includes('timeout')) {
      console.error('💡 El sitio web puede estar muy lento o inaccesible.');
    }
    process.exit(1);
  }
}

// Ejecutar script
main();
