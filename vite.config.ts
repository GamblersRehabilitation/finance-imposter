import { defineConfig } from 'vite';
export default defineConfig({server:{host:'0.0.0.0',proxy:{
  // Preserve the browser's Host so the backend can validate Origin for HTTP and WS.
  '/api':{target:'http://127.0.0.1:3000',changeOrigin:false},
  '/ws':{target:'ws://127.0.0.1:3000',ws:true,changeOrigin:false}
}},test:{include:['tests/**/*.test.ts']}} as any);
