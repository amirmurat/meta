// Shared localization for Meta
export const DEFAULT_LANGUAGE="en";
export const LOCALE_KEY="meta-language";
export function language(){try{return localStorage.getItem(LOCALE_KEY)==="ru"?"ru":"en"}catch{return DEFAULT_LANGUAGE}}
export function localizeRecord(row){return language()==="en"?{title:row.title_en||row.title,lesson_content:row.lesson_content_en||row.lesson_content||{}}:{title:row.title,lesson_content:row.lesson_content||{}}}
export const translationsRUtoEN={};
export function tr(s){return language()==="en"?(translationsRUtoEN[s]||s):s}
function translateNode(node,lang){
 if(node.nodeType===3){
  const original=node.nodeValue||"",word=original.trim();
  const mapping=lang==="en"?translationsRUtoEN:Object.fromEntries(Object.entries(translationsRUtoEN).map(([ru,en])=>[en,ru]));
  const translated=mapping[word];if(translated&&translated!==word)node.nodeValue=original.replace(word,translated);
  return;
 }
 if(node.nodeType!==1||["SCRIPT","STYLE","TEXTAREA","CODE"].includes(node.tagName))return;
 const map=lang==="en"?translationsRUtoEN:Object.fromEntries(Object.entries(translationsRUtoEN).map(([ru,en])=>[en,ru]));
 for(const a of ["placeholder","title","aria-label"]){const x=node.getAttribute(a);if(x&&map[x])node.setAttribute(a,map[x]);}
 for(const child of [...node.childNodes])translateNode(child,lang);
}
function boot(){
 const lang=language();document.documentElement.lang=lang;
 const css=document.createElement("style");
 css.textContent=".meta-language-picker{position:fixed;bottom:15px;right:15px;z-index:9999;display:flex;gap:2px;background:#fff;border:1px solid #d1d5db;padding:4px;box-shadow:0 2px 12px #0000000a}.meta-language-picker button{font:600 12px Arial,Helvetica,sans-serif;background:transparent;color:#666;min-width:36px;height:31px;border:0;cursor:pointer}.meta-language-picker button.active{color:#fff;background:#111}.meta-language-picker button:focus-visible{outline:2px solid #111;outline-offset:2px}body{padding-bottom:40px}";
 document.head.append(css);
 const nav=document.createElement("nav");nav.className="meta-language-picker";nav.setAttribute("aria-label","Language / Язык");
 for(const code of ["en","ru"]){const b=document.createElement("button");b.textContent=code.toUpperCase();b.type="button";b.className=code===lang?"active":"";b.setAttribute("aria-pressed",String(code===lang));b.onclick=()=>{if(lang===code)return;try{localStorage.setItem(LOCALE_KEY,code)}catch{}location.reload()};nav.append(b)}document.body.append(nav);
 translateNode(document.body,lang);document.title=(lang==="en"?translationsRUtoEN[document.title]:Object.fromEntries(Object.entries(translationsRUtoEN).map(([ru,en])=>[en,ru]))[document.title])||document.title;
 const observer=new MutationObserver(muts=>{for(const m of muts){if(m.type==="childList"){for(const n of m.addedNodes)translateNode(n,lang)}else if(m.type==="characterData")translateNode(m.target,lang)}});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
