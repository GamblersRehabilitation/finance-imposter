import { existsSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
if(existsSync('.env')) {console.log('.env bestaat al. Pas ADMIN_PASSWORD daar aan om het wachtwoord te wijzigen.');process.exit(0);}
const input=createInterface({input:process.stdin,output:process.stdout});
const password=await input.question('Kies een beheerderswachtwoord (minimaal 12 tekens): ');input.close();
if(password.length<12 || /[\n\r]/.test(password)){console.error('Wachtwoord te kort of ongeldig.');process.exit(1);}
writeFileSync('.env',readFileSync('.env.example','utf8').replace('vervang-dit-wachtwoord',JSON.stringify(password)),{mode:0o600});
console.log('.env aangemaakt. Start met npm run build en npm start.');
