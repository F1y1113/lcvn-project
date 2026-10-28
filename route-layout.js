/* Diagram coordinates only: no physical units, smoothing or inferred controls. */
(function(root){
  function projectPositions(positions){
    const xs=positions.map(p=>p[0]),ys=positions.map(p=>p[1]);
    const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const scale=Math.min(192/Math.max(xmax-xmin,1e-9),104/Math.max(ymax-ymin,1e-9));
    return positions.map(([x,y])=>[+(160+(x-(xmin+xmax)/2)*scale).toFixed(3),+(100-(y-(ymin+ymax)/2)*scale).toFixed(3)]);
  }
  function segmentHitsBox(a,b,box,pad=0){
    let low=0,high=1;
    for(let axis=0;axis<2;axis++){
      const start=a[axis],delta=b[axis]-start,min=(axis?box.y:box.x)-pad,max=min+(axis?box.h:box.w)+2*pad;
      if(Math.abs(delta)<1e-9){if(start<min||start>max)return false;continue;}
      let t0=(min-start)/delta,t1=(max-start)/delta;if(t0>t1)[t0,t1]=[t1,t0];
      low=Math.max(low,t0);high=Math.min(high,t1);if(low>high)return false;
    }
    return true;
  }
  function overlaps(a,b,pad=0){return a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;}
  function placeEndpointLabels(points){
    const labels=[];
    for(const [index,text] of [[0,'Start'],[points.length-1,'End']]){
      const p=points[index],neighbour=points[index===0?Math.min(1,points.length-1):Math.max(0,index-1)];
      const base=Math.atan2(p[1]-neighbour[1],p[0]-neighbour[0]);let best;
      for(const offset of [0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI,3*Math.PI/4,-3*Math.PI/4])for(const distance of [36,46,58]){
        const angle=base+offset,w=text==='Start'?50:43,h=25,cx=p[0]+Math.cos(angle)*distance,cy=p[1]+Math.sin(angle)*distance;
        const box={x:Math.max(7,Math.min(313-w,cx-w/2)),y:Math.max(7,Math.min(193-h,cy-h/2)),w,h,text,index};
        let score=Math.abs(offset)*3+distance*.08+Math.abs(box.x+w/2-cx)+Math.abs(box.y+h/2-cy);
        for(let i=1;i<points.length;i++)if(segmentHitsBox(points[i-1],points[i],box,6))score+=1000;
        for(const other of labels)if(overlaps(box,other,5))score+=2000;
        const dx=Math.max(box.x-p[0],0,p[0]-(box.x+w)),dy=Math.max(box.y-p[1],0,p[1]-(box.y+h));
        if(Math.hypot(dx,dy)<17)score+=1000;
        if(!best||score<best.score)best={...box,score};
      }
      labels.push(best);
    }
    return labels;
  }
  const api={projectPositions,placeEndpointLabels,segmentHitsBox};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LCVNRouteLayout=api;
})(typeof window!=='undefined'?window:this);
