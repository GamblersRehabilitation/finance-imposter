# Neon-dataverbruik — onderzoek en optimalisatie, 24 oktober 2026

De belangrijkste vermenigvuldiger was de cloudopslag: vrijwel ieder API-verzoek haalde dezelfde volledige, gecomprimeerde SQLite-snapshot uit Neon. De snapshot bevat alle lobbies, taken, transacties, toegangsgegevens en de cache voor het eenmalig verwerken van acties. Iedere telefoon, laptop en het digibord deden op Vercel elke twee seconden zo'n verzoek. Ook een ongewijzigd scherm en de healthcheck veroorzaakten daardoor een volledige download.

Neon rekent uitgaand databaseverkeer over het publieke netwerk als Public Network Transfer. Het downloaden van de rolfilms vanaf Vercel is dus een andere verkeersstroom. Zie de [Neon-uitleg over netwerkverkeer](https://neon.com/docs/introduction/network-transfer).

## Vastgesteld in de code

| Onderdeel | Voor de wijziging | Nu |
| --- | --- | --- |
| Neon-read per API-verzoek | `INSERT ... ON CONFLICT` en `SELECT version,state`; de complete snapshot kwam terug | Initialisatie eenmaal per warme instantie; één versiequery, grote inhoud alleen wanneer nodig |
| Andere cloudinstantie schrijft iets | Complete snapshot opnieuw downloaden | Alleen ontbrekende, gecomprimeerde wijzigingen als die volledig en kleiner zijn |
| Ongewijzigde snapshot | Elke keer opnieuw downloaden en uitpakken | Gevalideerde cache van dezelfde versie hergebruiken |
| Healthcheck | Snapshot laden en engine uitvoeren | Dezelfde livenessrespons zonder databasequery |
| Eerste schermverbinding | Eerste GET plus vrijwel direct nog een poll of WebSocket-snapshot | Eén eerste poll of één WebSocket-handshake |
| Cloudpoll met onveranderd scherm | Complete rolprojectie terug naar de browser | `ETag`/`304`, geen JSON-body; actuele serverklok blijft beschikbaar |
| Verbindingsfout | Op de gewone frequentie blijven proberen | Oplopende wachttijd, maximaal dertig seconden; herstel zet de frequentie terug |
| WebSocket-update lokaal/eigen server | Complete rolprojectie per wijziging | Gewijzigde hoofdvelden; volledige beginstatus bij verbinden/herstellen |
| WebSocket-autorisatieklok | Iedere seconde sessie laden en parsen | Alleen sessie-ID opzoeken en token controleren |

De gewone cloudpoll blijft twee seconden bij een zichtbaar scherm en zes seconden op de achtergrond. Aanwezigheidsmeldingen blijven vijftien seconden; de bestaande engine beperkt daadwerkelijke updates verder. Die melding is nodig voor het apparatenoverzicht. Er is geen onbeperkt groeiende stapel pollintervallen gevonden: de dubbele opstartread, foutafhandeling en opruiming zijn wel verbeterd. De nieuwe tests controleren ook dat trage polls niet overlappen en dat ontkoppelen timers en requests stopt.

`Store.all()` en `Store.snapshot()` lezen nog steeds lokale SQLite-tabellen in het geheugen van de functie. Dat zijn geen afzonderlijke Neon-queries. Dit behoudt de bestaande engine en transactieregels. Het netwerkprobleem zat vooral in het steeds opnieuw ophalen van die volledige inhoud bij Neon; de CPU-kosten van het lokaal herstellen blijven bestaan.

## Correctheid van de cache

Elke echte spelrequest controleert de gedeelde databaseversie. Er is geen tijdvenster waarin een ongecontroleerde cache als actuele spelstatus wordt gebruikt. Een wijziging vanaf een andere Vercel-instantie wordt bij de volgende request verwerkt. Bij database-uitval volgt een foutrespons, geen mogelijk verouderde toegang of kasstand.

De bestaande volledige snapshot en atomische compare-and-swap blijven behouden. Alleen een geslaagde versie-update schrijft een bijbehorend wijzigingspakket. Gelijktijdige acties worden bij een conflict opnieuw tegen de actuele toestand uitgevoerd; tokens en acties worden pas na een geslaagde commit bevestigd. De bestaande bescherming tegen dubbel uitbetalen blijft actief.

De nieuwe tabel `finance_state_deltas` bewaart maximaal 64 wijzigingen van maximaal 64 KiB per wijziging, ongeveer 4 MiB aan inhoud exclusief PostgreSQL-overhead. Grote veranderingen krijgen alleen een lege marker. Verwijderen van een lobby wist ook eerdere wijzigingspakketten; oude lobbygegevens blijven daardoor niet in deze extra databasecache staan. De volledige actuele snapshot blijft de herstelbron. Een koude instantie, ontbrekende schakel, ongeldig controlegetal of duurdere wijzigingsreeks valt veilig terug op een volledige read. Oudere releases zonder wijzigingsjournal kunnen tijdens een uitrol blijven werken.

WebSocket-pakketten ontstaan pas nadat de server de gegevens voor de betreffende rol heeft gefilterd. Ontbrekende velden worden ook verwijderd uit de clientstatus. Een verkeerde basisversie veroorzaakt opnieuw verbinden met een volledige, geautoriseerde status. Het netwerkprotocol is optioneel: oudere WebSocket-clients blijven volledige snapshots ontvangen. De bestaande HTTP-routes en schermen blijven bruikbaar.

## WebSockets op Vercel

De lokale/eigen server gebruikt al WebSockets en verstuurt nu kleinere updates. De huidige Vercel-route werkt via een requestadapter en blijft conditioneel pollen. Dat behoudt de bestaande multiplayerwerking zonder nieuwe diensten of accounts.

Vercel ondersteunt inmiddels WebSockets. Een verbinding blijft aan één instantie gekoppeld en een herverbinding kan op een andere instantie terechtkomen. Voor een overstap van deze app naar cloudpush is daarom ook gedeelde berichtverspreiding of een centrale spelcoördinator nodig; alleen de lokale WebSocket-server aanzetten zou wijzigingen tussen instanties missen. Zie de actuele [Vercel-documentatie](https://vercel.com/docs/functions/websockets). Een langdurige Neon-LISTEN-verbinding of afzonderlijke pubsubdienst is in deze wijziging niet toegevoegd.

## Metingen en tests

Alle **397 tests in 23 bestanden**, TypeScript en de productiebuild slagen. Nieuwe dekking staat in `tests/network-transfer.test.ts`, `tests/client-sync.test.ts`, `tests/snapshot-deltas.test.ts` en de uitgebreide WebSocket-integratietests.

| Gecontroleerde proef | Oude SQL-resultaatinhoud | Nieuwe SQL-resultaatinhoud | Afname |
| --- | ---: | ---: | ---: |
| 24 apparaten × 30 ongewijzigde polls, warme instantie | 15.637.680 bytes | 28.800 bytes | 99,82% |
| 20 wijzigingen en uitlezingen via twee warme instanties | 921.131 bytes | 14.107 bytes | 98,47% |

De fixture bevat een spelsessie en 300 bewaarde actieantwoorden, zodat ook een langere speelsessie wordt nagebootst. In beide proeven waren na opwarmen nul volledige reads nodig. De actieve proef gebruikte twintig wijzigingsreads. Kleine variaties in bytes bij herhalen komen van willekeurige request-ID's.

Dit zijn reproduceerbare metingen van de inhoud van SQL-resultaten met een testrepository, geen gemeten factuurverlaging. TLS, driver/protocolmetadata, koude starts, echte spelersaantallen en de frequentie van aanwezigheid/acties beïnvloeden het uiteindelijke verbruik. Dezelfde daadwerkelijke versie-, wijzigings- en compare-and-swap-SQL is daarnaast op tijdelijke Neon-tabellen uitgevoerd: commit, wijzigingsketen en afwijzen van een verouderde schrijfversie slagen. Tijdelijke tabellen verdwijnen na de transactie; bestaande speltabellen zijn daarvoor niet gewijzigd.

Andere regressieproeven controleren gelijktijdige taakafronding en herhaalde verzoeken, rollenprivacy, ingetrokken tokens, verwijderen van lobbies via een andere instantie, klokupdates bij `304`, de dertigsecondenvertraging van diefstal, herstel na een gebroken wijzigingsketen en een database die uitvalt. De bestaande spelregeltests blijven slagen. Geen spelregels, rollen, bediening of vormgeving zijn gewijzigd.

## Productie-observatie en vervolgcontrole

Een alleen-lezen metadataquery vóór publicatie vond snapshotversie 8097 met 855 bytes opgeslagen inhoud. De totale relationele opslag was 344.064 bytes; dat getal omvat PostgreSQL-opslag en is geen netwerkmeting. De momentopname zegt niets over de omvang tijdens eerdere actieve spellen. `pg_stat_statements` was niet beschikbaar, dus historische aantallen per query en de precieze bijdrage aan de vorige Neon-periode konden niet worden vastgesteld.

Vergelijk na enkele vergelijkbare speelsessies het Public Network Transfer in het Neon-dashboard met de voorgaande periode, met ongeveer hetzelfde aantal apparaten en dezelfde speelduur. Controleer daarbij ook koude starts en functieverzoeken op Vercel. Deze wijziging verlaagt de omvang per request; het aantal normale spelpolls blijft bewust gelijk. Tijdens een korte handmatige controle in de browser hoort een ongewijzigde cloudpoll `304` te geven, een echte actie weer `200`, en moeten kas, meetings en taakdeadline op alle apparaten blijven doorlopen.

Zelf herhalen: `npm test` en `npm run build`. De netwerkproeven schrijven geaggregeerde testmetingen onder `data/neon-transfer-benchmark.json` en `data/neon-active-transfer-benchmark.json`. Ze gebruiken eigen tijdelijke testlobbies, geen online spelerssessies.

## Publicatiecontrole

Productierelease `dpl_EsGZ5oBNTTKyUTRQJas1CYVG1WgH` staat op https://finance-imposter.vercel.app/. De clientbundel is `index-CvaDdcQG.js`; stylesheet `index-CwUtq8FJ.css` is gelijk aan de vorige release. Health, beheerderstoegang en de sessielijst slagen. De vier rolfilms hebben dezelfde SHA-256 als lokaal en ondersteunen nog steeds `206`-rangeverzoeken. Er waren nul bestaande lobbies; er is geen productietestlobby aangemaakt of lobby verwijderd. De conditionele sessie-read en actieve multiplayer zijn daarom in de geïsoleerde tests gecontroleerd, niet in een nieuw online spel.

Na login/logout bevatte het nieuwe journal twee wijzigingspakketten met samen 594 bytes, maximaal 407 bytes per pakket. De actuele volledige snapshot was 847 bytes. Tien extra productiehealthchecks veranderden de gedeelde versie niet. Dit controleert installatie en werking, geen representatieve meting van een avond spelen. De tijdelijke lokale kopie van productievariabelen is na de audit verwijderd. De publicatie is een handmatige bronrelease van de werkmap, zonder Git-push.
