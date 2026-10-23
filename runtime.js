(() => {
  if(window.FinanceRuntime)return;
  const runtime=window.FinanceRuntime={lost:false};
  function boot(){
    const canvas=document.getElementById('canvas');if(!canvas)return;
    // Godot alone owns canvas sizing and device-pixel-ratio handling.
    // A second canvas.width/height writer desynchronizes drawing and hit testing.
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
