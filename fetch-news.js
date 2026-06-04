/**
 * weeds.dk — Autonomt 5-Agent Redaktionssystem
 *
 * AGENT 1 — COLLECTOR    : Henter fra RSS-feeds + /ingest/*.txt filer
 * AGENT 2 — NEWS EDITOR  : Scorer relevans (score 7+ sendes videre)
 * AGENT 3 — FACT CHECKER : Verificerer fakta via Gemini
 * AGENT 4 — DANISH EDITOR: Omskriver til dansk journalistik i HTML-format
 * AGENT 5 — SEO EDITOR   : Genererer SEO-felter og WordPress-publiceringsdata
 *
 * Output:
 *   assets/news.json           — Reader View format til index.html frontend
 *   assets/wordpress_ready.json — Fuld WordPress-klar publiceringsdata
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Konfiguration ────────────────────────────────────────────────────────────

const GEMINI_API_KEY  = process.env.GEMINI_API_KEY;
const GEMINI_MODEL    = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RSS_FEEDS = [
  'https://news.google.com/rss/search?q=cannabis+CBD+THC+Danmark&hl=da&gl=DK&ceid=DK:da',
  'https://news.google.com/rss/search?q=cannabidiol+lovgivning+Europa+Norden&hl=da&gl=DK&ceid=DK:da',
  'https://news.google.com/rss/search?q=THCA+medicinsk+cannabis+forskning&hl=en-US&gl=US&ceid=US:en',
];

const INGEST_DIR   = path.join(__dirname, 'ingest');
const OUTPUT_NEWS  = path.join(__dirname, 'assets', 'news.json');
const OUTPUT_WP    = path.join(__dirname, 'assets', 'wordpress_ready.json');
const MAX_NEW      = 3;   // maks nye artikler pr. kørsel
const MAX_STORED   = 20;  // maks artikler i news.json

const VALID_CATEGORIES = [
  'Lovgivning', 'THCA', 'CBD', 'Medicinsk Cannabis',
  'Marked', 'Forskning', 'Politik', 'Industriel Hamp', 'Virksomheder', 'Kultur'
];

// ─── Hjælpefunktioner ─────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ae/g, 'ae').replace(/oe/g, 'oe').replace(/aa/g, 'aa')
    .replace(/[\u00e6]/g, 'ae').replace(/[\u00f8]/g, 'oe').replace(/[\u00e5]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normaliseTitle(t) {
  return t.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY ikke sat som miljoevariabel.');

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`Gemini API fejl: ${data.error.message}`);
  if (!data.candidates || data.candidates.length === 0) throw new Error('Tomt svar fra Gemini API.');

  const raw     = data.candidates[0].content.parts[0].text.trim();
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

// ─── RSS Parser ───────────────────────────────────────────────────────────────

function parseRSS(xml) {
  const items  = [];
  const itemRx = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRx.exec(xml)) !== null) {
    const block = m[1];
    const title = (
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
      block.match(/<title>([\s\S]*?)<\/title>/)
    )?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
    const date = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
    const desc = (
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
      block.match(/<description>([\s\S]*?)<\/description>/)
    )?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

    if (title && link) {
      items.push({
        title,
        link,
        pubDate:    date || new Date().toUTCString(),
        rawContent: desc,
        source:     'RSS'
      });
    }
  }
  return items;
}

// ════════════════════════════════════════════════════════════════════════════
// AGENT 1 — COLLECTOR
// ════════════════════════════════════════════════════════════════════════════

async function agent1_collect() {
  console.log('\n[AGENT 1 - COLLECTOR] Starter indsamling...');
  const collected = [];

  // 1a. RSS-feeds
  for (const url of RSS_FEEDS) {
    try {
      console.log('  RSS: ' + url.substring(0, 80) + '...');
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeedsDKBot/2.0; +https://weeds.dk)' },
        signal: AbortSignal.timeout(15000)
      });
      const xml   = await res.text();
      const items = parseRSS(xml);
      console.log('  -> ' + items.length + ' artikler fundet');
      collected.push(...items);
    } catch (err) {
      console.warn('  Advarsel: RSS-feed fejlede: ' + err.message);
    }
    await sleep(500);
  }

  // 1b. /ingest/*.txt filer
  if (fs.existsSync(INGEST_DIR)) {
    const txtFiles = fs.readdirSync(INGEST_DIR).filter(f => f.endsWith('.txt'));
    console.log('  Ingest-mappe: ' + txtFiles.length + ' .txt fil(er) fundet');
    for (const file of txtFiles) {
      const filePath = path.join(INGEST_DIR, file);
      const content  = fs.readFileSync(filePath, 'utf-8').trim();
      if (content.length > 20) {
        const firstLine = content.split('\n')[0].trim();
        collected.push({
          title:      firstLine.substring(0, 200),
          link:       'ingest://' + file,
          pubDate:    new Date().toUTCString(),
          rawContent: content,
          source:     'ingest/' + file
        });
        console.log('  -> Ingest: "' + firstLine.substring(0, 60) + '"');
      }
    }
  } else {
    fs.mkdirSync(INGEST_DIR, { recursive: true });
    console.log('  Ingest-mappe oprettet (tom). Placer .txt filer her for manuel ingest.');
  }

  console.log('[AGENT 1] Indsamlet ' + collected.length + ' raaartikler i alt.');
  return collected;
}

// ════════════════════════════════════════════════════════════════════════════
// AGENT 2 — NEWS EDITOR
// ════════════════════════════════════════════════════════════════════════════

async function agent2_score(article) {
  const prompt = `
Du er chefredaktoer paa weeds.dk - et professionelt dansk medie om cannabis, cannabinoider og relateret lovgivning, forskning og kultur.

Vurder om denne artikel er relevant for vores laesere (35-65-aarige nordboere).

Artikel:
Titel: "${article.title}"
Indhold: "${(article.rawContent || '').substring(0, 500)}"

SCORING (vaelg eet tal):
10 = Stor europaisk betydning
9  = Stor nordisk/dansk betydning
8  = Direkte dansk relevans
7  = Relevant branchehistorie
6 eller lavere = Afvis (for generisk, ikke relevant, spam)

KATEGORIER (vaelg praecis een):
${VALID_CATEGORIES.join(', ')}

Returner KUN dette JSON (ingen markdown):
{
  "score": <tal 1-10>,
  "category": "<kategori>",
  "reasoning": "<1 saetning paa dansk>"
}`;

  try {
    const result   = await callGemini(prompt);
    const score    = parseInt(result.score, 10);
    const category = VALID_CATEGORIES.includes(result.category) ? result.category : 'Forskning';
    console.log('  Score: ' + score + '/10 | Kategori: ' + category + ' | ' + result.reasoning);
    return { score, category, reasoning: result.reasoning };
  } catch (err) {
    console.warn('  Agent 2 fejlede for "' + article.title + '": ' + err.message);
    return { score: 0, category: 'Forskning', reasoning: 'Scoringsfejl' };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AGENT 3 — FACT CHECKER
// ════════════════════════════════════════════════════════════════════════════

async function agent3_factcheck(article) {
  const prompt = `
Du er faktakontrolredaktoer paa weeds.dk.

Gennemgaa disse paastand fra artiklen og vurder trovaerdighed:
Titel: "${article.title}"
Indhold: "${(article.rawContent || '').substring(0, 800)}"

Kontroller:
- Er navne, lovgivning og datoer sandsynlige?
- Er tal og procenter realistiske?
- Er der tydelige faktuelle fejl eller vildledende paastand?

Returner KUN dette JSON (ingen markdown):
{
  "verified": <true eller false>,
  "status": "<ok eller review_required>",
  "issues": ["<evt. issue 1>", "<evt. issue 2>"]
}

Saet verified=true og status="ok" hvis der ikke er aabenlyse problemer.
Saet verified=false og status="review_required" KUN ved tydelige faktuelle fejl.`;

  try {
    const result = await callGemini(prompt);
    console.log('  Faktakontrol: ' + result.status + ' | Issues: ' + (result.issues ? result.issues.length : 0));
    return result;
  } catch (err) {
    console.warn('  Agent 3 fejlede (antager ok): ' + err.message);
    return { verified: true, status: 'ok', issues: [] };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AGENT 4 — DANISH EDITOR
// ════════════════════════════════════════════════════════════════════════════

async function agent4_write(article, category) {
  const prompt = `
Du er chefredaktoer og journalist paa weeds.dk - et eksklusivt dansk online magasin om cannabinoider til en moden nordisk maalgruppe (35-65 aar).

KILDEARTIKEL:
Titel: "${article.title}"
Kilde: ${article.source}
Raa tekst: "${(article.rawContent || '(ingen raa tekst - skriv ud fra titlen)').substring(0, 1200)}"

OPGAVE:
Skriv en professionel dansk journalistisk artikel om dette emne.

STIL:
- Neutral, faktabaseret, ikke sensationspraeget
- Ikke reklame, ikke AI-agtig
- Forklar fagtermer for almindelige danske laesere
- Tilfoj dansk/nordisk relevans hvis muligt

STRUKTUR (HTML-format, 800-1500 ord):
<h1>[Overskrift i Sentence Case]</h1>
<p>[Introduktion - 2-3 saetninger]</p>
<h2>[Underoverskrift]</h2>
<p>[Brodtekst]</p>
<h2>[Underoverskrift]</h2>
<p>[Brodtekst]</p>
<h2>[Underoverskrift]</h2>
<p>[Brodtekst]</p>
<p>[Konklusion]</p>
<p><strong>Kilder:</strong><br>
* [Kilde 1]<br>
* [Kilde 2]<br>
* [Kilde 3]</p>

REGLER:
- Sentence Case paa dansk (kun foerste ord og egennavne med stort)
- Ingen sensationsoverskrifter
- Tilfoj aldrig oplysninger der ikke fremgaar af kilden eller er alment kendte fakta

Returner KUN dette JSON (ingen markdown-blokke):
{
  "title": "<dansk overskrift i sentence case>",
  "excerptDA": "<1 faengende saetning der opsummerer artiklen>",
  "contentDA": "<fuld HTML-artikel som beskrevet ovenfor>",
  "category": "${category}"
}`;

  const result = await callGemini(prompt);
  if (!result.title || !result.contentDA) throw new Error('Ufuldstaendigt svar fra Agent 4');
  return result;
}

// ════════════════════════════════════════════════════════════════════════════
// AGENT 5 — SEO EDITOR & PUBLISHER
// ════════════════════════════════════════════════════════════════════════════

async function agent5_seo(article, written, category, score) {
  const prompt = `
Du er SEO-redaktoer paa weeds.dk.

Artiklens titel: "${written.title}"
Uddrag: "${written.excerptDA}"
Kategori: "${category}"

Generer publiceringsdata til WordPress.

Returner KUN dette JSON (ingen markdown):
{
  "seo_title": "<SEO-optimeret titel, max 60 tegn>",
  "meta_description": "<meta beskrivelse, max 155 tegn, paa dansk>",
  "slug": "<url-slug paa dansk, kun lowercase bogstaver og bindestreger>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"],
  "featured_image_prompt": "Photorealistic journalism photography. High-end magazine style. No text. 16:9. Natural lighting. Editorial quality. Subject: <beskriv billedmotiv relevant for artiklen paa engelsk>"
}`;

  try {
    const seo = await callGemini(prompt);
    return {
      title:                 written.title,
      seo_title:             seo.seo_title             || written.title.substring(0, 60),
      meta_description:      seo.meta_description      || written.excerptDA.substring(0, 155),
      slug:                  seo.slug                  || slugify(written.title),
      excerpt:               written.excerptDA,
      category:              category,
      tags:                  seo.tags                  || [category],
      featured_image_prompt: seo.featured_image_prompt || '',
      article_html:          written.contentDA,
      link:                  article.link,
      pubDate:               article.pubDate,
      score:                 score,
      status:                'publish'
    };
  } catch (err) {
    console.warn('  Agent 5 fejlede (bruger fallback): ' + err.message);
    return {
      title:                 written.title,
      seo_title:             written.title.substring(0, 60),
      meta_description:      written.excerptDA.substring(0, 155),
      slug:                  slugify(written.title),
      excerpt:               written.excerptDA,
      category:              category,
      tags:                  [category],
      featured_image_prompt: '',
      article_html:          written.contentDA,
      link:                  article.link,
      pubDate:               article.pubDate,
      score:                 score,
      status:                'publish'
    };
  }
}

// ─── Duplikatkontrol ──────────────────────────────────────────────────────────

function isDuplicate(title, existingArticles) {
  const norm = normaliseTitle(title);
  return existingArticles.some(a => {
    const existing = normaliseTitle(a.title);
    if (norm === existing) return true;
    const words1  = norm.split(' ').filter(w => w.length > 4);
    const words2  = existing.split(' ').filter(w => w.length > 4);
    if (words1.length === 0) return false;
    const shared  = words1.filter(w => words2.includes(w)).length;
    return (shared / words1.length) > 0.65;
  });
}

// ─── Indlaes og gem JSON ──────────────────────────────────────────────────────

function loadExisting(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (_) {}
  return [];
}

function saveJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Slet ingest-fil efter behandling ────────────────────────────────────────

function deleteIngestFile(article) {
  if (article.source && article.source.startsWith('ingest/')) {
    const fileName = article.source.replace('ingest/', '');
    const filePath = path.join(INGEST_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('  Slettet behandlet ingest-fil: ' + article.source);
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HOVED-ORCHESTRATOR
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('============================================================');
  console.log('   weeds.dk - Autonomt 5-Agent Redaktionssystem             ');
  console.log('============================================================');

  if (!GEMINI_API_KEY) {
    console.error('\nKritisk: GEMINI_API_KEY er ikke sat. Koer med:\n  $env:GEMINI_API_KEY="din-noggle"; node fetch-news.js\n');
    process.exit(1);
  }

  const existingNews = loadExisting(OUTPUT_NEWS);
  const existingWP   = loadExisting(OUTPUT_WP);
  const newNewsItems = [];
  const newWPItems   = [];
  let published = 0;
  let rejected  = 0;

  // AGENT 1 — Indsaml alle raa artikler
  const rawArticles = await agent1_collect();

  // Fjern interne duplikater fra denne koersel
  const seen      = new Set();
  const uniqueRaw = rawArticles.filter(a => {
    const key = normaliseTitle(a.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const article of uniqueRaw) {
    if (published >= MAX_NEW) break;

    console.log('\n--- Behandler: "' + article.title.substring(0, 80) + '" ---');

    // Duplikatkontrol mod eksisterende news.json
    if (isDuplicate(article.title, [...existingNews, ...newNewsItems])) {
      console.log('  [AFVIST] Duplikat fundet - springer over.');
      rejected++;
      continue;
    }

    // AGENT 2 — Vurder relevans
    console.log('[AGENT 2 - NEWS EDITOR]');
    const editorial = await agent2_score(article);
    await sleep(800);

    if (editorial.score < 7) {
      console.log('  [AFVIST] Score ' + editorial.score + ' < 7 - ikke relevant nok.');
      rejected++;
      continue;
    }

    // AGENT 3 — Faktakontrol
    console.log('[AGENT 3 - FACT CHECKER]');
    const factCheck = await agent3_factcheck(article);
    await sleep(800);

    if (factCheck.status === 'review_required') {
      console.log('  [AFVIST] Faktakontrol: review_required - ' + (factCheck.issues || []).join(', '));
      rejected++;
      continue;
    }

    // AGENT 4 — Skriv dansk artikel
    console.log('[AGENT 4 - DANISH EDITOR]');
    let written;
    try {
      written = await agent4_write(article, editorial.category);
      console.log('  Artikel skrevet: "' + written.title.substring(0, 60) + '"');
    } catch (err) {
      console.error('  [FEJL] Agent 4 fejlede: ' + err.message);
      rejected++;
      continue;
    }
    await sleep(800);

    // AGENT 5 — SEO og publiceringsdata
    console.log('[AGENT 5 - SEO EDITOR]');
    const wpEntry = await agent5_seo(article, written, editorial.category, editorial.score);
    await sleep(800);

    // news.json entry (Reader View format til index.html)
    const newsEntry = {
      title:     written.title,
      link:      article.link,
      pubDate:   article.pubDate,
      excerptDA: written.excerptDA,
      contentDA: written.contentDA,
      category:  editorial.category,
      score:     editorial.score
    };

    newNewsItems.push(newsEntry);
    newWPItems.push(wpEntry);
    published++;

    // Slet ingest-fil efter vellykket behandling
    deleteIngestFile(article);

    console.log('  [PUBLICERET] "' + written.title.substring(0, 60) + '"');
  }

  // Flet: nye artikler forrest, gammel arkiv bagved, maks MAX_STORED
  if (newNewsItems.length > 0) {
    const mergedNews = [...newNewsItems, ...existingNews].slice(0, MAX_STORED);
    saveJSON(OUTPUT_NEWS, mergedNews);
    console.log('\n[news.json] ' + newNewsItems.length + ' nye artikler flettet forrest. Total: ' + mergedNews.length);

    const mergedWP = [...newWPItems, ...existingWP].slice(0, MAX_STORED);
    saveJSON(OUTPUT_WP, mergedWP);
    console.log('[wordpress_ready.json] ' + newWPItems.length + ' nye poster gemt. Total: ' + mergedWP.length);
  } else {
    console.log('\nIngen nye artikler publiceret i denne koersel.');
  }

  console.log('\n============================================================');
  console.log('  Publiceret: ' + published + ' | Afvist: ' + rejected + ' | Behandlet: ' + uniqueRaw.length);
  console.log('============================================================\n');
}

main().catch(err => {
  console.error('Kritisk systemfejl:', err);
  process.exit(1);
});
