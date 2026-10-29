(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const episodes = Object.fromEntries(Object.entries(window.LCVN_EPISODES).map(([key,value])=>[key,Array.isArray(value)?value:[value]]));
  const episodeIndex = {outdoor:0,indoor:0};
  let scene = 'outdoor', frame = 0, revealed = false, comparing = false, wording = 'concise', timer = null, points = [];
  const styleNames = {concise: 'Concise', intricate: 'Intricate', landmark: 'Landmark-based'};
  const ns = 'http://www.w3.org/2000/svg';
  const svgNode = (tag, attrs = {}) => {const e = document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
  const data = () => episodes[scene][episodeIndex[scene]];
  const imageURL = i => data().base + data().frames[i];
  function stop() { clearInterval(timer); timer = null; $('#episode-play').textContent = '▶'; $('#episode-play').setAttribute('aria-label','Play recorded route'); $('#episode-play').setAttribute('aria-pressed','false'); }
  function setComparison(on) {
    const wasComparing = comparing;
    comparing = on && revealed && frame > 0;
    if(comparing&&!wasComparing) setComparisonPosition(50);
    $('#episode').dataset.comparing = String(comparing);
    $('#comparison-layer').hidden = !comparing;
    $('#compare-toggle').setAttribute('aria-pressed',String(comparing));
    $('#compare-toggle').lastChild.textContent = comparing ? ' Single view' : 'Compare with start';
    $('#episode-view-label').textContent = comparing ? 'Start ↔ recorded future' : frame ? 'Recorded future · step ' + frame : 'Initial observation';
  }
  function showFrame(n) {
    frame = Math.max(0,Math.min(Math.round(n),data().frames.length-1));
    $('#episode-current').src = imageURL(frame);
    $('#episode-current').alt = data().name + ' — recorded observation ' + (frame+1) + ' of ' + data().frames.length;
    $('#episode-view-label').textContent = comparing ? 'Start ↔ recorded future' : frame ? 'Recorded future · step ' + frame : 'Initial observation';
    $('#episode-image-foot').textContent = frame ? 'A future observation along the recorded route' : 'The only camera view available to the agent';
    $('#episode-moment').textContent = frame ? 'Step ' + frame : 'Starting view';
    $('#episode-count').textContent = frame ? 'Recorded future' : 'Input observation';
    $('#episode-progress').textContent = frame + ' / ' + (data().frames.length-1);
    $('#episode-range').value = frame;
    $('#episode-range').setAttribute('aria-valuetext',frame === 0 ? 'Initial observation' : 'Recorded future, step '+frame+' of '+(data().frames.length-1));
    $('#compare-toggle').hidden = !revealed || frame === 0;
    $('#comparison-future-label').textContent = 'Recorded step ' + frame;
    if(frame===0) setComparison(false);
    $$('.filmstrip-frame').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.frame)===frame)));
    if(points.length) {
      const [x,y] = points[frame];
      $('#route-travelled').setAttribute('d',points.slice(0,frame+1).map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '));
      ['#route-current','#route-halo'].forEach(s=>{$(s).setAttribute('cx',x);$(s).setAttribute('cy',y);});
      $('#route-step').textContent = 'Step ' + frame + ' of ' + (data().frames.length-1);
      $('#episode-map').setAttribute('aria-label','Recorded trajectory selector; observation '+(frame+1)+' of '+data().frames.length+' selected');
      $$('#route-milestones .route-point').forEach(p=>{const selected=Number(p.dataset.frame)===frame;p.tabIndex=selected?0:-1;p.setAttribute('aria-pressed',String(selected));});
    }
  }
  function renderMap() {
    const p = data().positions;
    points = [];
    $('#route-milestones').replaceChildren();
    $('#route-labels').replaceChildren();
    if(!Array.isArray(p)||p.length!==data().frames.length||!p.every(x=>Array.isArray(x)&&x.length>=2&&x.slice(0,2).every(Number.isFinite)))return;
    points=window.LCVNRouteLayout.projectPositions(p);
    $('#route-full').setAttribute('d',points.map((v,i)=>(i?'L':'M')+v.join(' ')).join(' '));
    points.forEach(([x,y],i)=>{
      const group=svgNode('g',{class:'route-point','data-frame':i,role:'button',tabindex:i===0?0:-1,'aria-label':'Show recorded step '+i,'aria-pressed':'false'});
      group.append(svgNode('circle',{cx:x,cy:y,r:9,class:'route-hit'}),svgNode('circle',{cx:x,cy:y,r:3,class:'route-dot'}));
      $('#route-milestones').append(group);
    });
    window.LCVNRouteLayout.placeEndpointLabels(points).forEach(box=>{
      const label=svgNode('g',{'data-route-label':box.text});
      label.append(svgNode('rect',{x:box.x,y:box.y,width:box.w,height:box.h,rx:6}));
      const text=svgNode('text',{x:box.x+box.w/2,y:box.y+box.h/2,'text-anchor':'middle','dominant-baseline':'central'});text.textContent=box.text;label.append(text);$('#route-labels').append(label);
    });
    $('#route-caption').textContent = data().pathNote || 'Recorded position samples; display scaled to fit.';
  }
  function renderFilmstrip() {
    $('#episode-filmstrip').replaceChildren();
    const indices=[...new Set(Array.from({length:7},(_,i)=>Math.round(i*(data().frames.length-1)/6)))];
    for(const i of indices){
      const b=document.createElement('button');b.className='filmstrip-frame';b.dataset.frame=i;b.setAttribute('aria-label',i===0?'Show initial observation':'Show recorded future step '+i);b.setAttribute('aria-current','false');
      const img=document.createElement('img');img.src=imageURL(i);img.alt='';img.loading='lazy';
      const label=document.createElement('span');label.textContent=i===0?'Starting view':i===data().frames.length-1?'Final view':'Step '+i;
      b.append(img,label);b.addEventListener('click',()=>{stop();showFrame(i);});$('#episode-filmstrip').append(b);
    }
  }
  function selectWording(key) {
    wording=data().instructions[key]?key:'concise';
    $('#episode-instruction').textContent=data().instructions[wording];
    $('#episode-instruction').dataset.style=wording;
    $('#episode-instruction').scrollTop=0;
    requestAnimationFrame(updateInstructionOverflow);
    $$('#episode-styles button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.wording===wording)));
  }
  function updateInstructionOverflow() {
    const instruction=$('#episode-instruction');
    const scrollable=instruction.scrollHeight>instruction.clientHeight+2;
    instruction.tabIndex=scrollable?0:-1;
    $('#instruction-scroll-hint').hidden=!scrollable;
  }
  new ResizeObserver(updateInstructionOverflow).observe($('#episode-instruction'));
  function renderWording() {
    $('#episode-styles').replaceChildren();
    for(const key of Object.keys(data().instructions)){
      const b=document.createElement('button');b.textContent=styleNames[key]||key;b.dataset.wording=key;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>selectWording(key));$('#episode-styles').append(b);
    }
    $('#episode-styles').hidden=Object.keys(data().instructions).length<2;
    selectWording(wording);
  }
  function setRevealed(on) {
    stop();revealed=on;setComparison(false);
    $('#episode').dataset.revealed=String(on);
    $('#episode-future').hidden=!on;
    $('#episode-route').hidden=!on||!points.length;
    $('#episode-input-story').hidden=on&&points.length>0;
    const revealButton=$('#reveal-future'), restoreFocus=document.activeElement===revealButton;
    $(on?'.episode-context':'#episode-visual').append(revealButton);
    if(restoreFocus)revealButton.focus({preventScroll:true});
    $('#reveal-future').setAttribute('aria-expanded',String(on));
    $('#reveal-future span').textContent=on?'Return to the initial view':'Reveal the recorded future';
    showFrame(on?1:0);
    $('#episode-live').textContent=on?'Recorded future revealed. Explore the timeline, path or start-view comparison.':'Only the initial camera view is shown.';
    if(on){
      data().frames.forEach((_,i)=>{const img=new Image();img.src=imageURL(i);});
      startPlayback();
      $('#episode-live').textContent='Recorded future revealed. Playing one observation per second; use Pause to stop.';
    }
  }
  function selectScene(key, index = episodeIndex[key]) {
    stop();scene=key;wording='concise';
    episodeIndex[key]=(index+episodes[key].length)%episodes[key].length;
    $$('[data-episode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.episode===key)));
    const split=data().split||(/unseen/i.test(data().source)?'val_unseen':'val_seen');
    const splitName={val_seen:'Validation seen',val_unseen:'Validation unseen',train:'Training',test:'Test'}[split]||split;
    $('#episode-source').textContent=splitName+' · '+(data().frames.length-1)+' recorded steps';
    $('#episode-select').replaceChildren(...episodes[key].map((entry,i)=>{
      const option=document.createElement('option');option.value=i;option.textContent=entry.name;return option;
    }));
    $('#episode-select').value=episodeIndex[key];
    $('#episode-number').textContent=(episodeIndex[key]+1)+' / '+episodes[key].length;
    $('#episode-prev').disabled=$('#episode-next').disabled=episodes[key].length<2;
    const nativeWidth=data().nativeDimensions?.width||data().native_dimensions?.width;
    $('#episode').dataset.resolution=nativeWidth&&nativeWidth<300?'compact':'standard';
    $('#episode-start').src=imageURL(0);
    $('#episode-start').alt=data().name+' — initial observation for comparison';
    $('#episode-range').max=data().frames.length-1;
    setComparisonPosition(50);
    renderWording();renderMap();renderFilmstrip();setRevealed(false);
    $('#episode-live').textContent=data().name+', episode '+(episodeIndex[key]+1)+' of '+episodes[key].length+'. Initial observation displayed.';
  }
  $$('[data-episode]').forEach(b=>b.addEventListener('click',()=>selectScene(b.dataset.episode)));
  $('#episode-prev').addEventListener('click',()=>selectScene(scene,episodeIndex[scene]-1));
  $('#episode-next').addEventListener('click',()=>selectScene(scene,episodeIndex[scene]+1));
  $('#episode-select').addEventListener('change',e=>selectScene(scene,Number(e.target.value)));
  function setComparisonPosition(value) {
    const position=Math.max(0,Math.min(100,Number(value)));
    $('#comparison-range').value=position;
    $('#comparison-range').setAttribute('aria-valuetext',Math.round(position)+' percent initial view');
    $('#comparison-layer').style.setProperty('--comparison',position+'%');
  }
  // Use the full image width for both touch dragging and mouse dragging.
  const comparisonInput=$('#comparison-range');
  let comparisonPointer=null;
  function moveComparison(e) {
    const bounds=comparisonInput.getBoundingClientRect();
    setComparisonPosition((e.clientX-bounds.left)/bounds.width*100);
  }
  comparisonInput.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    comparisonPointer=e.pointerId;comparisonInput.setPointerCapture(e.pointerId);
    comparisonInput.focus({preventScroll:true});moveComparison(e);e.preventDefault();
  });
  comparisonInput.addEventListener('pointermove',e=>{if(e.pointerId===comparisonPointer)moveComparison(e);});
  const releaseComparison=()=>{comparisonPointer=null;};
  comparisonInput.addEventListener('pointerup',releaseComparison);
  comparisonInput.addEventListener('pointercancel',releaseComparison);
  comparisonInput.addEventListener('lostpointercapture',releaseComparison);
  $('#reveal-future').addEventListener('click',()=>setRevealed(!revealed));
  $('#compare-toggle').addEventListener('click',()=>{stop();setComparison(!comparing);});
  comparisonInput.addEventListener('input',e=>setComparisonPosition(e.target.value));
  $('#episode-range').addEventListener('input',e=>{stop();showFrame(Number(e.target.value));});
  $('#route-milestones').addEventListener('click',e=>{const point=e.target.closest('.route-point');if(point){stop();showFrame(Number(point.dataset.frame));}});
  $('#route-milestones').addEventListener('keydown',e=>{const point=e.target.closest('.route-point');if(!point)return;let n=Number(point.dataset.frame);if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End','Enter',' '].includes(e.key)){e.preventDefault();if(e.key==='Home')n=0;else if(e.key==='End')n=data().frames.length-1;else if(e.key==='ArrowRight'||e.key==='ArrowUp')n++;else if(e.key==='ArrowLeft'||e.key==='ArrowDown')n--;stop();showFrame(n);$('#route-milestones .route-point[data-frame="'+frame+'"]').focus();}});
  function startPlayback() {
    stop();setComparison(false);if(frame===data().frames.length-1)showFrame(0);
    $('#episode-play').textContent='Ⅱ';$('#episode-play').setAttribute('aria-label','Pause recorded route');$('#episode-play').setAttribute('aria-pressed','true');
    timer=setInterval(()=>{showFrame(frame+1);if(frame===data().frames.length-1){stop();$('#episode-live').textContent='Recorded route playback complete.';}},1000);
  }
  $('#episode-play').addEventListener('click',()=>{if(timer)stop();else startPlayback();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  new IntersectionObserver(([e])=>{if(!e.isIntersecting)stop();},{threshold:0}).observe($('#episode'));
  $('#episode-current').addEventListener('load',()=>{$('#episode').dataset.resolution=$('#episode-current').naturalWidth<300?'compact':'standard';});
  selectScene('outdoor');
})();
