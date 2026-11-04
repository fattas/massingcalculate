/**
 * Growtopia Wiki API & Image integration
 * Uses Fandom MediaWiki API with static.wikia.nocookie.net CDN URLs
 */

const WIKI_API = 'https://growtopia.fandom.com/api.php';

// In-memory image URL cache (persisted to sessionStorage)
const IMG_CACHE_KEY = 'gt-img-v4';
let imgCache = {};
try {
  const stored = sessionStorage.getItem(IMG_CACHE_KEY);
  if (stored) imgCache = JSON.parse(stored);
} catch {}

function saveImgCache() {
  try {
    sessionStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
  } catch {}
}

/**
 * Search items from Growtopia Wiki
 */
export async function searchWikiItems(query, limit = 10) {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `${WIKI_API}?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    const titles = data[1] || [];
    return titles.filter(title =>
      !title.startsWith('Category:') &&
      !title.startsWith('Template:') &&
      !title.startsWith('Module:') &&
      !title.startsWith('Growtopia Wiki') &&
      !title.includes('/')
    );
  } catch (err) {
    console.warn('Wiki search failed:', err);
    return [];
  }
}

/**
 * Get item image URL from wiki using pageimages API (returns CDN URL).
 * Falls back to parsing page images if pageimages returns nothing.
 * Results are cached in sessionStorage.
 * 
 * @param {string} itemName - The item name
 * @returns {Promise<string|null>} - CDN URL or null
 */
export async function getItemImageURL(itemName) {
  if (!itemName) return null;
  
  // Check cache first
  if (imgCache[itemName] !== undefined) {
    return imgCache[itemName]; // null means "known to have no image"
  }
  
  try {
    // Strategy 1: Use pageimages API (fastest, returns main page image)
    const piUrl = `${WIKI_API}?action=query&titles=${encodeURIComponent(itemName)}&prop=pageimages&piprop=thumbnail&pithumbsize=64&format=json&origin=*`;
    const piResp = await fetch(piUrl);
    if (piResp.ok) {
      const piData = await piResp.json();
      const pages = piData.query?.pages || {};
      for (const page of Object.values(pages)) {
        if (page.thumbnail?.source) {
          imgCache[itemName] = page.thumbnail.source;
          saveImgCache();
          return page.thumbnail.source;
        }
      }
    }
    
    // Strategy 2: Parse page to find image filenames, then resolve URLs
    const parseUrl = `${WIKI_API}?action=parse&page=${encodeURIComponent(itemName)}&prop=images&format=json&origin=*`;
    const parseResp = await fetch(parseUrl);
    if (parseResp.ok) {
      const parseData = await parseResp.json();
      const images = parseData.parse?.images || [];
      // Filter to likely item images (sprites, item name matches)
      const candidates = images.filter(img => {
        const lower = img.toLowerCase();
        return (lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.jpg')) &&
               !lower.includes('icon_') && !lower.includes('logo');
      });
      
      if (candidates.length > 0) {
        // Get URL for the first candidate image
        const fileTitle = `File:${candidates[0]}`;
        const iiUrl = `${WIKI_API}?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
        const iiResp = await fetch(iiUrl);
        if (iiResp.ok) {
          const iiData = await iiResp.json();
          const iiPages = iiData.query?.pages || {};
          for (const iiPage of Object.values(iiPages)) {
            if (iiPage.imageinfo?.[0]?.url) {
              imgCache[itemName] = iiPage.imageinfo[0].url;
              saveImgCache();
              return iiPage.imageinfo[0].url;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Image fetch failed for', itemName, err);
  }
  
  // Cache the miss so we don't keep retrying
  imgCache[itemName] = null;
  saveImgCache();
  return null;
}
