import 'dotenv/config';
import { createApp } from './app.js';
const password=process.env.ADMIN_PASSWORD;
if(!password) {console.error('ADMIN_PASSWORD ontbreekt. Kopieer .env.example naar .env en kies een wachtwoord.');process.exit(1);}
const runtime=createApp({databasePath:process.env.DATABASE_PATH??'./data/finance.sqlite',adminPassword:password,secureCookie:process.env.COOKIE_SECURE==='true'});
const port=Number(process.env.PORT??3000), host=process.env.HOST??'0.0.0.0';
runtime.engine.tick();
runtime.server.listen(port,host,()=>{console.log(`Finance Imposter · http://localhost:${port} · netwerk: http://<LAN-IP>:${port}`);});
process.on('SIGTERM',()=>{runtime.close();process.exit(0);});process.on('SIGINT',()=>{runtime.close();process.exit(0);});
