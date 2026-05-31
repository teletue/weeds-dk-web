Opsætning af din automatiske nyhedsrobot

Vi vil nu bygge en fuldautomatisk "robot", der kører i baggrunden en gang i døgnet, henter de nyeste cannabis-artikler, får dem oversat og kategoriseret af Gemini, og derefter opdaterer weeds.dk – helt uden at du skal gøre noget!

Her er hvordan vi gør det trin-for-trin inde i Windsurf.

Trin 1: Klargør projektet i Windsurf

Åbn din weeds-dk-web mappe i Windsurf.

Opret en ny fil i rodmappen, der hedder præcis fetch-news.js, og indsæt koden fra dokumentet ved siden af.

Åbn din terminal i Windsurf (`Ctrl + `` eller via topmenuen Terminal -> New Terminal).

Vi skal installere en lille hjælpepakke til internet-anmodninger. Kør denne kommando i terminalen:

npm install node-fetch


Trin 2: Hent en gratis Gemini API-nøgle

For at robotten kan oversætte og kategorisere nyhederne, skal den have adgang til Gemini. Det er gratis for os i det omfang, vi bruger det.

Gå til Google AI Studio og log ind med din normale Google-konto.

Klik på knappen "Get API key" i øverste venstre hjørne.

Opret en ny API-nøgle (Create API Key) til et nyt eller eksisterende projekt.

Kopiér den lange nøgle, der starter med AIzaSy....

Trin 3: Test robotten lokalt på din computer

Nu kan vi køre en test og se, om robotten faktisk kan hente og oversætte nyhederne.

I din Windsurf-terminal skal du først "fortælle" din computer din API-nøgle. Kør denne kommando (erstat med din egen nøgle):

I Windows (PowerShell):

$env:GEMINI_API_KEY="DIN_KOPIEREDE_API_NØGLE_HER"


På Mac / Linux:

export GEMINI_API_KEY="DIN_KOPIEREDE_API_NØGLE_HER"


Kør nu selve scriptet:

node fetch-news.js


Hvis alt virker, vil terminalen skrive "Succes!", og du vil nu have en splinterny fil liggende i din assets-mappe: assets/news.json. Åbn den og nyd det smukke, oversatte danske sprog!

Trin 4: Sæt automatisk kørsel op i GitHub (Gratis)

Nu skal vi få GitHub til at køre dette script for os helt automatisk hver morgen kl. 08:00.

I Windsurf skal du oprette en ny mappe-struktur i din rodmappe. Den skal hedde præcis: .github/workflows/

Inde i den mappe, opret en ny fil, der hedder: news-cron.yml

Sæt denne konfiguration ind i filen:

name: Daily weeds.dk News Sync

on:
  schedule:
    - cron: '0 7 * * *' # Kører kl. 07:00 UTC (kl. 08:00 eller 09:00 dansk tid)
  workflow_dispatch: # Gør det muligt at starte manuelt fra GitHubs hjemmeside

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install node-fetch

      - name: Run translation robot
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        run: node fetch-news.js

      - name: Commit and push changes
        run: |
          git config --global user.name "weeds-bot"
          git config --global user.email "bot@weeds.dk"
          git add assets/news.json
          git diff-index --quiet HEAD || git commit -m "Automatisk nyhedsopdatering [skip ci]"
          git push


Det sidste trin på GitHubs hjemmeside:

For at GitHub må bruge din API-nøgle uden at andre kan se den:

Gå ind på dit repository på GitHub.com i din browser.

Klik på Settings -> Secrets and variables -> Actions i venstre menu.

Klik på New repository secret.

Kald den præcis GEMINI_API_KEY, indsæt din API-nøgle som værdi, og klik på Add secret.

Færdig! Nu vil GitHub køre scriptet, opdatere news.json i dit repo, og Vercel vil automatisk fange ændringen og opdatere weeds.dk helt af sig selv.