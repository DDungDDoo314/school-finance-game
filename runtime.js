(() => {
  if(window.FinanceRuntime)return;
  const runtime=window.FinanceRuntime={lost:false};
  function boot(){
    const canvas=document.getElementById('canvas');if(!canvas)return;
    // A single portrait canvas, not a second landscape layout. The engine alone
    // owns framebuffer pixels; CSS only places the portrait frame on the page.
    const frameStyle=document.createElement('style');
    frameStyle.textContent='html{--finance-safe-top:env(safe-area-inset-top,0px);--finance-safe-bottom:env(safe-area-inset-bottom,0px)}html,body{margin:0;overflow:hidden;background:#f3f8fd}html.finance-dark,html.finance-dark body{background:#0d1728}#canvas{position:absolute;top:var(--finance-frame-top,0px);left:50%;transform:translateX(-50%);width:var(--finance-frame-width,440px)!important;height:var(--finance-frame-height,820px)!important}';
    document.head?.appendChild(frameStyle);
    let lastPortrait=null,insets={top:0,bottom:0};
    function readInsets(){
      const style=window.getComputedStyle?.(document.documentElement);
      insets={top:parseFloat(style?.getPropertyValue('--finance-safe-top'))||0,bottom:parseFloat(style?.getPropertyValue('--finance-safe-bottom'))||0};
    }
    readInsets();
    runtime.portraitSize=()=>{
      const w=Math.round(window.innerWidth||440),h=Math.round(window.innerHeight||820);
      const mobile=!!window.matchMedia?.('(pointer: coarse)').matches;
      const active=document.activeElement?.classList?.contains('finance-native-input');
      let width,height,top=0;
      if(mobile){
        if(w<=h||(active&&lastPortrait?.width===w)){width=w;top=insets.top;height=active&&lastPortrait&&lastPortrait.width===w?Math.max(h-top-insets.bottom,lastPortrait.height):Math.max(160,h-top-insets.bottom);}
        else if(lastPortrait){width=lastPortrait.width;height=lastPortrait.height;top=runtime.frameTop||0;}
        else{width=Math.min(w,h);height=Math.max(w,h);}
      }else{width=Math.min(w,480);height=Math.max(h,640);}
      const topChanged=runtime.frameTop!==top;
      runtime.frameTop=top;
      const frame={width,height};
      if(!lastPortrait||lastPortrait.width!==width||lastPortrait.height!==height||topChanged){
        lastPortrait=frame;
        document.documentElement?.style?.setProperty('--finance-frame-top',top+'px');
        document.documentElement?.style?.setProperty('--finance-frame-width',width+'px');
        document.documentElement?.style?.setProperty('--finance-frame-height',height+'px');
      }
      return frame;
    };
    window.addEventListener('resize',()=>{readInsets();runtime.portraitSize();window.dispatchEvent?.(new Event('finance-resume'));});
    window.addEventListener('orientationchange',()=>{runtime.portraitSize();});
    runtime.portraitSize();
    // Try the real lock only where supported; rejection is expected in ordinary browser tabs.
    function tryLock(){try{window.screen?.orientation?.lock?.('portrait').catch(()=>{});}catch{}}
    document.addEventListener?.('pointerdown',tryLock,{once:true});
    document.addEventListener?.('fullscreenchange',()=>{if(document.fullscreenElement)tryLock();});
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
