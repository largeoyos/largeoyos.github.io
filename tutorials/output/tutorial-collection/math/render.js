/* Local TeX typography for static handouts, changing lessons and diagram labels. */
(() => {
  'use strict';
  const engine = window.katex;
  if (!engine) return;
  const css = document.getElementById('collection-math-css');
  const errors = window.__collectionMathErrors = [];
  const rendered = window.__collectionMathStats = {html:0, svg:0};
  const skip = 'script,style,pre,textarea,noscript,select,button,input,nav,.katex,.MathJax,mjx-container,math,[data-collection-math],.collection-math-svg';
  const explicit = '[data-tex],.eq,.equation,.formula,.math-inline,.math';
  const symbols = {'−':'-','–':'-','×':'\\times ','·':'\\cdot ','÷':'\\div ','≈':'\\approx ','≃':'\\simeq ','≠':'\\ne ','≤':'\\le ','≥':'\\ge ','∞':'\\infty ','∑':'\\sum ','Σ':'\\Sigma ','Π':'\\Pi ','∏':'\\prod ','∫':'\\int ','∮':'\\oint ','∂':'\\partial ','∇':'\\nabla ','√':'\\sqrt{}','∈':'\\in ','∉':'\\notin ','⊂':'\\subset ','⊆':'\\subseteq ','∪':'\\cup ','∩':'\\cap ','⊕':'\\oplus ','⊙':'\\odot ','∅':'\\varnothing ','→':'\\to ','⇒':'\\Rightarrow ','⇔':'\\Leftrightarrow ','↔':'\\leftrightarrow ','∝':'\\propto ','∠':'\\angle ','±':'\\pm ','∓':'\\mp ','°':'^{\\circ}','π':'\\pi ','ω':'\\omega ','Ω':'\\Omega ','α':'\\alpha ','β':'\\beta ','γ':'\\gamma ','δ':'\\delta ','Δ':'\\Delta ','ε':'\\varepsilon ','η':'\\eta ','θ':'\\theta ','λ':'\\lambda ','μ':'\\mu ','ν':'\\nu ','ξ':'\\xi ','ρ':'\\rho ','σ':'\\sigma ','τ':'\\tau ','φ':'\\varphi ','Φ':'\\Phi ','ψ':'\\psi ','Ψ':'\\Psi ','ζ':'\\zeta ','κ':'\\kappa ','Γ':'\\Gamma ','Θ':'\\Theta ','ℝ':'\\mathbb{R}','ℂ':'\\mathbb{C}','ℤ':'\\mathbb{Z}','ℕ':'\\mathbb{N}','ℓ':'\\ell '};
  const sub = Object.fromEntries(Array.from('₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ').map((c,i)=>[c,Array.from('0123456789+-=()aehijklmnoprstuvx')[i]]));
  const sup = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'-','⁼':'=','ⁿ':'n','ⁱ':'i'};
  const escaped = s => String(s).replace(/[{}%&#$]/g,c=>'\\'+c);
  function plain(value) {
    value = Array.from(String(value).replace(/\\u200[0-9a-f]/gi,' ').normalize('NFC'),c=>{
      const d=c.normalize('NFD');return /^[A-Za-z][\u0302\u0303\u0304]$/.test(d)?d:c;
    }).join('');
    let out='';
    for(let i=0;i<value.length;) {
      const c=value[i];
      if(sub[c] || sup[c]) { const map=sub[c]?sub:sup, kind=sub[c]?'_':'^'; let run='';while(map[value[i]])run+=map[value[i++]];out+=kind+'{'+run+'}';continue; }
      if(/[\u3400-\u9fff，。：；、（）【】]/u.test(c)) { let run='';while(i<value.length&&/[\u3400-\u9fff，。：；、（）【】\s]/u.test(value[i]))run+=value[i++];out+='\\text{'+escaped(run)+'}';continue; }
      if(c==='′'||c==='″') {out+=c==='′'?"'":"''";i++;continue;}
      if(c==='\u0302'||c==='\u0303'||c==='\u0304') {out=out.replace(/([A-Za-z])$/,(_,v)=>(c==='\u0302'?'\\hat':c==='\u0303'?'\\tilde':'\\bar')+'{'+v+'}');i++;continue;}
      if(c==='\\') { // Keep real TeX commands; literal paths never enter this parser.
        const m=value.slice(i).match(/^\\[A-Za-z]+/);if(m){out+=m[0]+' ';i+=m[0].length;continue;}out+='\\backslash ';i++;continue;
      }
      if(c==='√') {const tail=value.slice(i+1);const m=tail.match(/^\(([^()]*)\)|^\[([^\[\]]*)\]|^([A-Za-z0-9]+)/);if(m){out+='\\sqrt{'+plain(m[1]||m[2]||m[3])+'}';i+=m[0].length+1;continue;}}
      if(symbols[c])out+=symbols[c];
      else if(c==='%')out+='\\%';else if(c==='#')out+='\\#';else if(c==='&')out+='\\&';else if(c==='$')out+='\\$';else if(c==='~')out+='\\sim ';else if(c==='\u00a0')out+=' ';
      else if(c==='_') {
        if(/^hat\b/.test(value.slice(i+1))&&/[A-Za-z]$/.test(out)){out=out.replace(/([A-Za-z])$/,'\\hat{$1}');i+=4;continue;}
        const m=value.slice(i+1).match(/^\{([^{}]*)\}|^((?:[A-Z]{2,}|in|out|min|max|ref|on|off|rms|th)\b|[A-Za-z0-9])/);if(m){out+='_{'+plain(m[1]??m[2])+'}';i+=m[0].length+1;continue;}out+='\\_';
      }
      else if(c==='{'||c==='}')out+='\\'+c;
      else out+=c;
      i++;
    }
    out=out.replace(/(?<!\\)\b(sin|cos|tan|cot|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|min|max|lim|det)(?=\b|\()/g,'\\$1 ');
    // Units and descriptive names are upright, rather than products of letters.
    out=out.replace(/\b(round|clip|floor|ceil|PSNR|MSE|SNR|LSB|MSB|GB|MHz|kHz|GHz|Hz|mV|mA|kΩ|dB|bpp)\b/g,'\\mathrm{$1}');
    out=out.replace(/\b(NOT|AND|OR|NAND|NOR|XOR|XNOR)\b/g,'\\operatorname{$1}');
    // Bare numeric e-notation denotes a power of ten, not a variable minus a number.
    out=out.replace(/(?<![A-Za-z0-9_])(\d+(?:\.\d*)?|\.\d+)[eE]([+-]?\d+)(?![A-Za-z0-9_])/g,'$1\\times 10^{$2}');
    out=out.replace(/\b([A-Za-z])('+)(\d+)\b/g,"$1_{$3}$2").replace(/\b([A-Za-z])(\d+)\b/g,'$1_{$2}');
    while(/_\{[^{}]*\}_\{[^{}]*\}/.test(out))out=out.replace(/_\{([^{}]*)\}_\{([^{}]*)\}/g,'_{$1,$2}');
    return out;
  }
  function fromNode(node) {
    if(node.nodeType===3)return plain(node.nodeValue);
    if(node.nodeType!==1)return '';
    const body=Array.from(node.childNodes,fromNode).join('');
    if(node.tagName==='SUB')return '_{'+body+'}';
    if(node.tagName==='SUP')return '^{'+body+'}';
    if(node.tagName==='BR')return '\\\\{}';
    if(node.classList.contains('logical-overline')||/overline/.test(node.style.textDecoration||''))return '\\overline{'+body+'}';
    return body;
  }
  function texFor(el) {
    if(el.hasAttribute('data-tex'))return el.getAttribute('data-tex');
    let text=el.textContent.trim();
    if(/^\\\([\s\S]*\\\)$/.test(text))return text.slice(2,-2);
    if(/^\\\[[\s\S]*\\\]$/.test(text))return text.slice(2,-2);
    if(/^\$\$[\s\S]*\$\$$/.test(text))return text.slice(2,-2);
    if(/^\$[^$]+\$$/.test(text))return text.slice(1,-1);
    if(/\\(?:frac|sum|int|sqrt|begin|hat|tilde|mathrm|mathbb|left|right|partial|prod)\b/.test(text))return text;
    let result=Array.from(el.childNodes,fromNode).join('');
    if(result.includes('\\\\'))result='\\begin{gathered}'+result+'\\end{gathered}';
    return result;
  }
  function formulaLike(text, code=false, expressions=false) {
    text=text.trim();
    if(!text||text.length>1200)return false;
    if(/(?:https?:|file:|[A-Z]:\\|\.(?:py|js|html|json|pdf|yuv|png|jpg|mp4|pt|pth)\b|=>|--[A-Za-z]|\b(?:return|const|let|assert|import|torch|numpy|np\.|ffmpeg|python|pip|conda|cmake|wget|curl|ssh)\b)/.test(text))return false;
    if(/\b[a-z][a-z_]*_[a-z]+_[a-z_]+\b/.test(text))return false;
    if(expressions&&/^(?:I\/O|\d{4}[/-]\d{1,2}[/-]\d{1,2})$/.test(text))return false;
    if(code&&expressions&&!/[=≈≠≤≥∈∝]/.test(text)&&/[A-Za-z]{4,}/.test(text))return false;
    return (/\\(?:frac|sum|int|sqrt|hat|tilde|alpha|beta|left|mathbb)\b|[=≈≠≤≥∈∝]|[²³ⁿ₀-₉]|\b[A-Za-z]_\{/.test(text)||(expressions&&/[A-Za-z0-9)]\s*[+*/^×÷⊕·]\s*[A-Za-z0-9(]/.test(text))) && (!code || !/;\s*$|\{\s*["']|\b[A-Za-z]+_(?:hat|pred|rec|step)\b/.test(text));
  }
  const installed=new WeakSet(),frames=new WeakSet();
  const svgCopies=new WeakMap();
  function svgMath(doc) {
    for(const text of doc.querySelectorAll('svg text')) {
      if(text.closest('.MathJax,mjx-container,.katex,math')||text.querySelector('textPath'))continue;
      const value=text.textContent,old=svgCopies.get(text);
      if(old?.value===value)continue;
      if(old){old.copy.remove();text.style.visibility=old.visibility;svgCopies.delete(text);}
      if(!formulaLike(value)||value.length>140||/[\u3400-\u9fff]{8}/.test(value))continue;
      const tex=Array.from(text.childNodes,fromNode).join('');let html;
      try{html=engine.renderToString(tex,{throwOnError:true,strict:'ignore',trust:false});}catch(error){if(!errors.some(x=>x.tex===tex))errors.push({tex,message:String(error)});continue;}
      let box;try{box=text.getBBox();}catch{continue;}if(!box.width||!box.height)continue;
      const font=parseFloat(doc.defaultView.getComputedStyle(text).fontSize)||14;
      const copy=doc.createElementNS('http://www.w3.org/2000/svg','foreignObject');copy.classList.add('collection-math-svg');
      const transform=text.getAttribute('transform');if(transform)copy.setAttribute('transform',transform);
      copy.setAttribute('x',box.x);copy.setAttribute('y',box.y);copy.setAttribute('width','1200');copy.setAttribute('height',font*4);
      const span=doc.createElementNS('http://www.w3.org/1999/xhtml','span');span.style.cssText=`display:inline-block;white-space:nowrap;font-size:${font}px;line-height:1.2;color:${doc.defaultView.getComputedStyle(text).fill};pointer-events:none`;
      span.innerHTML=html;copy.append(span);text.after(copy);
      const scale=Math.abs(text.getScreenCTM()?.a)||1,rect=span.getBoundingClientRect();let width=rect.width/scale,height=rect.height/scale;
      const svg=text.ownerSVGElement,view=svg.viewBox.baseVal,x=parseFloat(text.getAttribute('x'))||box.x,anchor=text.getAttribute('text-anchor')||'start';
      const limit=anchor==='middle'?2*Math.min(x-view.x,view.x+view.width-x):anchor==='end'?x-view.x:view.x+view.width-x;
      if(limit>0&&width>limit){const shrink=limit/width;span.style.fontSize=font*shrink+'px';width*=shrink;height*=shrink;}
      copy.setAttribute('x',anchor==='middle'?x-width/2:anchor==='end'?x-width:box.x);copy.setAttribute('y',box.y+(box.height-height)/2);copy.setAttribute('width',width+3);copy.setAttribute('height',height+3);
      const visibility=text.style.visibility;text.style.visibility='hidden';svgCopies.set(text,{value,copy,visibility});rendered.svg++;
    }
  }
  function install(doc) {
    if(installed.has(doc)||doc.__collectionMathInstalled||!doc.body)return;
    installed.add(doc);
    doc.__collectionMathInstalled=true;
    if(doc!==document&&!doc.getElementById('collection-math-css')&&css) {
      const style=css.cloneNode(true);if(style.tagName==='LINK')style.href=css.href;doc.head.append(style);
      const extra=document.getElementById('collection-math-layout');if(extra)doc.head.append(extra.cloneNode(true));
    }
    let timer=0,waitingForEditor=false;
    function render(el,display,tex) {
      if(el.closest('.katex,.MathJax,mjx-container,math')||el.querySelector('.katex,.MathJax,mjx-container,math,svg')||el.dataset.collectionMath)return;
      tex=tex??texFor(el);if(!tex.trim())return;
      try {
        const html=engine.renderToString(tex,{displayMode:display,throwOnError:true,strict:'ignore',trust:false,output:'htmlAndMathml'});
        el.setAttribute('data-collection-math-source',el.textContent);el.setAttribute('data-collection-math',tex);el.classList.add(display?'collection-math-display':'collection-math-inline');el.innerHTML=html;rendered.html++;
      } catch(error) {el.setAttribute('data-collection-math-error',tex);if(!errors.some(x=>x.tex===tex))errors.push({tex,message:String(error)});}
    }
    function process() {
      timer=0;
      // Widget resize handlers may redraw fields. Finish editing before changing layout.
      if(doc.activeElement?.matches('textarea,select,input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"])')){waitingForEditor=true;return;}
      waitingForEditor=false;observer.disconnect();
      for(const el of doc.querySelectorAll(explicit)) {
        if(el.closest(skip)||el.closest('svg')||el.hasAttribute('data-collection-math-error'))continue;
        if(el.parentElement?.closest(explicit)&&!el.parentElement.closest('table'))continue;
        render(el,!el.matches('span,.math-inline')||el.classList.contains('display'));
      }
      for(const el of doc.querySelectorAll('code'))if(!el.closest(skip)&&formulaLike(el.textContent,true,true))render(el,false);
      // Unmarked inline equations and conventional TeX delimiters in prose.
      const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest(skip+',svg,code,'+explicit)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
      const texts=[];while(walker.nextNode())texts.push(walker.currentNode);
      const pieces=/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|([A-Za-zα-ωΑ-Ω][A-Za-zα-ωΑ-Ω0-9_{}()[\]′″^+*/.\s²³₀-₉ₐ-ₓ\u0300-\u036f|−·×÷√∞∂∫∑ΣΠ⊕⊙=≈≠≤≥∈∝→⇒±%,;:-]*[=≈≠≤≥∈∝][A-Za-zα-ωΑ-Ω0-9_{}()[\]′″^+*/.\s²³₀-₉ₐ-ₓ\u0300-\u036f|−·×÷√∞∂∫∑ΣΠ⊕⊙=≈≠≤≥∈∝→⇒±%,;:-]*)|((?:[A-Za-zα-ωΑ-Ω][A-Za-z0-9_{}₀-₉′]*|\d+(?:\.\d+)?)(?:\s*[+*/^×÷⊕·]\s*(?:[A-Za-zα-ωΑ-Ω][A-Za-z0-9_{}₀-₉′]*|\d+(?:\.\d+)?))+)/g;
      for(const node of texts) {
        const value=node.nodeValue;pieces.lastIndex=0;let m,last=0,fragment=null;
        while((m=pieces.exec(value))) {
          const raw=m[0],bare=m[5]??m[6],tex=m[1]??m[2]??m[3]??m[4]??plain(bare);
          // Do not extract arithmetic from a standard name, filename or path.
          if(m[6]!==undefined&&(/[A-Za-z0-9_./]/.test(value[m.index-1]||'')||/^[A-Za-z0-9_/]|^\.[A-Za-z0-9]/.test(value.slice(m.index+raw.length))))continue;
          if(m[6]!==undefined&&/\b(?:SHA|MD5)\b/.test(bare))continue;
          if(m[4]!==undefined&&!formulaLike(m[4])&&!/^[A-Za-z0-9.]+$/.test(m[4].trim()))continue;
          if(bare!==undefined&&(!formulaLike(bare,false,m[6]!==undefined)||bare.length>240||/\b(?!arctan\b|arcsin\b|arccos\b|sqrt\b|round\b|floor\b|ceil\b|clip\b|PSNR\b)[A-Za-z]{4,}\b/.test(bare)))continue;
          fragment??=doc.createDocumentFragment();fragment.append(doc.createTextNode(value.slice(last,m.index)));
          const span=doc.createElement('span');span.textContent=raw;render(span,m[2]!==undefined||m[3]!==undefined,tex);fragment.append(span);last=m.index+raw.length;
        }
        if(fragment){fragment.append(doc.createTextNode(value.slice(last)));node.replaceWith(fragment);}
      }
      for(const frame of doc.querySelectorAll('iframe')) {
        const mount=()=>{try{if(frame.contentDocument?.body)install(frame.contentDocument);}catch{}};
        if(!frames.has(frame)){frames.add(frame);frame.addEventListener('load',mount);}mount();
      }
      svgMath(doc);
      observer.observe(doc.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['open']});
      doc.defaultView?.dispatchEvent(new Event('collection-math-ready'));
    }
    const observer=new MutationObserver(records=>{
      for(const record of records){const node=record.target.nodeType===1?record.target:record.target.parentElement;const marked=node?.closest('[data-collection-math]');if(marked&&!marked.querySelector('.katex'))marked.removeAttribute('data-collection-math');}
      if(!timer)timer=setTimeout(process,35);
    });
    doc.__collectionMathRefresh=process;
    doc.addEventListener('focusout',()=>{if(waitingForEditor&&!timer)timer=setTimeout(process,0);});
    process();
    doc.fonts?.ready.then(()=>{for(const text of doc.querySelectorAll('svg text')){const old=svgCopies.get(text);if(old){text.style.visibility=old.visibility;old.copy.remove();svgCopies.delete(text);}}process();});
  }
  window.CollectionMath={plain,texFor,formulaLike,refresh:()=>document.__collectionMathRefresh?.()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>install(document));else install(document);
})();
