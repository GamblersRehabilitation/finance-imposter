# Samen werken aan Finance Imposter

## Je ontwikkelomgeving

Installeer Node.js 24 LTS en Git. Clone deze repository, open de map en voer uit:

```bash
npm ci
npm run setup
npm run dev
```

Open http://localhost:5173. `npm run setup` maakt je eigen lokale `.env` met een zelfgekozen beheerderswachtwoord. Iedere ontwikkelaar heeft een eigen database en wachtwoord. De README legt uit hoe je één server met meerdere fysieke apparaten gebruikt.

## Een wijziging maken

Werk per verbetering op een eigen branch:

```bash
git switch main
git pull --ff-only
git switch -c feature/korte-naam
```

Controleer je wijziging voordat je deze deelt:

```bash
npm test
npm run build
git add src server tests
# Voeg ook andere bewust gewijzigde bron- of documentatiebestanden toe.
git commit -m "Beschrijf wat is verbeterd"
git push -u origin feature/korte-naam
```

Open vervolgens op GitHub een pull request naar `main`. Beschrijf wat verandert, hoe je het hebt gecontroleerd en of spelregels of placeholders geraakt worden. Laat een ander de wijziging bekijken voordat je samenvoegt.

## Afspreken voordat je gameplay verandert

De financiële laptopopdrachten, steelminigames en het gokrad zijn geïmplementeerd. De README beschrijft de gekozen spelregels en standaardbalans. Bespreek wezenlijke spelregelwijzigingen met het team. Behandel wijzigingen aan kansverdeling, beloningen en eindcondities als spelregelwijzigingen. Toestemming voor een visueel prototype betekent niet automatisch toestemming voor een nieuwe financiële spelregel.

De server is de bron van waarheid. Houd autorisatie, beloningen, geldreserveringen en deadlines op de server. Een geheime rol mag nooit in een openbare API- of WebSocketprojectie terechtkomen. Een clientflag `success: true` is geen geldig minigamebewijs.

## Lokale bestanden

Commit geen `.env`, `.env.*` behalve `.env.example`, `LOKAAL.md`, SQLite-databases, apparaat-/spelertokens, `data/`, `dist/` of `node_modules/`. `.gitignore` sluit deze bestanden uit. Gebruik uitsluitend fictieve gegevens bij tests.

## Toegang voor vrienden

De eigenaar kan in GitHub via **Settings → Collaborators** de GitHub-gebruikersnamen van het team uitnodigen. Na acceptatie kunnen zij deze privérepository clonen en wijzigingen op hun eigen branch pushen. Zonder schrijftoegang kunnen ze een eigen kopie gebruiken; de eigenaar bepaalt welke wijzigingen worden overgenomen.
