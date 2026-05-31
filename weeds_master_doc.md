Weeds.dk - Master Dokumentation (AI Context File)

Dette dokument fungerer som "hukommelsen" for projektet Weeds.dk. Det skal bruges til at give kontekst til fremtidige AI-assistenter (Windsurf, Cursor, ChatGPT, Claude etc.), så udviklingen altid fortsætter i den rigtige retning.

AI INSTRUKTION: Læs altid dette dokument før du foreslår ændringer til koden. Bevar tone of voice, og hold al kode i single-file strukturen (HTML/Tailwind/Vanilla JS).

1. Projektets DNA

Domæne: weeds.dk

Koncept: En uafhængig, luksuriøs og klinisk funderet kurator af hele cannabisplantens spektrum (CBD, THCa og fremtidige THC-holdige botaniske formuleringer) via en gennemsigtig affiliate-model.

Målgruppe: 35-65-årige mænd og kvinder i Norden. Et modent publikum, der søger kognitiv klarhed, restitution og dyb søvn.

Tone of Voice: Rolig, intellektuel, videnskabelig, ærlig og kompromisløs. Vi bruger "Sentence Case" på dansk (kun overskrifter og navne med stort). Vi undgår stoner-slang. Vi bruger ord som "erhverve" frem for "købe".

Brand Identity: Minimalistisk, konsekvent lowercase weeds.dk i mørke, dæmpede naturtoner for et eksklusivt, print-agtigt magasin-look.

2. Den Tekniske Stack & Sprog

Arkitektur: Statisk Single Page Application (SPA). Bygget for maksimal indlæsningshastighed og ren SEO.

Sprog/Framework: Ren HTML5, Vanilla JavaScript, Tailwind CSS (via CDN). INGEN tunge frameworks.

Sprogmotor (i18n): Et letvægts JavaScript-dictionary (translations) i bunden af index.html. Skifter sprog via data-i18n attributter uden genindlæsning. Standardiseret på dansk (da) og engelsk (en).

Dynamisk Data & Automatisering: Nyheder genereres i baggrunden af robotten fetch-news.js ved hjælp af Gemini API via Google AI Studio.

Reader View (Magasintilstand): Artiklerne indlæses lokalt fra assets/news.json. Når en bruger klikker på et nyhedskort, åbnes artiklen direkte på siden i et luksuriøst, uforstyrret læse-overlay. Dette holder på brugeren og forbedrer konverteringen.

Kontekstuel Affiliate-integration: I bunden af hver artikel i Reader View indlæses automatisk en skræddersyet og relevant købsanbefaling baseret på artiklens kategori (f.eks. parres "Kognition" med THCa-ekstrakten, og "Fysiologi" med CBD-dråberne).

Design-principper: Varm sten/knækket hvid (bg-[#fcfbf9]), dyb oliven (bg-[#262b24]), carbon-sort (text-[#1c1c1c]). Playfair Display (Serif) til overskrifter, Inter (Sans-serif) til brødtekst.

3. Deployment Arbejdsgang (Den Gyldne Rutine)

Køres i Windsurf terminalen:

git add .

git commit -m "Beskriv ændringen her"

git push
(Trigger automatisk et lynhurtigt live-build på Vercel).