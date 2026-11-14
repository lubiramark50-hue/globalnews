/* Isolated Adsterra banner runner; never lets vendor script reach parent DOM. */
(() => {
  const tag = document.currentScript;
  if(!tag) return;
  let options, source;
  try {
    options = JSON.parse(decodeURIComponent(tag.dataset.options || ''));
    source = new URL(decodeURIComponent(tag.dataset.source || ''));
  } catch { return; }
  const allowed = source.protocol === 'https:' && !source.username && !source.password &&
    /^[a-zA-Z0-9_-]{12,}$/.test(options.key || '') && options.format === 'iframe' &&
    ((options.width === 468 && options.height === 60) || (options.width === 300 && options.height === 250));
  if(!allowed) return;
  window.atOptions = options;
  const kind = options.width === 468 ? 'banner' : 'rectangle';
  let filled = false;
  const observer = new MutationObserver(() => {
    if(filled || !document.body.querySelector('iframe,img,a[href],video,canvas,ins,object')) return;
    filled = true;
    window.parent.postMessage({type:'globalnews:ad-filled',kind},'*');
    observer.disconnect();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  const script = document.createElement('script');
  script.src = source.href; script.async = true;
  script.setAttribute('data-cfasync','false');
  script.onerror = () => observer.disconnect();
  document.body.append(script);
})();
