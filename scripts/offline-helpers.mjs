export function assetKey(path){return String(path).replace(/^\.\//,'').split(/[?#]/)[0];}
export function isAssetPath(value){return /^(?:\.\/)?assets\//.test(String(value));}
export function offlineHTML(value,asset){return String(value).replace(/\b(src|href)\s*=\s*(["'])(?:\.\/)?(assets\/[^"']+)\2/g,(_,attr,q,path)=>attr+'='+q+asset(path)+q);}
export function offlineCSS(value,asset){return String(value).replace(/url\(\s*(["']?)(assets\/[^"')]+)\1\s*\)/g,(_,q,path)=>'url("'+asset(path)+'")');}
