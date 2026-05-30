Weeds.dk - Master Dokumentation (AI Context File)

Dette dokument fungerer som "hukommelsen" for projektet Weeds.dk. Det skal bruges til at give kontekst til AI-assistenter (Windsurf, Cursor, ChatGPT, Claude etc.), så udviklingen altid fortsætter i den rigtige retning, og koden forbliver ren og konsistent.

AI INSTRUKTION: Læs altid dette dokument før du foreslår ændringer til koden.

1. Projektets DNA

Domæne: weeds.dk

Koncept: En uafhængig, luksuriøs og klinisk funderet kurator af lovlige CBD-produkter via en affiliate-forretningsmodel.

Målgruppe: 35-65-årige mænd og kvinder i Norden. Et modent publikum, der søger kognitiv klarhed, bedre søvn og fysiologisk restitution.

Tone of Voice: Rolig, intellektuel, ærlig og kompromisløs. Vi bruger ord som "erhverv" i stedet for "køb", og vi undgår aggressiv og syntetisk wellness-markedsføring.

2. Den Tekniske Stack (Hvordan det er bygget)

Projektet er bevidst holdt super simpelt, statisk og lynhurtigt. AI Rule: Foreslå ikke tunge frameworks som React, Next.js eller WordPress. Vi holder os til fundamentet.

Arkitektur: Statisk Single Page Application (SPA).

Sprog: Ren HTML, CSS og Vanilla JavaScript.

Styling: Tailwind CSS (hentet via CDN for nemhedens skyld).

Ikoner: Lucide Icons.

Sprogmotor (i18n): Et specialbygget, letvægts JavaScript-system i bunden af filerne, der gør det muligt at skifte sprog (DA/EN) uden at genindlæse siden (via data-i18n attributter).

Hosting: Deployes direkte fra GitHub til Vercel (Continuous Deployment).

3. SEO & Performance (Meget vigtigt)

For at sikre at Weeds.dk rangerer højt på Google (SEO) og Geolocation-søgninger:

Vi bruger semantisk HTML (korrekt brug af <nav>, <section>, <article>, <h1> til <h4>).

Alle billeder SKAL have beskrivende alt-tekster.

Siden skal loade øjeblikkeligt. Billeder skal komprimeres, og vi undgår unødvendige eksterne scripts.

4. Filer og Mappestruktur

Lige nu holdes alt i en flad struktur for at gøre det nemt at håndtere:

index.html - Hovedsiden (Forside, filosofi, kollektion, erfaringer, journal).

privacy.html - Privatlivspolitik (GDPR-compliance).

Planlagt: terms.html - Handelsbetingelser (kommer senere).

Planlagt: assets/ - En mappe til fremtidige lokale, optimerede billeder.

5. Design & Æstetik (The Caniggma Look)

Designet skal føles mørkt, eksklusivt, klinisk rent og med masser af luft (whitespace).

Farvepalette: Mutede naturfarver. Varm sten/knækket hvid (bg-[#fcfbf9]), dyb oliven (bg-[#262b24]), og carbon-sort (text-[#1c1c1c]).

Typografi (Overskrifter): Playfair Display (Serif) - Giver det klassiske, redaktionelle magasin-look.

Typografi (Brødtekst): Inter (Sans-serif) - Sikrer perfekt læsbarhed på moderne skærme.

6. Deployment Arbejdsgang (Den Gyldne Rutine)

For at opdatere live-siden på weeds.dk, udføres følgende 3 trin i Windsurf terminalen:

git add . (Gør alle ændringer klar)

git commit -m "Kort og præcis beskrivelse af ændringen" (Gemmer ændringen lokalt)

git push (Sender ændringen til GitHub, hvorefter Vercel automatisk opdaterer siden online).