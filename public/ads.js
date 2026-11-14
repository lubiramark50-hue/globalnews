/* Reusable Troot-style placements, gated by GlobalNews's own approved units. */
(() => {
  const config = window.GlobalNewsAdConfig;
  if (!config || config.enabled !== true || config.domainApproved !== true ||
      config.approvedHost !== location.hostname) return;
  const safe = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; }
    catch { return null; }
  };
  const validNative = !!(config.native && /^[a-zA-Z0-9_-]{8,}$/.test(config.native.containerId || '') && safe(config.native.source));
  const units = {};
  for (const kind of ['banner', 'rectangle']) {
    const u = config[kind], source = safe(u?.source);
    if (source && /^[a-zA-Z0-9_-]{12,}$/.test(u?.key || '') &&
        (kind === 'banner' ? u.width === 468 && u.height === 60 : u.width === 300 && u.height === 250)) {
      units[kind] = { ...u, source };
    }
  }
  if (!validNative && !Object.keys(units).length) return;
  const find = kind => {
    if (kind !== 'native') return document.querySelector('[data-ad-unit="' + kind + '"]');
    const placement = matchMedia('(max-width:760px)').matches ? 'feed' : 'sidebar';
    return document.querySelector('[data-ad-unit="native"][data-ad-placement="' + placement + '"]') ||
      document.querySelector('[data-ad-unit="native"][data-ad-placement="sidebar"]');
  };
  const show = slot => { if(slot){ slot.hidden = false; slot.classList.add('ad-ready'); } };
  const hide = slot => { if(slot){ slot.hidden = true; slot.classList.remove('ad-ready'); } };
  let nativeRoot, nativeScript, nativeFilled = false;
  const frames = {};
  const nativeHasFill = () => !!nativeRoot?.querySelector('iframe,img,a[href],video,canvas,ins,object');
  function mountNative(){
    if(!validNative) return;
    const slot = find('native'), host = slot?.querySelector('.ad-content');
    if(!host) return;
    if(!nativeRoot) {
      nativeRoot = document.createElement('div');
      nativeRoot.id = config.native.containerId;
      new MutationObserver(() => {
        nativeFilled = nativeHasFill();
        if(nativeFilled) show(find('native'));
      }).observe(nativeRoot, {childList:true,subtree:true});
    }
    host.append(nativeRoot);
    if(!nativeScript) {
      nativeScript = document.createElement('script');
      nativeScript.src = safe(config.native.source);
      nativeScript.async = true;
      nativeScript.setAttribute('data-cfasync','false');
      nativeScript.onerror = () => hide(find('native'));
      host.append(nativeScript);
    } else if(nativeScript.parentNode !== host) host.append(nativeScript);
    if(nativeFilled || nativeHasFill()) show(slot);
  }
  function mountFrame(kind){
    const unit = units[kind];
    if(!unit || (kind === 'banner' && matchMedia('(max-width:760px)').matches)) return;
    const slot = find(kind), host = slot?.querySelector('.ad-content');
    if(!host) return;
    if(!frames[kind]) {
      const frame = document.createElement('iframe');
      frame.title = 'Sponsored advertisement';
      frame.width = unit.width; frame.height = unit.height;
      frame.loading = 'lazy'; frame.style.border = '0';
      frame.setAttribute('sandbox','allow-scripts allow-popups');
      frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
      const opts = encodeURIComponent(JSON.stringify({key:unit.key,format:'iframe',height:unit.height,width:unit.width,params:{}}));
      const src = encodeURIComponent(unit.source);
      frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0">' +
        '<script src="/ad-frame.js" data-options="' + opts + '" data-source="' + src + '"></script></body></html>';
      frames[kind] = {frame, filled:false};
    }
    host.append(frames[kind].frame);
    if(frames[kind].filled) show(slot);
  }
  window.addEventListener('message',event=>{
    const msg = event.data;
    if(!msg || msg.type !== 'globalnews:ad-filled') return;
    const item = frames[msg.kind];
    if(!item || event.source !== item.frame.contentWindow) return;
    item.filled = true; show(find(msg.kind));
  });
  function mount(){
    document.querySelectorAll('.ad-slot:not(.ad-ready)').forEach(hide);
    mountNative(); mountFrame('banner'); mountFrame('rectangle');
  }
  document.addEventListener('globalnews:render',mount);
  window.addEventListener('resize',mount,{passive:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
