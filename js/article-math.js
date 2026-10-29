/* Protect mathematical source before Markdown consumes TeX escapes and underscores. */
(() => {
  'use strict';
  const html = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escaped = (s, i) => {let n=0;while(i>0&&s[--i]==='\\')n++;return n%2===1;};
  function parse(source) {
    const tokens=[];
    // Private-use characters have no Markdown syntax; choose a prefix absent from the source.
    let prefix='\uE000M';while(source.includes(prefix))prefix+='M';
    const save=(tex,display)=>{const key=prefix+tokens.length+'\uE001';tokens.push({key,tex,display});return key;};
    let prepared='', i=0;
    while(i<source.length) {
      const tail=source.slice(i), lineStart=i===0||source[i-1]==='\n';
      if(lineStart) {
        const fence=tail.match(/^ {0,3}(`{3,}|~{3,})([^\n]*)\n/);
        if(fence) {
          const end=new RegExp('^ {0,3}'+fence[1][0]+'{'+fence[1].length+',}[ \\t]*(?:\\n|$)','m');
          const bodyStart=i+fence[0].length,close=end.exec(source.slice(bodyStart));
          const finish=close?bodyStart+close.index+close[0].length:source.length;
          prepared+=/^(?:math|latex|tex)\s*$/i.test(fence[2].trim())&&close?save(source.slice(bodyStart,bodyStart+close.index).trim(),true)+'\n':source.slice(i,finish);
          i=finish;continue;
        }
        // Markdown's indented code remains literal, including shell dollar signs.
        const indent=tail.match(/^(?: {4}|\t)[^\n]*(?:\n|$)/);
        if(indent){prepared+=indent[0];i+=indent[0].length;continue;}
      }
      const raw=tail.match(/^<(pre|code|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/i);
      if(raw){prepared+=raw[0];i+=raw[0].length;continue;}
      if(source[i]==='`'&&!escaped(source,i)) {
        const run=tail.match(/^`+/)[0];let end=source.indexOf(run,i+run.length);
        while(end>=0&&(source[end-1]==='`'||source[end+run.length]==='`'))end=source.indexOf(run,end+run.length);
        if(end>=0){prepared+=source.slice(i,end+run.length);i=end+run.length;continue;}
      }
      const environment=tail.match(/^\\begin\{(equation\*?|align\*?|gather\*?|displaymath)\}/);
      let left,right,display=false;
      if(environment){left=environment[0];right='\\end{'+environment[1]+'}';display=true;}
      else if(tail.startsWith('\\[')){left='\\[';right='\\]';display=true;}
      else if(tail.startsWith('\\(')){left='\\(';right='\\)';}
      else if(tail.startsWith('$$')){left=right='$$';display=true;}
      else if(tail.startsWith('$')){left=right='$';}
      if(left&&!escaped(source,i)) {
        let end=source.indexOf(right,i+left.length);
        while(end>=0&&escaped(source,end))end=source.indexOf(right,end+right.length);
        if(end>=0) {
          const body=source.slice(i+left.length,end);
          const inlineDollar=left==='$';
          const valid=body.trim()&&(!inlineDollar||(!/\n\s*\n/.test(body)&&!/^\s|\s$/.test(body)));
          if(valid){prepared+=save(environment?source.slice(i,end+right.length):body,display);i=end+right.length;continue;}
        }
      }
      prepared+=source[i++];
    }
    let result=window.marked.parse(prepared);
    for(const {key,tex,display} of tokens)result=result.split(key).join('<span class="math'+(display?' display':'')+'" data-tex="'+html(tex)+'">'+html(tex)+'</span>');
    // Older pasted notes also contain standalone equations with Chinese names.
    result=result.replace(/<p>([^<]+)<\/p>/g,(whole,text)=>/[\u3400-\u9fffα-ωΑ-Ω∫∑]/.test(text)&&/[=＝]/.test(text)&&text.length<=300&&!/[，。！？:：;；\n]/.test(text)&&!/\b(?:PATH|HOME|sudo|printf|wget|curl)\b/.test(text)?'<p class="math display">'+text.replace(/＝/g,'=').replace(/\uE020=/g,'≠').replace(/∫−∞\+∞/g,'∫<sub>−∞</sub><sup>+∞</sup>').replace(/∫−ππ/g,'∫<sub>−π</sub><sup>π</sup>')+'</p>':whole);
    // Explicit programming examples have already been handled as literal code.
    result=result.replace(/<code>([\s\S]*?)<\/code>/g,(whole,body)=>/==|!=|\bprintf\s*\(/.test(body)?'<code data-collection-math="literal-code">'+body+'</code>':whole);
    return result;
  }
  window.ArticleMath={parse};
})();
