const icons = {
 home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
 book:'M12 5v16M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-2-10 1Z',
 chart:'M4 3v18h18M8 17v-5m5 5V8m5 9V4',
 message:'M3 3h18v14H9l-6 4Z',
 user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 22v-3a8 8 0 0 1 16 0v3',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 check:'m4 12 5 5L20 6',
 info:'M12 11v6m0-10v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 warning:'m12 3 10 18H2Zm0 6v5m0 3v1'
};
export function icon(name) {
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 svg.innerHTML=`<path d="${icons[name] || icons.arrow}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
 return svg;
}
