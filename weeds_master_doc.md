Weeds.dk - Master Dokumentation (AI Context File)

Dette dokument fungerer som "hukommelsen" for projektet Weeds.dk. Det skal bruges til at give kontekst til fremtidige AI-assistenter (Windsurf, Cursor, ChatGPT, Claude etc.), så udviklingen altid fortsætter i den rigtige retning.

AI INSTRUKTION: Læs altid dette dokument før du foreslår ændringer til koden. Bevar tone of voice, og hold al kode i single-file strukturen (HTML/Tailwind/Vanilla JS).

1. Projektets DNA

Domæne: weeds.dk

Koncept: En uafhængig, luksuriøs og klinisk funderet kurator af lovlige cannabinoider via en affiliate-forretningsmodel.

Sortiment: Udviklet fra udelukkende CBD til nu at omfatte hele plantens spektrum, herunder THCa, med en forberedt infrastruktur til fremtidens THC-holdige botaniske gastronomi og drikkevarer.

Målgruppe: 35-65-årige mænd og kvinder i Norden. Et modent publikum, der søger kognitiv klarhed, bedre søvn og fysiologisk restitution.

Tone of Voice: Rolig, intellektuel, ærlig og kompromisløs. Vi navigerer udenom "stoner"-kultur og aggressiv wellness-marketing. Vi "erhverver" i stedet for at "købe".

2. Den Tekniske Stack & SEO

Arkitektur: Statisk Single Page Application (SPA). Bygget for maksimal hastighed og SEO-performance.

Sprog/Framework: Ren HTML5, Vanilla JavaScript, Tailwind CSS (via CDN). INGEN tunge frameworks (React/Next.js).

Sprogmotor (i18n): Et custom, letvægts JavaScript-dictionary (translations-objektet) i bunden af index.html. Skifter sprog via data-i18n attributter uden reload.

Dynamisk Data (RSS): Live nyheder hentes via JavaScript Fetch API, og konverteres gennem rss2json for at omgå CORS-restriktioner.

SEO Principper: Semantisk HTML, mobil-først design (responsive Tailwind-klasser), hurtig load-tid, og strukturerede overskrifter (H1-H3).

3. Filer og Mappestruktur

/index.html - Kernen. (Forside, Filosofi, Kollektion, RSS Nyheder, Erfaringer, Journal).

/privacy.html - Privatlivspolitik (GDPR).

/terms.html - [Planlagt] Handelsbetingelser.

/assets/ - Mappen til lokalt hostede, egne AI-genererede billeder (f.eks. cbd-drops.jpg, thca-crystals.jpg). Billeder bør holdes under 300kb for performance.

4. Design & Æstetik (The Caniggma Look)

Farver: Mutede naturfarver. Varm sten/knækket hvid (bg-[#fcfbf9]), dyb oliven (bg-[#262b24]), carbon-sort (text-[#1c1c1c]).

Overskrifter: Playfair Display (Serif) for det redaktionelle, print-lignende look.

Brødtekst: Inter (Sans-serif) for absolut læsbarhed.

5. Deployment Arbejdsgang (Den Gyldne Rutine)

Køres i Windsurf terminalen:

git add .

git commit -m "Beskriv ændringen her"

git push
(Trigger automatisk et live-build på Vercel).