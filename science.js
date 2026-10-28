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
  const metrics=[
    {key:'sr',name:'Success rate',label:'SR',higher:true,group:'Planning',note:'Fraction of episodes whose final predicted position satisfies the endpoint criterion.'},
    {key:'ate',name:'Absolute trajectory error',label:'ATE',higher:false,group:'Planning',note:'Global error between aligned predicted and recorded poses; dataset coordinate units.'},
    {key:'rpe',name:'Relative pose error',label:'RPE',higher:false,group:'Planning',note:'Relative-motion error between consecutive predicted and recorded poses.'},
    {key:'route',name:'Full-route fidelity',label:'Full-route fidelity',higher:true,group:'Planning',note:'Similarity of the entire ordered route, with excess travel penalized.'},
    {key:'heading',name:'Heading and turn fidelity',label:'Heading & turn fidelity',higher:true,group:'Planning',note:'Agreement in facing direction and the direction, location and amount of turns.'},
    {key:'ssim',name:'Structural similarity',label:'SSIM',higher:true,group:'Imagination',note:'Structural similarity between predicted and recorded observations.'},
    {key:'psnr',name:'Peak signal-to-noise ratio',label:'PSNR (dB)',higher:true,group:'Imagination',note:'Pixel reconstruction quality, measured in dB.'},
    {key:'lpips',name:'Learned perceptual image patch similarity',label:'LPIPS',higher:false,group:'Imagination',note:'Learned perceptual distance; lower is better.'},
    {key:'dreamsim',name:'DreamSim distance',label:'DreamSim',higher:false,group:'Imagination',note:'Perceptual distance to the recorded observation; lower is better.'}
  ];
  let split='val_seen',protocol='one_step',query='',sort='sr',ascending=false,selected=new Set(),only=false,expanded=null;
  const splitNames={val_seen:'Validation seen',val_unseen:'Validation unseen',test:'Test'};
  const rows=tables[0].rows.map(r=>({...r,image:tables[1].rows.find(v=>v.method===r.method.replace(' + LCVN-AC','')&&v.k===r.k)}));
  function cell(row,m){return m.group==='Planning'?row.cells[split+'.'+m.key]:(split==='val_seen'?row.image?.cells[protocol+'.'+m.key]:null);}
  function shown(){const m=metrics.find(m=>m.key===sort);return rows.filter(r=>(r.method+' k = '+r.k).toLowerCase().includes(query.toLowerCase())&&(!only||selected.has(r.id))).sort((a,b)=>{const av=cell(a,m)?.value,bv=cell(b,m)?.value;if(av==null)return bv==null?0:1;if(bv==null)return -1;return (ascending?1:-1)*(av-bv);});}
  function render(){
    const visible=shown();
    const ranks=Object.fromEntries(metrics.map(m=>[m.key,[...new Set(rows.map(r=>cell(r,m)?.value).filter(v=>typeof v==='number'))].sort((a,b)=>m.higher?b-a:a-b)]));
    $('#results-table').innerHTML=`<caption class="sr-only">${splitNames[split]} · ${protocol==='one_step'?'single-frame':'rollout @8'} visual prediction</caption><thead><tr class="lb-group-head"><th rowspan="2" scope="col" class="lb-model-heading">Model</th><th colspan="5" scope="colgroup">Planning</th><th colspan="4" scope="colgroup">Imagination · ${protocol==='one_step'?'single frame':'rollout @8'}</th></tr><tr>${metrics.map(m=>`<th scope="col" aria-sort="${sort===m.key?(ascending?'ascending':'descending'):'none'}"><button data-sort="${m.key}" title="${esc(m.name+' — '+m.note)}">${esc(m.label)} ${m.higher?'↑':'↓'}<span aria-hidden="true">⇅</span></button></th>`).join('')}</tr></thead><tbody>${visible.map(r=>`<tr class="lb-row ${selected.has(r.id)?'selected':''}"><th scope="row"><div class="lb-model"><input type="checkbox" data-select="${r.id}" aria-label="Select ${esc(r.method)} context ${r.k}" ${selected.has(r.id)?'checked':''}><button data-expand="${r.id}" aria-expanded="${expanded===r.id}"><span>${esc(r.method)}<small>Context k = ${r.k}</small></span><span aria-hidden="true">${expanded===r.id?'⌃':'⌄'}</span></button></div></th>${metrics.map(m=>{const c=cell(r,m),rank=c?.status==='reported'?ranks[m.key].indexOf(c.value)+1:0;return `<td class="lb-value"><span class="${rank>0&&rank<=3?'lb-top lb-top-'+rank:''}" ${!rank?'title="Not reported"':''}>${rank?esc(c.raw):'—'}</span></td>`;}).join('')}</tr>${expanded===r.id?`<tr><td colspan="10"><div class="lb-detail"><strong>${esc(r.method)} · context k = ${r.k}</strong>${r.notes.map(n=>`<p>${esc(n)}</p>`).join('')}<p>${r.image?'Visual metrics refer to '+esc(r.image.method)+' with the same context size, evaluated using recorded actions.':'Visual prediction metrics are not reported for this model.'}</p><a href="${tables[0].source}" target="_blank" rel="noopener">Paper source ↗</a></div></td></tr>`:''}`).join('')||'<tr><td colspan="10" class="lb-empty">No matching models. <button data-reset>Reset filters</button></td></tr>'}</tbody>`;
    $('#leaderboard-selection').hidden=!selected.size;$('#leaderboard-count').textContent=selected.size+' selected';$('#leaderboard-only').textContent=only?'Show all models':'Show selected only';
    $('#leaderboard-note').textContent=split==='val_seen'?'Paper-reported scores. Full-route fidelity and heading and turn fidelity are not reported; visual scores use recorded actions.':'Paper-reported navigation scores. Full-route fidelity, heading and turn fidelity, and visual scores for this split are not reported.';
  }
  const tabs=$$('[data-split]');function choose(b){split=b.dataset.split;selectTabs(tabs,b);$('#split-results').setAttribute('aria-labelledby',b.id);render();}wireTabs(tabs,choose);
  $('#image-protocol').addEventListener('change',e=>{protocol=e.target.value;render();});
  $('#leaderboard-search').addEventListener('input',e=>{query=e.target.value;render();});
  $('#results-table').addEventListener('click',e=>{const s=e.target.closest('[data-sort]'),x=e.target.closest('[data-expand]');if(s){ascending=sort===s.dataset.sort?!ascending:!metrics.find(m=>m.key===s.dataset.sort).higher;sort=s.dataset.sort;render();}if(x){expanded=expanded===x.dataset.expand?null:x.dataset.expand;render();}if(e.target.closest('[data-reset]')){query='';only=false;$('#leaderboard-search').value='';render();}});
  $('#results-table').addEventListener('change',e=>{const id=e.target.dataset.select;if(!id)return;selected.has(id)?selected.delete(id):selected.add(id);if(!selected.size)only=false;render();});
  $('#leaderboard-only').addEventListener('click',()=>{only=!only;render();});$('#leaderboard-clear').addEventListener('click',()=>{selected.clear();only=false;render();});
  $('#leaderboard-export').addEventListener('click',()=>{const quote=v=>'"'+String(v).replaceAll('"','""')+'"';const data=[['Model','Context k','Split','Visual protocol',...metrics.map(m=>m.name)],...shown().map(r=>[r.method,r.k,split,protocol,...metrics.map(m=>cell(r,m)?.status==='reported'?cell(r,m).raw:'')])];const url=URL.createObjectURL(new Blob([data.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=`lcvn-${split}-${protocol}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('#leaderboard-metric-definitions').innerHTML=metrics.map(m=>`<article><h4>${esc(m.name)} ${m.higher?'↑':'↓'}</h4><p>${esc(m.note)}</p></article>`).join('');render();

})();
