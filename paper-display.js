(() => {
  const dialog=document.querySelector('#paper-figure-dialog'),img=document.querySelector('#dialog-figure-image'),stage=document.querySelector('#dialog-figure-stage'),zoom=document.querySelector('#paper-figure-fit');
  let enlarged=false;
  function sizeFigure(){img.style.width=enlarged?Math.max(img.naturalWidth,stage.clientWidth*1.7)+'px':'100%';zoom.textContent=enlarged?'Fit to width':'Enlarge';stage.classList.toggle('is-enlarged',enlarged);}
  document.addEventListener('click',e=>{const button=e.target.closest('[data-zoom-src]');if(!button)return;enlarged=false;const title=button.dataset.figureTitle||'Paper figure';document.querySelector('#paper-figure-title').textContent=title;img.alt=title;img.src=button.dataset.zoomSrc;dialog.showModal();sizeFigure();});
  img.addEventListener('load',sizeFigure);zoom.addEventListener('click',()=>{enlarged=!enlarged;sizeFigure();});document.querySelector('#paper-figure-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  const toggle=document.querySelector('#task-formulation-toggle');toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));document.querySelector('#task-formulation-panel').hidden=!open;toggle.querySelector('span').textContent=open?'−':'＋';});
})();
