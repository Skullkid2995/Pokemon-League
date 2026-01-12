/**
 * Script completo para scrapear cartas de Pokémon y subirlas a Supabase
 * - Hace click en "Advanced Search"
 * - Navega por expansiones
 * - Descarga imágenes de cartas
 * - Sube imágenes a Supabase Storage
 * - Guarda metadata en la base de datos
 * 
 * Ejecutar con: npx tsx scripts/scrape-and-upload-cards.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Intentar importar Puppeteer
let puppeteer: any = null;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer no está instalado. Instala con: npm install puppeteer --save-dev');
  process.exit(1);
}

const BASE_URL = 'https://www.pokemon-zone.com/cards/';
const TEMP_DIR = path.join(process.cwd(), 'public', 'images', 'cards', 'temp');
const DELAY_BETWEEN_REQUESTS = 3000; // 3 segundos entre peticiones
const MAX_CARDS_PER_SET = 1000; // Límite de cartas por expansión

interface CardData {
  card_id: string;
  name: string;
  card_type: string;
  rarity: string | null;
  hp: number | null;
  image_url: string | null;
  image_url_small: string | null;
  set_name: string | null;
  set_id: string | null;
  card_number: string | null;
  artist: string | null;
  national_pokedex_number: number | null;
}

// Crear directorio temporal si no existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Inicializar Supabase (usando service role para Storage)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  console.error('💡 Asegúrate de tener un archivo .env.local con estas variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Asegurar que el bucket existe
async function ensureBucketExists() {
  const bucketName = 'pokemon-cards';
  
  // Verificar si el bucket existe
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === bucketName);
  
  if (!bucketExists) {
    console.log(`📦 Creando bucket '${bucketName}' en Supabase Storage...`);
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    });
    
    if (error) {
      console.error(`❌ Error creando bucket: ${error.message}`);
      console.error('💡 Crea el bucket manualmente en Supabase Dashboard: Storage > New bucket');
      process.exit(1);
    }
    
    console.log(`✅ Bucket '${bucketName}' creado exitosamente`);
  } else {
    console.log(`✅ Bucket '${bucketName}' ya existe`);
  }
}

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url: string, filename: string): Promise<string | null> {
  try {
    const localPath = path.join(TEMP_DIR, filename);
    
    if (fs.existsSync(localPath)) {
      return localPath; // Ya existe
    }

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.pokemon-zone.com/',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    fs.writeFileSync(localPath, response.data);
    return localPath;
  } catch (error: any) {
    console.error(`  ❌ Error descargando ${filename}:`, error.message);
    return null;
  }
}

/**
 * Sube una imagen a Supabase Storage
 */
async function uploadToSupabase(filePath: string, storagePath: string): Promise<string | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fullStoragePath = `${storagePath}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('pokemon-cards')
      .upload(fullStoragePath, fileBuffer, {
        contentType: 'image/png', // Ajustar según el tipo de imagen
        upsert: true,
      });

    if (error) {
      console.error(`  ❌ Error subiendo a Supabase: ${error.message}`);
      return null;
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('pokemon-cards')
      .getPublicUrl(fullStoragePath);

    return publicUrl;
  } catch (error: any) {
    console.error(`  ❌ Error en uploadToSupabase: ${error.message}`);
    return null;
  }
}

/**
 * Extrae información de una carta desde el DOM
 */
async function extractCardInfo(page: any, cardElement: any): Promise<CardData | null> {
  try {
    const cardInfo = await page.evaluate((el: Element) => {
      const img = el.querySelector('img');
      const nameEl = el.querySelector('[class*="card-name"], [class*="name"], h3, h4');
      const typeEl = el.querySelector('[class*="type"], [class*="card-type"]');
      const rarityEl = el.querySelector('[class*="rarity"], [class*="card-rarity"]');
      const hpEl = el.querySelector('[class*="hp"], [class*="card-hp"]');
      const numberEl = el.querySelector('[class*="number"], [class*="card-number"]');
      
      const imgSrc = img?.src || img?.getAttribute('data-src') || '';
      const name = nameEl?.textContent?.trim() || '';
      const type = typeEl?.textContent?.trim().toLowerCase() || 'normal';
      const rarity = rarityEl?.textContent?.trim() || null;
      const hp = hpEl ? parseInt(hpEl.textContent?.trim().replace('HP', '').trim() || '0') : null;
      const cardNumber = numberEl?.textContent?.trim() || null;

      // Extraer ID de la URL de la imagen
      const cardId = imgSrc.match(/cPK_\d+_\d+/)?.[0] || 
                     imgSrc.split('/').pop()?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') || 
                     `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        card_id: cardId,
        name,
        card_type: type,
        rarity,
        hp,
        image_url: imgSrc,
        card_number: cardNumber,
      };
    }, cardElement);

    if (!cardInfo.name || !cardInfo.image_url) {
      return null; // Información insuficiente
    }

    return {
      card_id: cardInfo.card_id,
      name: cardInfo.name,
      card_type: cardInfo.card_type,
      rarity: cardInfo.rarity,
      hp: cardInfo.hp,
      image_url: cardInfo.image_url,
      image_url_small: cardInfo.image_url, // Usar la misma imagen por ahora
      set_name: null, // Se establecerá desde el contexto
      set_id: null,
      card_number: cardInfo.card_number,
      artist: null,
      national_pokedex_number: null,
    };
  } catch (error: any) {
    console.error(`  ❌ Error extrayendo información: ${error.message}`);
    return null;
  }
}

/**
 * Scrapea cartas de una expansión específica
 */
async function scrapeSetCards(page: any, setUrl: string, setName: string): Promise<CardData[]> {
  console.log(`\n📦 Procesando expansión: ${setName}`);
  console.log(`   URL: ${setUrl}`);

  try {
    await page.goto(setUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Hacer scroll para cargar todas las cartas (lazy loading)
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
            resolve();
          }
        }, 200);
      });
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Buscar todas las cartas en la página
    const cards = await page.evaluate(() => {
      const cardElements = document.querySelectorAll('[class*="card"], [class*="game-card"]');
      const cards: Array<{ element?: any; imgSrc: string; name: string }> = [];
      
      cardElements.forEach((el: Element) => {
        const img = el.querySelector('img');
        const imgSrc = img?.src || img?.getAttribute('data-src') || '';
        
        if (imgSrc && imgSrc.includes('CardPreviews')) {
          const nameEl = el.querySelector('[class*="name"], h3, h4, [class*="title"]');
          const name = nameEl?.textContent?.trim() || '';
          
          if (name) {
            cards.push({ imgSrc, name });
          }
        }
      });

      return cards;
    });

    console.log(`   ✅ Encontradas ${cards.length} cartas en la página`);

    // Extraer información detallada de cada carta
    const cardDataList: CardData[] = [];
    
    for (let i = 0; i < Math.min(cards.length, MAX_CARDS_PER_SET); i++) {
      const card = cards[i];
      console.log(`   [${i + 1}/${Math.min(cards.length, MAX_CARDS_PER_SET)}] Procesando: ${card.name}`);

      // Descargar imagen
      const filename = `${card.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
      const localPath = await downloadImage(card.imgSrc, filename);

      if (localPath) {
        // Subir a Supabase
        const storagePath = `sets/${setName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        const publicUrl = await uploadToSupabase(localPath, storagePath);

        if (publicUrl) {
          // Extraer información adicional de la URL de la imagen
          const cardIdMatch = card.imgSrc.match(/cPK_\d+_(\d+)/);
          const cardNumber = cardIdMatch ? cardIdMatch[1] : null;

          cardDataList.push({
            card_id: cardIdMatch?.[0] || `card-${Date.now()}-${i}`,
            name: card.name,
            card_type: 'normal', // Por defecto, se puede mejorar extrayendo de la imagen o datos adicionales
            rarity: null,
            hp: null,
            image_url: publicUrl,
            image_url_small: publicUrl,
            set_name: setName,
            set_id: setName.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
            card_number: cardNumber,
            artist: null,
            national_pokedex_number: null,
          });

          // Limpiar archivo temporal
          fs.unlinkSync(localPath);
        }
      }

      // Esperar entre cartas
      if (i < cards.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }

    return cardDataList;
  } catch (error: any) {
    console.error(`  ❌ Error procesando expansión ${setName}: ${error.message}`);
    return [];
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando scraping y carga de cartas a Supabase...\n');

  // Asegurar que el bucket existe
  await ensureBucketExists();

  const browser = await puppeteer.launch({ 
    headless: false, // Modo visible
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized',
    ],
    slowMo: 100,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log(`🔍 Accediendo a: ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Buscar y hacer click en "Advanced Search"
    console.log('\n🔍 Buscando botón "Advanced Search"...');
    
    try {
      // Intentar diferentes formas de encontrar el botón
      const advancedButton = await page.evaluateHandle(() => {
        // Buscar por texto
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        return buttons.find((el: any) => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('advanced') || text.includes('búsqueda avanzada') || text.includes('search');
        }) || null;
      });

      if (advancedButton && advancedButton.asElement()) {
        await (advancedButton.asElement() as any).click();
        console.log('✅ Click en "Advanced Search" realizado');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Esperar a que se cargue la página de búsqueda avanzada
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.log('⚠️  No se encontró botón "Advanced Search", buscando enlaces de expansiones directamente...');
      }
    } catch (e: any) {
      console.log(`⚠️  Error buscando "Advanced Search": ${e.message}`);
      console.log('   Continuando sin hacer click...');
    }

    // Buscar enlaces de expansiones (sets) - método más robusto
    console.log('\n🔍 Buscando expansiones disponibles...');
    const sets = await page.evaluate(() => {
      const setLinks: Array<{ name: string; url: string }> = [];
      
      // Buscar enlaces que puedan ser expansiones
      document.querySelectorAll('a').forEach((el: HTMLAnchorElement) => {
        const href = el.href || '';
        const text = el.textContent?.trim() || '';
        const img = el.querySelector('img');
        const imgSrc = img?.src || img?.getAttribute('src') || '';
        
        // Buscar patrones comunes de expansiones
        const isSetLink = 
          href.includes('/set/') || 
          href.includes('/expansion/') || 
          href.includes('/cards/') ||
          href.includes('set=') ||
          el.classList.toString().toLowerCase().includes('set') ||
          el.classList.toString().toLowerCase().includes('expansion') ||
          (text && href.includes('/cards') && text.length > 2 && text.length < 100);
        
        if (isSetLink && href && text) {
          setLinks.push({ 
            name: text.substring(0, 100), // Limitar longitud
            url: href 
          });
        }
      });

      // También buscar en elementos que puedan contener información de sets
      document.querySelectorAll('[class*="set"], [class*="expansion"], [data-set]').forEach((el: Element) => {
        const text = el.textContent?.trim() || '';
        const setAttr = el.getAttribute('data-set');
        
        if (text && text.length > 2 && text.length < 100) {
          // Intentar construir URL
          const href = (el as HTMLAnchorElement).href || 
                       (el.closest('a') as HTMLAnchorElement)?.href ||
                       `${window.location.origin}/cards?set=${encodeURIComponent(text)}`;
          
          if (href && href.startsWith('http')) {
            setLinks.push({ name: text.substring(0, 100), url: href });
          }
        }
      });

      // Eliminar duplicados por URL y ordenar
      const unique = [...new Map(setLinks.map(s => [s.url, s])).values()];
      return unique.slice(0, 50); // Limitar a 50 expansiones
    });

    console.log(`📦 Encontradas ${sets.length} expansiones potenciales`);

    if (sets.length === 0) {
      console.log('⚠️  No se encontraron expansiones. Guardando screenshot para análisis...');
      await page.screenshot({ path: path.join(TEMP_DIR, 'page-state.png'), fullPage: false });
      console.log('💡 Revisa el screenshot en: ' + path.join(TEMP_DIR, 'page-state.png'));
      console.log('💡 Puedes modificar el script para buscar expansiones de otra forma');
    }

    // Procesar cada expansión
    let totalCardsSaved = 0;
    
    for (let i = 0; i < Math.min(sets.length, 5); i++) { // Limitar a 5 expansiones para prueba
      const set = sets[i];
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Expansión ${i + 1}/${Math.min(sets.length, 5)}: ${set.name}`);
      
      const cards = await scrapeSetCards(page, set.url, set.name);

      if (cards.length > 0) {
        // Guardar en base de datos
        const { data, error } = await supabase
          .from('pokemon_cards')
          .upsert(cards, { onConflict: 'card_id', ignoreDuplicates: false });

        if (error) {
          console.error(`  ❌ Error guardando en DB: ${error.message}`);
        } else {
          console.log(`  ✅ ${cards.length} cartas guardadas en la base de datos`);
          totalCardsSaved += cards.length;
        }
      }

      // Esperar entre expansiones
      if (i < Math.min(sets.length, 5) - 1) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Proceso completado!`);
    console.log(`   Total de cartas guardadas: ${totalCardsSaved}`);
    console.log(`${'='.repeat(50)}\n`);

    // Mantener el navegador abierto por 10 segundos
    console.log('⏳ Manteniendo navegador abierto por 10 segundos para inspección...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error: any) {
    console.error('💥 Error fatal:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    
    // Limpiar directorio temporal
    if (fs.existsSync(TEMP_DIR)) {
      const files = fs.readdirSync(TEMP_DIR);
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(TEMP_DIR, file));
        } catch (e) {
          // Ignorar errores de limpieza
        }
      });
    }
  }
}

// Ejecutar script
main().catch(console.error);

