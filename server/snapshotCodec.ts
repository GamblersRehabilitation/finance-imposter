import {gzipSync,gunzipSync} from 'node:zlib';
/** One compact current snapshot; never append a history of whole games. */
export const encodeSnapshot=(state:string)=>'gz:'+gzipSync(state).toString('base64');
export const decodeSnapshot=(state:string)=>state.startsWith('gz:')?gunzipSync(Buffer.from(state.slice(3),'base64')).toString('utf8'):state;
