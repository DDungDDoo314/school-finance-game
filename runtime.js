(() => {
  if(window.FinanceRuntime)return;
  const runtime=window.FinanceRuntime={lost:false};
  function boot(){
    const canvas=document.getElementById('canvas');if(!canvas)return;
    let height=window.innerHeight,width=window.innerWidth,queued=0;
    function resize(){
      queued=0;
      const typing=document.activeElement?.classList?.contains('finance-native-input');
      const newWidth=window.innerWidth;
      if(!typing||Math.abs(newWidth-width)>80){width=newWidth;height=window.innerHeight;}
      canvas.style.width=width+'px';canvas.style.height=height+'px';
      const factor=Math.min(1,1920/Math.max(1,width),1920/Math.max(1,height));
      const w=Math.round(width*factor),h=Math.round(height*factor);
      if(canvas.width!==w)canvas.width=w;
      if(canvas.height!==h)canvas.height=h;
    }
    window.addEventListener('resize',()=>{if(!queued)queued=requestAnimationFrame(resize);});
    resize();
    let panel=null;
    canvas.addEventListener('webglcontextlost',e=>{
      e.preventDefault();runtime.lost=true;
      if(panel)return;
      panel=document.createElement('div');panel.setAttribute('role','alert');
      Object.assign(panel.style,{position:'fixed',inset:'0',zIndex:'20000',background:'#f5f7ff',display:'grid',placeContent:'center',gap:'18px',padding:'24px',font:'600 18px system-ui',color:'#172337'});
      const label=document.createElement('div');label.textContent='화면 연결이 끊겼습니다.';
      const button=document.createElement('button');button.textContent='화면 다시 열기';
      Object.assign(button.style,{padding:'16px 24px',border:'0',borderRadius:'12px',background:'#3b58ff',color:'#fff',font:'inherit'});
      button.onclick=()=>location.reload();panel.append(label,button);document.body.append(panel);
    },false);
    canvas.addEventListener('webglcontextrestored',()=>{if(runtime.lost)location.reload();},false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
