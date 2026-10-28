'use strict';
(() => {
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const selectTabs=(buttons,selected)=>buttons.forEach(b=>{const on=b===selected;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
  const wireTabs=(buttons,change)=>buttons.forEach(b=>{
    b.addEventListener('click',()=>change(b));
    b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=buttons.indexOf(b),n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;change(buttons[n]);buttons[n].focus();});
  });

  // Display-only viewports into unchanged, published figures. No frames are synthesized.
  const cases={
    glass:{figure:4,asset:'visual.png',size:[2029,782],source:'S5.F4',tag:'Figure 4 · validation seen',
      instruction:'Walk on the right with glass windows to your left. Then take two lefts along the curved glass wall.',
      reading:'Follow the two left turns and the curved glass wall. The published comparison highlights how the LCVN agents respond to direction changes while retaining the window landmark.',
      x:[79,326,575,821],y:[114,331,549],w:207,h:207},
    door:{figure:4,asset:'visual.png',size:[2029,782],source:'S5.F4',tag:'Figure 4 · validation seen',
      instruction:'Follow the green sign on the left, then turn right towards the white door.',
      reading:'A correct turn is only part of the task. The paper notes that LCVN-Uni turns right but fails to synthesize the subsequent corridor and white door; LCVN-WM + LCVN-AC preserves that landmark more successfully in this example.',
      x:[1079,1327,1574,1818],y:[115,333,550],w:207,h:207},
    language:{figure:5,asset:'visual_compare2.png',size:[2048,1833],source:'S5.F5',tag:'Figure 5 · language ablation',
      instruction:'Follow the hallway until you see the orange wall on your right.',
      reading:'Compare the orange wall as the sequence advances. In this published example, language-conditioned predictions preserve the instructed landmark more clearly. For LCVN-Uni, “w/o ins” removes language only from the observation-prediction substep.',
      x:[375,791,1208,1626],y:[130,537,944,1356],w:389,h:390}
  };
  let caseKey='glass',sample=0,evidenceModel='uni';
  const caseTabs=$$('[data-case]');
  function renderEvidence(){
    const c=cases[caseKey],language=caseKey==='language';
    $('#evidence-source-tag').textContent=c.tag;
    $('#evidence-instruction').textContent=c.instruction;
    $('#evidence-reading').textContent=c.reading;
    $('#evidence-model-select').hidden=!language;
    const models=language?(evidenceModel==='uni'?[{name:'LCVN-Uni',sub:'Without instruction',row:0,kind:'uni'},{name:'LCVN-Uni',sub:'With instruction',row:1,kind:'uni'}]:[{name:'LCVN-WM',sub:'Without instruction',row:2,kind:'wm'},{name:'LCVN-WM',sub:'With instruction',row:3,kind:'wm'}]):[{name:'NWM + LCVN-AC',sub:'Baseline',row:0,kind:'baseline'},{name:'LCVN-Uni',sub:'Unified prediction',row:1,kind:'uni'},{name:'LCVN-WM + LCVN-AC',sub:'Latent imagination',row:2,kind:'wm'}];
    $('#evidence-frames').dataset.columns=models.length;
    $('#evidence-frames').innerHTML=models.map(m=>`<figure class="published-sample ${m.kind}"><figcaption><strong>${esc(m.name)}</strong><span>${esc(m.sub)}</span></figcaption><svg role="img" aria-label="${esc(m.name+' · '+m.sub+' · '+(language?['t − 1','t','t + 1','t + 2'][sample]:'published sample '+(sample+1)))}" viewBox="${c.x[sample]} ${c.y[m.row]} ${c.w} ${c.h}"><image href="assets/paper/${c.asset}" width="${c.size[0]}" height="${c.size[1]}"/></svg></figure>`).join('');
    $('#evidence-moment').textContent=language?['t − 1','t','t + 1','t + 2'][sample]:`Sample ${sample+1} of 4`;
    $('#evidence-steps').innerHTML=Array.from({length:4},(_,i)=>`<button data-evidence-step="${i}" aria-pressed="${i===sample}" aria-label="${language?'Show '+['t minus 1','t','t plus 1','t plus 2'][i]:'Show published sample '+(i+1)}">${language?['t − 1','t','t + 1','t + 2'][i]:String(i+1).padStart(2,'0')}</button>`).join('');
    $('#evidence-original-image').src='assets/paper/'+c.asset;
    $('#evidence-zoom').dataset.zoomSrc='assets/paper/'+c.asset;
    $('#evidence-zoom').dataset.figureTitle='Published qualitative comparison · Figure '+c.figure;
    $('#evidence-paper-link').href='https://arxiv.org/html/2603.26741v2#'+c.source;
  }
  wireTabs(caseTabs,b=>{caseKey=b.dataset.case;sample=0;selectTabs(caseTabs,b);$('#evidence-panel').setAttribute('aria-labelledby',b.id);renderEvidence();});
  $('#evidence-steps').addEventListener('click',e=>{const b=e.target.closest('[data-evidence-step]');if(b){sample=Number(b.dataset.evidenceStep);renderEvidence();$('#evidence-steps').querySelector(`[data-evidence-step="${sample}"]`).focus();}});
  $('#evidence-steps').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();sample=e.key==='Home'?0:e.key==='End'?3:Math.max(0,Math.min(3,sample+(e.key==='ArrowRight'?1:-1)));renderEvidence();$('#evidence-steps').querySelector(`[data-evidence-step="${sample}"]`).focus();});
  $$('[data-evidence-model]').forEach(b=>b.addEventListener('click',()=>{evidenceModel=b.dataset.evidenceModel;$$('[data-evidence-model]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderEvidence();}));
  $('#evidence-original-toggle').addEventListener('click',()=>{const b=$('#evidence-original-toggle'),open=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(open));b.querySelector('span').textContent=open?'−':'＋';$('#evidence-original').hidden=!open;});
  renderEvidence();

  const tables=window.LCVN_PAPER_RESULTS.tables;
  const metrics={
    sr:{name:'Success rate',short:'SR',higher:true,unit:'',note:'SR is shown as the reported fraction (0–1). Success: final goal distance is smaller than the agent’s average step size.'},
    ate:{name:'Absolute trajectory error',short:'ATE',higher:false,unit:'',note:'Trajectory-level action error. Values retain the paper’s reporting scale; its tables do not specify a physical unit.'},
    rpe:{name:'Relative pose error',short:'RPE',higher:false,unit:'',note:'Relative-motion error. Values retain the paper’s reporting scale; its tables do not specify a physical unit.'},
    ssim:{name:'Structural similarity',short:'SSIM',higher:true,unit:'',note:'Structural similarity to recorded observations. Visual fidelity and navigation success are evaluated separately.'},
    psnr:{name:'Peak signal-to-noise ratio',short:'PSNR',higher:true,unit:'dB',note:'Pixel-level reconstruction quality, reported in dB. Higher values indicate closer image reconstruction.'},
    lpips:{name:'Perceptual distance',short:'LPIPS',higher:false,unit:'',note:'Learned perceptual image distance. Lower values indicate closer visual predictions.'},
    dreamsim:{name:'DreamSim distance',short:'DreamSim',higher:false,unit:'',note:'Perceptual similarity evaluated as a distance. Lower values indicate closer alignment.'}
  };
  const views={
    navigation:{table:0,title:'From one view to a complete route',scopes:{val_seen:'Validation seen',val_unseen:'Validation unseen',test:'Test'},metric:'sr',
      protocol:'Offline action-sequence prediction, starting from the initial image and instruction. No intermediate environmental feedback.',
      insight:'The two paradigms have complementary strengths. WM + AC (k = 4) has the highest seen-environment SR; Uni (k = 2) has the highest unseen-environment and test SR in Table 1.'},
    imagination:{table:1,title:'How closely does the imagined future match?',scopes:{rollout8:'Open-loop rollout · @8',one_step:'Single-frame prediction'},metric:'ssim',
      protocol:'Validation seen. Visual prediction is evaluated using recorded ground-truth actions, separately from agent-predicted navigation.',
      insight:'LCVN-WM leads structural and pixel-level fidelity, while LCVN-Uni has the lowest DreamSim distance. A visually faithful rollout and a successful navigation plan measure different properties.'},
    language:{table:3,title:'Which kind of instruction helps?',scopes:{navigation:'Navigation · validation seen',one_step:'Imagination · single frame',rollout8:'Imagination · @8'},metric:'sr',
      protocol:'Instruction-style ablation on validation seen: LCVN-Uni (k = 2) and LCVN-WM (k = 4). Table 4 is a separate experiment from Tables 1–2.',
      insight:'Landmark-based instructions produce the highest SR for both paradigms (0.47). Concise instructions outperform Intricate in SR, but that ordering does not hold for every metric.'},
    conditioning:{table:2,title:'What does each conditioning signal contribute?',scopes:{navigation:'Navigation · validation seen',one_step:'Imagination · single frame',rollout8:'Imagination · @8'},metric:'sr',
      protocol:'LCVN-WM (k = 4), validation seen. Compare the seven language / action / time combinations reported in Table 3.',
      insight:'All three signals together give the strongest SR (0.43). With time retained, adding actions raises SR from 0.12 to 0.35; adding language then raises it to 0.43.'}
  };
  let view='navigation',scope='val_seen',metric='sr',display='chart',filter='all';
  const resultTabs=$$('[data-results]');
  const family=r=>r.method.startsWith('LCVN-Uni')?'uni':r.method.startsWith('LCVN-WM')?'wm':'baseline';
  function rowLabel(r){
    if(view==='conditioning')return Object.entries(r.conditioning).filter(([,v])=>v).map(([k])=>k[0].toUpperCase()+k.slice(1)).join(' + ');
    if(view==='language')return r.style==='Landmark.'?'Landmark-based':r.style;
    return r.method;
  }
  function rowDetail(r){return view==='language'?`${r.method} · k = ${r.k}`:view==='conditioning'?'LCVN-WM · k = 4':`k = ${r.k}`;}
  function visibleRows(){const rows=tables[views[view].table].rows;return filter==='full'&&(view==='navigation'||view==='imagination')?rows.filter(r=>!r.method.includes('w/o ins')):rows;}
  function setControls(){
    const v=views[view],t=tables[v.table];
    $('#results-scope-caption').textContent=view==='navigation'?'Evaluation split':'Evaluation setting';
    $('#results-scope').innerHTML=Object.entries(v.scopes).map(([k,name])=>`<option value="${k}" ${k===scope?'selected':''}>${name}</option>`).join('');
    const available=t.columns.filter(c=>c.key.startsWith(scope+'.')).map(c=>c.metric);
    if(!available.includes(metric))metric=available.includes('sr')?'sr':available.includes('ssim')?'ssim':available[0];
    $('#results-metric').innerHTML=available.map(k=>`<option value="${k}" ${k===metric?'selected':''}>${metrics[k].short} ${metrics[k].higher?'↑':'↓'} — ${metrics[k].name}</option>`).join('');
    $('#results-model-label').hidden=view==='language'||view==='conditioning';
  }
  function axisMaximum(values){
    if(['sr','ssim','lpips','dreamsim'].includes(metric))return Math.max(1,...values);
    const max=Math.max(...values),order=10**Math.floor(Math.log10(max||1)),step=order/2;
    return Math.ceil(max/step)*step;
  }
  function renderResults(){
    const v=views[view],t=tables[v.table],m=metrics[metric],rows=visibleRows(),key=scope+'.'+metric;
    const presentFamilies=new Set(rows.map(family));
    [...$('#results-legend').children].slice(0,3).forEach((el,i)=>{el.hidden=display==='table'||!presentFamilies.has(['baseline','uni','wm'][i]);});
    $('#results-kicker').textContent=t.label+' · paper-reported';$('#results-title').textContent=v.title;
    $('#results-protocol').textContent=v.protocol;
    $('#results-direction').textContent=m.short+(m.unit?' ('+m.unit+')':'')+' · '+(m.higher?'Higher is better ↑':'Lower is better ↓');
    $('#results-metric-note').textContent=m.note;$('#results-insight').textContent=v.insight;
    $('#results-source').textContent='Paper '+t.label+' ↗';$('#results-source').href=t.source;
    const values=rows.map(r=>r.cells[key]?.value).filter(x=>typeof x==='number'&&Number.isFinite(x));
    const max=axisMaximum(values),best=m.higher?Math.max(...values):Math.min(...values);
    const axisValue=x=>String(Number(x.toFixed(3)));
    $('#results-chart').innerHTML=`<div class="chart-axis"><span>Model / configuration</span><div><span>0</span><span>${axisValue(max/2)}</span><span>${axisValue(max)}</span></div><span>${esc(m.short)}</span></div>`+rows.map(r=>{
      const c=r.cells[key],reported=c&&c.status==='reported'&&typeof c.value==='number',win=reported&&c.value===best;
      return `<div class="metric-row ${family(r)} ${r.method.includes('w/o ins')?'ablated':''}" data-row-id="${r.id}"><div class="metric-label"><strong>${esc(rowLabel(r))}</strong><span>${esc(rowDetail(r))}</span></div><div class="metric-track" aria-hidden="true">${reported?`<div class="metric-bar" style="width:${Math.max(0,c.value/max*100)}%"></div>`:''}</div><span class="metric-value ${win?'metric-best':''}">${reported?esc(c.raw):'—'}${win?'<span class="sr-only">, best reported value in this view</span>':''}</span></div>`;
    }).join('');
    const columns=t.columns.filter(c=>c.key.startsWith(scope+'.'));
    $('#results-table').innerHTML=`<caption>${esc(t.label+' · '+v.scopes[scope])}</caption><thead><tr><th scope="col">Model / configuration</th><th scope="col">Context k</th>${columns.map(c=>`<th scope="col" ${c.metric===metric?'class="selected-metric"':''}>${esc(metrics[c.metric].short)} ${metrics[c.metric].higher?'↑':'↓'}</th>`).join('')}</tr></thead><tbody>`+rows.map(r=>`<tr data-row-id="${r.id}"><th scope="row">${esc(rowLabel(r))}${view==='language'?`<small>${esc(r.method)}</small>`:''}</th><td>${r.k}</td>${columns.map(c=>`<td ${c.metric===metric?'class="selected-metric"':''}>${r.cells[c.key]?.status==='reported'?esc(r.cells[c.key].raw):'—'}</td>`).join('')}</tr>`).join('')+'</tbody>';
    $('#results-chart').hidden=display!=='chart';$('#results-table-wrap').hidden=display!=='table';
    let details=[];
    if(view==='navigation')details.push('Navigation compares predicted action trajectories with recorded trajectories. Validation seen is in-domain; validation unseen comes from TartanDrive; test mixes seen-source and unseen-source data.');
    if(view==='imagination'||(view==='language'||view==='conditioning')&&scope!=='navigation')details.push('Imagination uses recorded ground-truth actions. Single-frame prediction and open-loop rollout @8 are separate protocols; @8 reports the eighth predicted step, not an average of the first eight steps. These scores do not measure closed-loop robot success.');
    if(view==='navigation'||view==='imagination')details.push('k is the context size. LCVN-Uni at k = 4 uses fewer visual tokens than at k = 1 or 2; this is not a context-only change at fixed visual resolution. Baselines are retrained on LCVN. “(lang)” denotes the paper’s language-conditioned adaptations.');
    if(view!=='conditioning')details.push('“w/o ins” for LCVN-Uni removes instructions only from its observation-prediction substep; for LCVN-WM it removes language conditioning.');
    if(view==='language')details.push('The paper abbreviates Landmark-based as “Landmark.” in Table 4. Values here are from this ablation, not substituted into the main-comparison tables.');
    if(view==='conditioning')details.push('Action conditioning refers to the world-model input. In imagination, disabling it removes that input despite the ground-truth-action evaluation protocol. The all-signals-off combination is not reported and is not assigned a zero score.');
    details.push('Values retain the published precision and table order. Exact evaluated sample/window counts and uncertainty estimates are not separately reported. This page does not rerun the models.');
    $('#results-details').innerHTML=details.map(p=>'<p>'+esc(p)+'</p>').join('')+'<a href="assets/paper-results-provenance.json" download>Download values and cell-level sources ↓</a>';
  }
  wireTabs(resultTabs,b=>{view=b.dataset.results;scope=Object.keys(views[view].scopes)[0];metric=views[view].metric;selectTabs(resultTabs,b);$('#results-panel').setAttribute('aria-labelledby',b.id);setControls();renderResults();});
  $('#results-scope').addEventListener('change',e=>{scope=e.target.value;setControls();renderResults();});
  $('#results-metric').addEventListener('change',e=>{metric=e.target.value;renderResults();});
  $('#results-models').addEventListener('change',e=>{filter=e.target.value;renderResults();});
  $$('[data-results-display]').forEach(b=>b.addEventListener('click',()=>{display=b.dataset.resultsDisplay;$$('[data-results-display]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderResults();}));
  setControls();renderResults();
})();
