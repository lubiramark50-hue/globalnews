/* Nonintrusive Adsterra slots. Run ONLY after the GlobalNews domain is approved.
   Keep placements collapsed when the advertiser does not supply creative. */
(()=>{
 const config=window.GlobalNewsAdConfig;
 if(!config?.enabled || config.approvedHost!==location.hostname) return;
 if(!/^https:\/\//.test(config.banner?.source||"") || !/^https:\/\//.test(config.native?.source||""))return;
 let nativeRoot=null, bannerRoot=null, nativeLoaded=false, bannerLoaded=false;
 const reveal=s=>{s.hidden=false;s.classList.add("ad-ready")};
 const mount=()=>{
  const mobile=matchMedia('(max-width:760px)').matches;
  const nativeSlot=mobile?(document.querySelector('[data-ad-unit="native"][data-ad-placement="feed"]')||document.querySelector('[data-ad-unit="native"][data-ad-placement="sidebar"]')):document.querySelector('[data-ad-unit="native"][data-ad-placement="sidebar"]');
  if(nativeSlot){
   const host=nativeSlot.querySelector(".ad-content");
   if(host){
    if(!nativeRoot){nativeRoot=document.createElement("div");nativeRoot.id=config.native.containerId}
    host.append(nativeRoot);
    if(!nativeLoaded){
      nativeLoaded=true;
      const watcher=new MutationObserver(()=>{if(nativeRoot.querySelector("iframe,img,ins,a[href],video")){reveal(nativeSlot);watcher.disconnect()}});
      watcher.observe(nativeRoot,{childList:true,subtree:true});
      setTimeout(()=>watcher.disconnect(),12000);
      const script=document.createElement("script");script.src=config.native.source;script.async=true;script.setAttribute("data-cfasync","false");host.append(script);
    }else if(nativeRoot.childElementCount>0)reveal(nativeSlot);
   }
  }
  const bannerSlot=document.querySelector('[data-ad-unit="banner"]');
  if(bannerSlot && matchMedia("(min-width:761px)").matches){
   const host=bannerSlot.querySelector(".ad-content");
   if(host){
     if(!bannerRoot){
       bannerRoot=document.createElement("iframe");bannerRoot.title="Advertisement";bannerRoot.width=468;bannerRoot.height=60;bannerRoot.loading="lazy";bannerRoot.style.border="0";
       const opts=JSON.stringify({key:config.banner.key,format:"iframe",height:60,width:468,params:{}});
       bannerRoot.srcdoc='<html><body style="margin:0"><script>window.atOptions='+opts+';<\/script><script src="'+config.banner.source+'"><\/script></body></html>';
       bannerRoot.addEventListener("load",()=>{bannerLoaded=true;reveal(bannerSlot)},{once:true});
     }
     host.append(bannerRoot);
     if(bannerLoaded)reveal(bannerSlot);
   }
  }
 };
 document.addEventListener("globalnews:render",mount);
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();