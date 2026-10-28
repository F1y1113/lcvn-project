'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const sourceRoot='assets/samples/';
const scenes={outdoor:{path:sourceRoot+'val_unseen/20210826_40_0001_02_0/',frames:Array.from({length:17},(_,i)=>String(i).padStart(4,'0')+'.jpg'),name:'TartanDrive / val unseen',instruction:'Drive straight along the dirt path, and stop at the end of the path.',alt:'Recorded dirt-path validation trajectory'},indoor:{path:sourceRoot+'val_seen/Dec-06-2022-bww8_00000000_0_16_0_0/',frames:Array.from({length:10},(_,i)=>i+'.jpg'),name:'Hallway / val seen',instruction:'Walk straight down the hallway and stop near the end.',alt:'Recorded hallway validation trajectory'}};
const styles=window.LCVN_EPISODES.indoor.instructions;
const images=window.LCVN_HERO_IMAGES||Array.from({length:18},(_,i)=>({src:scenes[i%2?'indoor':'outdoor'].path+scenes[i%2?'indoor':'outdoor'].frames[i%(i%2?10:17)],label:i%2?'Indoor navigation':'Off-road navigation'}));
for(let row=0;row<3;row++){const track=document.createElement('div');track.className='hm-row';const group=images.filter((_,i)=>i%3===row);for(let copy=0;copy<2;copy++){const segment=document.createElement('div');segment.className='hm-segment';for(const item of group){const tile=document.createElement('span');tile.className='hm-tile';const img=document.createElement('img');img.src=item.src;img.alt='';img.decoding='async';tile.append(img);segment.append(tile);}track.append(segment);}$('#hero-mosaic').append(track);}
const gallery=window.LCVN_GALLERY_IMAGES||[images[0],images[1],images[6],images[7]];
for(const item of gallery){const fig=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=item.src;img.alt=item.label;img.loading='lazy';caption.textContent=item.label;fig.append(img,caption);$('#challenge-gallery').append(fig);}
let motionPaused=matchMedia('(prefers-reduced-motion: reduce)').matches,heroInView=true;
function syncHeroMotion(){$('#home').classList.toggle('hero-paused',motionPaused||!heroInView);$('#motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('#motion-toggle').setAttribute('aria-label',motionPaused?'Play background motion':'Pause background motion');$('#motion-toggle').innerHTML=motionPaused?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 4 9 6-9 6z"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z"/></svg>';}
$('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;syncHeroMotion();});new IntersectionObserver(([entry])=>{heroInView=entry.isIntersecting;syncHeroMotion();},{threshold:.05}).observe($('#home'));syncHeroMotion();
$$('[data-panel]').forEach(b=>b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';$$('[data-panel]').forEach(x=>{const active=open&&x===b;x.setAttribute('aria-expanded',String(active));$('#'+x.dataset.panel+'-panel').hidden=!active;});}));
$$('[data-style]').forEach(b=>b.addEventListener('click',()=>{$$('[data-style]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#style-example').textContent=styles[b.dataset.style];}));
function handleTabArrows(e,tabs,current,select){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let n=tabs.indexOf(current);n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(n+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[n]);}
$('#copy-citation').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#bibtex').textContent);$('#copy-citation').textContent='Copied';$('#copy-status').textContent='BibTeX copied.';}catch{const range=document.createRange();range.selectNodeContents($('#bibtex'));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);$('#copy-status').textContent='Citation selected. Press Ctrl+C or ⌘C to copy.';}});
const navSections=$$('.paper-body section[id], #home');let navTick=false;
function updateActiveSection(){navTick=false;const probe=$('.site-header').getBoundingClientRect().bottom+55;let current=navSections[0];for(const section of navSections){if(section.getBoundingClientRect().top<=probe)current=section;}$$('.site-header nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current.id));}
function queueNavUpdate(){if(!navTick){navTick=true;requestAnimationFrame(updateActiveSection);}}
window.addEventListener('scroll',queueNavUpdate,{passive:true});window.addEventListener('resize',queueNavUpdate);new ResizeObserver(queueNavUpdate).observe($('#main'));queueNavUpdate();


const menu=$('#menu-toggle');function setMenu(open){$('.site-header').dataset.menuOpen=String(open);menu.setAttribute('aria-expanded',String(open));}menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));$$('#main-nav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus();}});document.addEventListener('click',e=>{if(!$('.site-header').contains(e.target))setMenu(false);});

// Restart the composition reveal on each opening, respecting reduced motion.
const composition=$('#splits-panel');
let countFrame=0;
const countTargets=[...composition.querySelectorAll('.composition-row>strong,.composition-summary b')].map(el=>({el,value:Number(el.textContent.replaceAll(',',''))}));
$('[data-panel="splits"]').addEventListener('click',()=>{
  cancelAnimationFrame(countFrame);
  if(composition.hidden)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){countTargets.forEach(({el,value})=>el.textContent=value.toLocaleString('en-US'));return;}
  composition.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:450,easing:'ease-out'});
  composition.querySelectorAll('.composition-track i').forEach((bar,i)=>bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:850,delay:i*70,fill:'backwards',easing:'cubic-bezier(.2,.8,.2,1)'}));
  const start=performance.now();function tick(now){const t=Math.min(1,(now-start)/1100);countTargets.forEach(({el,value})=>el.textContent=Math.round(value*(1-(1-t)**3)).toLocaleString('en-US'));if(t<1)countFrame=requestAnimationFrame(tick);}countFrame=requestAnimationFrame(tick);
});
