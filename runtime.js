(() => {
  if(window.FinanceRuntime)return;
  const runtime=window.FinanceRuntime={lost:false,portraitBlocked:false};
  function boot(){
    const canvas=document.getElementById('canvas');if(!canvas)return;
    // Godot alone owns canvas sizing and device-pixel-ratio handling.
    // A second canvas.width/height writer desynchronizes drawing and hit testing.
    // Mobile browsers may refuse OS orientation locks (especially iOS Safari).
    // Keep the game portrait-only with an accessible guard, without rotating or resizing the canvas ourselves.
    const orientationStyle=document.createElement('style');
    orientationStyle.textContent='html.finance-landscape #canvas{visibility:hidden!important}html.finance-landscape .finance-native-input{visibility:hidden!important}';
    document.head?.appendChild(orientationStyle);
    const portrait=document.createElement('div');
    portrait.setAttribute('role','status');
    portrait.textContent='세로 화면으로 돌려 주세요.';
    Object.assign(portrait.style,{position:'fixed',inset:'0',zIndex:'19000',display:'none',placeContent:'center',background:'#f3f8fd',color:'#1764e8',font:'500 18px system-ui',textAlign:'center',padding:'24px'});
    document.body.append(portrait);
    let orientationFrame=0;
    function orientation(){
      const mobile=window.matchMedia?.('(pointer: coarse)').matches;
      // Screen geometry, rather than keyboard-shortened innerHeight, determines orientation.
      const angle=window.screen?.orientation?.angle;
      const legacyAngle=window.orientation;
      const sideways=typeof angle==='number'?Math.abs(angle)%180===90:typeof legacyAngle==='number'?Math.abs(legacyAngle)%180===90:window.screen?.width>window.screen?.height;
      const wasBlocked=runtime.portraitBlocked;
      // Orientation events can precede the viewport resize. Keep the guard up until
      // portrait geometry arrives, rather than resuming with stale landscape sizes.
      const viewportPortrait=window.innerWidth<=window.innerHeight;
      const framebufferReady=!(canvas.width>0&&canvas.height>0)||Math.abs(canvas.width/canvas.height-window.innerWidth/window.innerHeight)<0.015;
      const unsettled=wasBlocked&&!sideways&&(!viewportPortrait||!framebufferReady);
      if(unsettled&&!orientationFrame)orientationFrame=requestAnimationFrame(()=>{orientationFrame=0;orientation();});
      runtime.portraitBlocked=!!(mobile&&(sideways||unsettled));
      document.documentElement?.classList.toggle('finance-landscape',runtime.portraitBlocked);
      portrait.style.display=runtime.portraitBlocked?'grid':'none';
      if(runtime.portraitBlocked&&document.activeElement?.classList?.contains('finance-native-input'))document.activeElement.blur();
      if(wasBlocked&&!runtime.portraitBlocked)window.dispatchEvent?.(new Event('finance-resume'));
    }
    window.addEventListener('orientationchange',orientation);
    window.addEventListener('resize',orientation);
    window.screen?.orientation?.addEventListener('change',orientation);
    // Try the real lock only where supported; rejection is expected in ordinary browser tabs.
    function tryLock(){window.screen?.orientation?.lock?.('portrait').catch(()=>{});}
    document.addEventListener?.('pointerdown',tryLock,{once:true});
    orientation();
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
