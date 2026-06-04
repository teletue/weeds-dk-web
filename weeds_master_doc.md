Weeds.dk - Master Dokumentation (AI Context File)

Dette dokument fungerer som "hukommelsen" for projektet Weeds.dk. Det skal bruges til at give kontekst til fremtidige AI-assistenter (Windsurf, Cursor, ChatGPT, Claude etc.), så udviklingen altid fortsætter i den rigtige retning.

AI INSTRUKTION: Læs altid dette dokument før du foreslår ændringer til koden. Bevar tone of voice, og hold al kode i single-file strukturen (HTML/Tailwind/Vanilla JS).

1. Projektets DNA

Domæne: weeds.dk

Koncept: En uafhængig, luksuriøs og klinisk funderet kurator af hele cannabisplantens spektrum (CBD, THCa og fremtidige THC-holdige botaniske formuleringer) via en gennemsigtig affiliate-model.

Målgruppe: 35-65-årige mænd og kvinder i Norden. Et modent publikum, der søger kognitiv klarhed, restitution og dyb søvn.

Tone of Voice: Rolig, intellektuel, videnskabelig, ærlig og kompromisløs. Vi bruger "Sentence Case" på dansk (kun første ord og egennavne med stort). Vi undgår stoner-slang. Vi bruger ord som "erhverve" frem for "købe".

Brand Identity: Minimalistisk, konsekvent lowercase weeds.dk i mørke, dæmpede naturtoner for et eksklusivt, print-agtigt magasin-look.

2. Den Tekniske Stack & Sprog

Arkitektur: Statisk Single Page Application (SPA). Bygget for maksimal indlæsningshastighed og ren SEO.

Sprog/Framework: Ren HTML5, Vanilla JavaScript, Tailwind CSS (via CDN). INGEN tunge frameworks.

Sprogmotor (i18n): Et letvægts JavaScript-dictionary (translations) i bunden af index.html. Skifter sprog via data-i18n attributter uden genindlæsning. Standardiseret på dansk (da) og engelsk (en).

Dynamisk Data & Automatisering: Nyheder genereres i baggrunden af det autonome 5-agent redaktionssystem i fetch-news.js ved hjælp af Gemini API via Google AI Studio.

Reader View (Magasintilstand): Artiklerne indlæses lokalt fra assets/news.json. Når en bruger klikker på et nyhedskort, åbnes artiklen direkte på siden i et luksuriøst, uforstyrret læse-overlay. contentDA-feltet indeholder fuld HTML og splittes i afsnit (<p>-tags). Dette holder på brugeren og forbedrer konverteringen.

Kontekstuel Affiliate-integration: I bunden af hver artikel i Reader View indlæses automatisk en skræddersyet og relevant købsanbefaling baseret på artiklens kategori (f.eks. parres "Kognition" med THCa-ekstrakten, og "Fysiologi" med CBD-dråberne).

Design-principper: Varm sten/knækket hvid (bg-[#fcfbf9]), dyb oliven (bg-[#262b24]), carbon-sort (text-[#1c1c1c]). Playfair Display (Serif) til overskrifter, Inter (Sans-serif) til brødtekst.

3. Det Autonome 5-Agent Redaktionssystem (fetch-news.js)

Kør: $env:GEMINI_API_KEY="din-nøgle"; node fetch-news.js

AGENT 1 — COLLECTOR
Indsamler fra tre fokuserede Google News RSS-feeds (dansk cannabis-lovgivning, europæisk CBD/THCa, international forskning).
Scanner desuden /ingest/*.txt filer for manuel ingest (pressemeddelelser, rapporter, webshopartikler).
Sletter automatisk .txt filer fra /ingest/ efter vellykket behandling.

AGENT 2 — NEWS EDITOR
Scorer hver artikel 1-10 for relevans til weeds.dk målgruppen.
Kategorier: Lovgivning, THCA, CBD, Medicinsk Cannabis, Marked, Forskning, Politik, Industriel Hamp, Virksomheder, Kultur.
Kun score 7+ sendes videre i pipelinen.

AGENT 3 — FACT CHECKER
Verificerer fakta via Gemini. Sætter status="review_required" ved tydelige faktuelle fejl.
Artikler med review_required publiceres ikke.

AGENT 4 — DANISH EDITOR
Omskriver kildematerialet til professionel dansk journalistik i HTML-format (800-1500 ord).
Struktur: H1 + introduktion, 3x H2 + brødtekst, konklusion, kildeliste.
Overholder redaktionelle principper: neutral, faktabaseret, ikke AI-agtig.

AGENT 5 — SEO EDITOR & PUBLISHER
Genererer SEO-titel (max 60 tegn), meta-beskrivelse (max 155 tegn), URL-slug, tags og billedprompt.
Output gemmes i assets/wordpress_ready.json.

DUPLIKATKONTROL
Nye artikler tjekkes mod eksisterende news.json via titelsammenligning (fuzzy match >65% ordlighed afviser).

OUTPUT-FILER
assets/news.json            — Reader View format til index.html (nye artikler flettet forrest, maks 20 total)
assets/wordpress_ready.json — Fuld WordPress-klar publiceringsdata inkl. SEO-felter og featured image prompt

MANUEL INGEST (Hampepartiet / webshops / pressemeddelelser)
1. Gem rå tekst som en .txt fil i /ingest/ mappen
2. Første linje i filen bruges som artiklens råtitel
3. Kør: node fetch-news.js
4. Filen slettes automatisk efter vellykket behandling

4. Præcise Billedfilnavne i assets/

Produktkort 1 — CBD olie:        assets/cbd_olie_første billede.png
Produktkort 2 — THCa diamanter:  assets/thca_diamonds.png
Produktkort 3 — Gastronomi:      assets/thca_mocktail.png

Alle billedfiler har onerror-fallback til Unsplash i index.html.

5. Deployment Arbejdsgang (Den Gyldne Rutine)

Køres i Windsurf terminalen:

git add .

git commit -m "Beskriv ændringen her"

git push
(Trigger automatisk et lynhurtigt live-build på Vercel).