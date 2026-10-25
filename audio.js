(() => {
  'use strict';
  if (window.FinanceAudio) return;
  const manifest = {"click_low":"audio/click_low.mp3?v=40746a86bb80b024","click_high":"audio/click_high.mp3?v=e94da321b783d365","click_clear":"audio/click_clear.mp3?v=942f926f03da84f3","switch":"audio/switch.mp3?v=8d8098580b3b5c6b","back":"audio/back.mp3?v=305457fca15789a0","error":"audio/error_soft.mp3?v=8354cd5a68f17e20","error_strong":"audio/error_strong.mp3?v=63f0ad34f5d82670","paper":"audio/paper.mp3?v=dd439734e6a931b7","deposit":"audio/deposit.mp3?v=ae6702f67ca39475","success":"audio/complete.mp3?v=fbca9701babb8993","close":"audio/close.mp3?v=2304e7ad43b5cad0","coin":"audio/coin.mp3?v=c22bc689e7f25e67"};
  const levels = {click_low:-8,click_high:-11,click_clear:-12,switch:-13,back:-9,error:-10,error_strong:-10,paper:-18,deposit:-10,success:-10,close:-11,coin:-4};
  const offsets = {paper:.945,deposit:.212,coin:.182};
  const detail = new Set(['paper','deposit','coin']);
  const critical = new Set(['deposit','coin','success','error','error_strong']);
  const buffers = new Map(), active = new Set(), loading = new Map(), lastStart = new Map();
  let context, master, room, roomSend, enabled=true, volume=1, failures=0, attempts=0, started=0, hasGesture=false;
  const scriptBase = new URL('.', document.currentScript?.src || location.href);
  function init() {
    if (context && context.state!=='closed') return true;
    if(context?.state==='closed'){for(const voice of [...active])clean(voice);context=null;}
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    try {
      context = new Audio({latencyHint:'interactive'});
      master = context.createGain();
      master.gain.value = volume * .79;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value=-9; limiter.knee.value=10; limiter.ratio.value=12;
      limiter.attack.value=.001; limiter.release.value=.12;
      master.connect(limiter); limiter.connect(context.destination);
      room = context.createConvolver();
      // One short, deterministic room response, shared only by the three detail sounds.
      const impulse=context.createBuffer(2, Math.ceil(context.sampleRate*.27), context.sampleRate);
      let seed=91217;
      for(let channel=0;channel<2;channel++) {
        const samples=impulse.getChannelData(channel);
        for(let i=0;i<samples.length;i++) {
          seed=(Math.imul(seed,1664525)+1013904223)|0;
          samples[i]=((seed>>>0)/2147483648-1)*Math.exp(-i/(context.sampleRate*.043));
        }
      }
      room.buffer=impulse;
      roomSend=context.createGain(); roomSend.gain.value=.075;
      roomSend.connect(room); room.connect(master);
      return true;
    } catch (_) { failures++; return false; }
  }
  function load(kind) {
    if(buffers.has(kind))return Promise.resolve(buffers.get(kind));
    if(loading.has(kind))return loading.get(kind);
    const asset=manifest[kind];
    if(!asset||!init())return Promise.resolve(null);
    const task=fetch(new URL(asset,scriptBase)).then(response=>{
      if(!response.ok)throw new Error('Audio asset unavailable');
      return response.arrayBuffer();
    }).then(bytes=>context.decodeAudioData(bytes)).then(buffer=>{
      buffers.set(kind,buffer); return buffer;
    }).catch(()=>{failures++;return null;}).finally(()=>loading.delete(kind));
    loading.set(kind,task);return task;
  }
  async function resume() {
    if(!enabled||volume<=0||!init())return false;
    if(context.state!=='running') {
      try {await context.resume();} catch (_) {return false;}
    }
    return context.state==='running';
  }
  function clean(voice) {
    active.delete(voice);
    voice.source.onended=null;
    voice.source.disconnect();voice.gain.disconnect();
  }
  function start(kind) {
    const buffer=buffers.get(kind);
    if(!enabled||volume<=0||!buffer||context.state==='closed')return false;
    if(active.size>=(critical.has(kind)?20:16))return false;
    const now=context.currentTime, offset=Math.min(offsets[kind]||0,buffer.duration-.02);
    if(now-(lastStart.get(kind)??-100)<.035)return false;
    lastStart.set(kind,now);
    const duration=buffer.duration-offset, gain=context.createGain(), source=context.createBufferSource();
    const density=active.size<6?1:Math.sqrt(6/(active.size+1));
    const level=Math.pow(10,(levels[kind]??-12)/20)*density;
    source.buffer=buffer; source.playbackRate.value=1;
    // Preserve the complete source ending; millisecond gain ramps remove boundary clicks.
    gain.gain.setValueAtTime(0,now);
    gain.gain.linearRampToValueAtTime(level,now+.004);
    gain.gain.setValueAtTime(level,now+Math.max(.004,duration-.008));
    gain.gain.linearRampToValueAtTime(0,now+duration);
    source.connect(gain);gain.connect(master);
    if(detail.has(kind))gain.connect(roomSend);
    const voice={source,gain,kind};active.add(voice);
    source.onended=()=>clean(voice);
    started++;source.start(now,offset); // Audio rendering runs independently of Godot's UI frame loop.
    return true;
  }
  function play(kind) {
    attempts++;
    if(!enabled||volume<=0||kind==='silent'||!init())return false;
    if(!buffers.has(kind)){load(kind);return false;} // Never play a stale interaction later.
    if(context.state!=='running') {
      if(!hasGesture)return false;
      resume();
    }
    // Starting while resume is pending schedules on the audio clock, not a late JS callback.
    return start(kind);
  }
  function configure(on,gain) {
    enabled=!!on;volume=Math.max(0,Math.min(1,Number(gain)||0));
    if(!context)return;
    const now=context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(enabled?volume*.79:0,now,.012);
    if(!enabled||volume===0)for(const voice of [...active]) {
      if(!voice.stopping){voice.stopping=true;voice.source.stop(now+.04);}
    }
  }
  function dispose() {
    configure(false,0);
    context?.close().catch(()=>{});
  }
  window.FinanceAudio=Object.freeze({play,configure,resume,dispose,
    ready:()=>Promise.all(Object.keys(manifest).map(load)),
    diagnostics:()=>({backend:'buffered-webaudio',state:context?.state||'unavailable',loaded:buffers.size,active:active.size,failures,enabled,volume,attempts,started})});
  for(const event of ['pointerdown','touchend','keydown'])window.addEventListener(event,()=>{
    hasGesture=true;resume();
    if(buffers.size<Object.keys(manifest).length)Object.keys(manifest).forEach(load);
  },{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&enabled)resume();});
  init();Object.keys(manifest).forEach(load);
})();
