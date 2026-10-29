# Stille gokrad-uitleg

De gebruiker koos op 28 oktober 2026 voor een video zonder stem. Er is geen audio toegevoegd. De aangeleverde vier rolfilms blijven los van deze extra uitleg.

De PNG-bestanden zijn screenshots van een afzonderlijke lokale in-memory voorbeeldlobby op telefoonformaat. Iedere uitkomst gebruikt opnieuw €5.000 buit en €1.000 inzet: ×2 → €6.000, ×3 → €7.000, ½ → €4.500, ¼ → €4.250. Het zijn onafhankelijke voorbeelden, geen opeenvolgende spins met echt spelersgeld. `disc.png` gebruikt de echte WheelBoard-component zonder de vaste aanwijspijl.

Montage: `role-videos/src/WheelWalkthrough.tsx`, 30 seconden, 30 fps, 390×780. De gemeten DOM-posities staan in geometry.json; de na screenshotcontrole gecorrigeerde beeldposities staan in de montagebron. Bij een gewijzigde telefoonlayout screenshots en aanwijzers samen bijwerken.

Gerichte export vanuit role-videos: `node node_modules/@remotion/cli/remotion-cli.js render src/index.ts wheel-walkthrough ../public/tutorials/gokrad.mp4 --codec=h264 --pixel-format=yuv420p --crf=20 --concurrency=2`. Alleen deze compositie renderen; de andere vier composities mogen de aangeleverde rolfilms niet overschrijven.
