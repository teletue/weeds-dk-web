/**
 * weeds.dk - Automatisk Nyhedsrobot (Node.js)
 * 
 * Dette script henter videnskabelige cannabis-nyheder via Google News RSS,
 * sender dem til Gemini for at få dem omsat til unikke, fulde redaktionelle 
 * artikler på smukt dansk, og gemmer dem derefter lokalt i assets/news.json.
 */

const fs = require('fs');
const path = require('path');

// Google News RSS søgning pre-filtreret til sundhed, videnskab og kliniske studier om cannabinoider
const RSS_FEED_URL = 'https://news.google.com/rss/search?q=cannabidiol+health+science+study&hl=en-US&gl=US&ceid=US:en';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_FILE = path.join(__dirname, 'assets', 'news.json');

// Hjælpefunktion til at parse XML uden tunge eksterne pakker
function parseRSS(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null && items.length < 3) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: dateMatch ? dateMatch[1].trim() : new Date().toUTCString()
      });
    }
  }
  return items;
}

// Kalder Gemini API for at transformere nyheden til en fuld redaktionel artikel på dansk
async function processWithGemini(article) {
  if (!GEMINI_API_KEY) {
    console.log("Advarsel: Ingen Gemini API-nøgle fundet.");
    return null;
  }

  const prompt = `
  Du er en professionel, intellektuel og klinisk funderet videnskabsredaktør for weeds.dk – et eksklusivt nordisk online magasin om cannabinoider til en moden målgruppe (35-65 år).
  
  Baseret på denne internationale nyhedsoverskrift: "${article.title}"
  
  Skal du skrive en fuldkommen unik, nuanceret og elegant redaktionel artikel på dansk.
  
  Følg disse strenge retningslinjer:
  1. Overskrift ("title"): Skal skrives på smukt, sobert dansk i "Sentence Case" (kun stort begyndelsesbogstav i det første ord og navne). Ingen sensations-clickbait.
  2. Uddrag ("excerptDA"): En enkelt, fængende indledende sætning, der opsummerer artiklens fysiologiske eller videnskabelige betydning.
  3. Brødtekst ("contentDA"): Skriv en dybdegående redaktionel artikel på 150-250 ord fordelt på 3 eller 4 afsnit. Tonen skal være akademisk, sober, objektiv og luksuriøs. Diskuter den kliniske betydning og virkningen på krop/sind. Brug almindelige linjeskift (\\n) til afsnitsopdeling.
  4. Kategori ("category"): Vælg præcis ÉN af disse kategorier, der passer bedst til indholdet: Kognition, Fysiologi, Industri, Lovgivning eller Biokemi.
  
  Returner KUN et råt JSON-objekt i dette præcise format (ingen markdown-blokke, ingen forklaringer):
  {
    "title": "Oversat overskrift",
    "excerptDA": "Kort og skarpt uddrag",
    "contentDA": "Første afsnit af artiklen her.\\n\\nAndet afsnit af artiklen her.\\n\\nTredje afsnit af artiklen her.",
    "category": "Kategori"
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
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Intet svar modtaget fra Gemini API.");
    }
    const textResult = data.candidates[0].content.parts[0].text;
    return JSON.parse(textResult.trim());
  } catch (error) {
    console.error("Fejl under bearbejdning med Gemini:", error);
    return null;
  }
}

// Hovedfunktion
async function main() {
  console.log("Starter synkronisering af nyheder for weeds.dk...");
  
  try {
    const rssResponse = await fetch(RSS_FEED_URL);
    const xmlText = await rssResponse.text();
    const rawArticles = parseRSS(xmlText);
    
    console.log(`Hentet ${rawArticles.length} kilde-artikler. Starter redaktionel bearbejdning...`);
    
    const processedArticles = [];
    
    for (const article of rawArticles) {
      console.log(`Behandler: ${article.title}`);
      const processed = await processWithGemini(article);
      
      if (processed) {
        processedArticles.push({
          title: processed.title,
          link: article.link,
          pubDate: article.pubDate,
          excerptDA: processed.excerptDA,
          contentDA: processed.contentDA,
          category: processed.category
        });
      }
      
      // Lille pause for at overholde API-grænser
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (processedArticles.length > 0) {
      const dir = path.dirname(OUTPUT_FILE);
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedArticles, null, 2), 'utf-8');
      console.log(`Succes! ${processedArticles.length} unikke nyheds-optegnelser er gemt i ${OUTPUT_FILE}`);
    } else {
      console.log("Fejl: Ingen artikler kunne genereres. news.json blev ikke opdateret.");
    }
    
  } catch (error) {
    console.error("Kritisk fejl under kørsel af robotten:", error);
    process.exit(1);
  }
}

main();