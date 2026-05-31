/**
 * weeds.dk - Automatisk Nyhedsrobot (Node.js)
 * 
 * Dette script henter internationale nyheder via RSS, sender dem til Gemini
 * for at få dem oversat til smukt dansk og kategoriseret, og gemmer dem derefter
 * lokalt i assets/news.json.
 */

const fs = require('fs');
const path = require('path');

// Dynamisk import af node-fetch (kræves i nyere Node.js versioner)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Konfiguration
const RSS_FEED_URL = 'https://mjbizdaily.com/feed/';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Hentes sikkert fra dit system
const OUTPUT_FILE = path.join(__dirname, 'assets', 'news.json');

// Hjælpefunktion til XML-parsing uden tunge eksterne biblioteker
function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null && items.length < 5) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const descMatch = itemContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemContent.match(/<description>([\s\S]*?)<\/description>/);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: dateMatch ? dateMatch[1].trim() : new Date().toUTCString(),
        description: descMatch ? descMatch[1].trim() : ''
      });
    }
  }
  return items;
}

// Kald til Gemini API for at oversætte og kategorisere
async function processWithGemini(article) {
  if (!GEMINI_API_KEY) {
    console.log("Ingen Gemini API-nøgle fundet. Bruger rå oversættelse.");
    return {
      title: article.title,
      excerptDA: article.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
      category: "Globalt"
    };
  }

  const prompt = `
  Du er en professionel, moden og intellektuel redaktør for det luksuriøse nordiske magasin weeds.dk.
  Du skal oversætte og bearbejde denne internationale cannabis-nyhed til vores modne målgruppe (35-65 år i Norden).
  
  Brug "Sentence Case" på dansk (kun stort begyndelsesbogstav i overskrifter, ligesom i en avis).
  Hold tonen klinisk, seriøs, objektiv og luksuriøs. Undgå "stoner"-slang og aggressiv marketing.
  
  Original overskrift: "${article.title}"
  Original beskrivelse: "${article.description.replace(/<[^>]*>/g, '')}"
  
  Returner KUN et råt JSON-objekt i dette præcise format (ingen markdown, ingen forklaringer):
  {
    "title": "Oversat overskrift på smukt, sobert dansk",
    "excerptDA": "Et kort, skarpt uddrag/resume på 1-2 sætninger, der fanger essensen af historien",
    "category": "Vælg én af disse kategorier: Kognition, Fysiologi, Industri, Lovgivning eller Biokemi"
  }
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const data = await response.json();
    const textResult = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResult.trim());
  } catch (error) {
    console.error("Fejl i kommunikation med Gemini:", error);
    return {
      title: article.title,
      excerptDA: "En vigtig international udvikling inden for cannabinoid-forskning og markedet.",
      category: "Industri"
    };
  }
}

// Hovedfunktion
async function main() {
  console.log("Starter synkronisering af nyheder for weeds.dk...");
  
  try {
    const rssResponse = await fetch(RSS_FEED_URL);
    const xmlText = await rssResponse.text();
    const rawArticles = parseRSS(xmlText);
    
    console.log(`Hentet ${rawArticles.length} artikler. Starter oversættelse via Gemini...`);
    
    const processedArticles = [];
    
    for (const article of rawArticles) {
      console.log(`Behandler: ${article.title}`);
      const processed = await processWithGemini(article);
      
      processedArticles.push({
        title: processed.title,
        link: article.link,
        pubDate: article.pubDate,
        excerptDA: processed.excerptDA,
        category: processed.category
      });
      
      // Pause for at overholde Gemini API rate-limits
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Sikr os, at assets-mappen findes
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Gem som JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedArticles, null, 2), 'utf-8');
    console.log(`Succes! ${processedArticles.length} nyheder er gemt i ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error("Kritisk fejl under kørsel af nyhedsrobotten:", error);
    process.exit(1);
  }
}

main();