// Sixteen separately painted frames, read row-major from a 4×4 atlas.
// Every cell is 4:3. SVG clipping keeps neighbouring frames out of the scene.
let serial=0;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function paintedScene(kind,{active=false,settled=false,label='生活情境彩繪圖畫'}={}){
 const id='scene16-'+(++serial),state=settled?'is-settled':active?'is-active':'';
 return `<svg class="painted-scene scene16 ${state}" data-scene="${kind}" data-frames="16" viewBox="0 0 1024 768" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${escape(label)}"><defs><clipPath id="${id}"><rect width="1024" height="768"/></clipPath></defs><g clip-path="url(#${id})"><image class="frame16-atlas" href="assets/island-${kind}-16-v4.png" width="4096" height="3072" preserveAspectRatio="xMidYMid meet"/></g></svg>`;
}
