import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
http.createServer((req,res)=>{
 let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/')pathname='/tests/browser.html';
 const qa=/^\/qa\/([a-z-]+)\//.test(pathname);if(qa)pathname=pathname.replace(/^\/qa\/[a-z-]+\//,'/');
 if(pathname.endsWith('/'))pathname+='index.html';
 if(qa&&pathname==='/meta-supabase.js')pathname='/tests/mock-supabase.js';
 const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/plain');
 res.setHeader('Cache-Control','no-store');res.end(fs.readFileSync(file));
}).listen(4173,'127.0.0.1',()=>console.log('Meta QA: http://127.0.0.1:4173/ — localhost fixtures only'));
