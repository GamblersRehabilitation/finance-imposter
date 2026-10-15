import { cpSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// A manual source release never includes local databases, secrets or unrelated Git metadata.
const root=process.cwd();
if(!existsSync(join(root,'.vercel/project.json')))throw new Error('Koppel dit project eerst met npx vercel link.');
const release=mkdtempSync(join(tmpdir(),'finance-imposter-release-'));
for(const name of ['src','server','api','public','package.json','package-lock.json','tsconfig.json','vite.config.ts','index.html','vercel.json'])cpSync(resolve(root,name),join(release,name),{recursive:true});
mkdirSync(join(release,'.vercel'));
cpSync(join(root,'.vercel/project.json'),join(release,'.vercel/project.json'));
console.log('Bronrelease gemaakt zonder .env, data, tokens of Git-geschiedenis.');
console.log(`Publiceer vanuit je eigen ingelogde Vercel-account met:\nnpx vercel deploy --cwd "${release}" --prod --yes`);
