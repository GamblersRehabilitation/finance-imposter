import { defineConfig } from 'vite';
export default defineConfig({server:{host:'0.0.0.0',proxy:{'/api':'http://127.0.0.1:3000','/ws':{target:'ws://127.0.0.1:3000',ws:true}}},test:{include:['tests/**/*.test.ts']}} as any);
