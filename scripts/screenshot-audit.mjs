import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = process.env.GLOBALNEWS_BASE_URL || "https://globalnews-a0q.pages.dev";
const routes = [
  "/", "/world", "/local", "/technology", "/business", "/sports", "/science",
  "/videos", "/search", "/saved", "/about", "/standards", "/privacy", "/sources"
];
const devices = [
  {name:"android-390",width:390,height:844,mobile:true},
  {name:"windows-1440",width:1440,height:900,mobile:false}
];
const report = {base,startedAt:new Date().toISOString(),screenshots:[],findings:[],errors:[]};
const browser = await chromium.launch({headless:true,args:["--no-sandbox"]});
await fs.mkdir("screenshots/audit",{recursive:true});
const waitReady=async(page)=>{
  await page.locator("#main").waitFor({state:"attached",timeout:16000});
  await page.waitForFunction(()=>document.querySelector("#main")?.innerText?.trim().length>25,{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(850);
};
const shot=async(page,size,slug)=>{
  const filename="screenshots/audit/"+size+"-"+slug+".jpg";
  await page.screenshot({path:filename,fullPage:true,type:"jpeg",quality:67,timeout:30000,animations:"disabled"});
  report.screenshots.push({device:size,page:slug,file:filename});
};
const saveLog=async()=>{await fs.writeFile("screenshots/audit/report.json",JSON.stringify(report,null,2))};
for(const device of devices){
 const context=await browser.newContext({
   viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1,
   reducedMotion:"reduce"
 });
 const page=await context.newPage();
 let errors=[];
 page.on("pageerror",e=>errors.push(String(e)));
 for(const route of routes){
  const slug=route==="/"?"home":route.slice(1);
  try{
    const resp=await page.goto(base+route,{waitUntil:"domcontentloaded",timeout:25000});
    await waitReady(page);
    const data=await page.evaluate(()=>({
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:window.innerWidth,
      title:document.title,
      heading:document.querySelector("#main h1")?.innerText?.trim()||"",
      mainChars:document.querySelector("#main")?.innerText?.trim().length||0,
      imageCount:document.querySelectorAll("main img").length,
      brokenImages:[...document.querySelectorAll("main img")].filter(i=>i.complete&&i.naturalWidth===0).length,
      horizontalOverflow:[...document.querySelectorAll("body *")].filter(el=>{
       const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
       return cs.position!=="fixed"&&r.width>0&&r.right>innerWidth+4
      }).slice(0,4).map(el=>({tag:el.tagName,class:el.className?.toString().slice(0,50)}))
    }));
    if(resp?.status()!==200)report.errors.push(device.name+" "+route+" HTTP "+resp?.status());
    if(data.documentWidth>device.width+4)report.findings.push(device.name+" "+route+" horizontal width "+data.documentWidth+"px > "+device.width+"px");
    if(!data.heading)report.findings.push(device.name+" "+route+" missing section heading");
    if(data.brokenImages>0)report.findings.push(device.name+" "+route+" broken images "+data.brokenImages);
    report.screenshots.push({device:device.name,page:slug,metadata:data,http:resp?.status()});
    await shot(page,device.name,slug);
    console.log(device.name,slug,resp?.status(),data.heading.slice(0,55),"content",data.mainChars,"images",data.imageCount);
  }catch(e){report.errors.push(device.name+" "+route+" "+String(e));try{await shot(page,device.name,slug+"-error")}catch{}}
 }
 // Capture an actual story, saved story, completed search, preferences, dark mode, and mobile drawer.
 try{
  await page.goto(base+"/",{waitUntil:"domcontentloaded",timeout:25000});await waitReady(page);
  const first=page.locator('a[data-story]').first();
  if(await first.count()){
    const articlePath=await first.getAttribute("href");
    await page.goto(base+articlePath,{waitUntil:"domcontentloaded",timeout:25000});
    await waitReady(page);
    await page.locator(".article-page h1").first().waitFor({timeout:15000});
    await shot(page,device.name,"article");
    const book=page.locator(".article-page [data-save]").first();
    if(await book.count())await book.click();
    await page.goto(base+"/saved",{waitUntil:"domcontentloaded"});await waitReady(page);
    await shot(page,device.name,"saved-with-article");
  }else report.findings.push(device.name+" no current article available to capture");
  await page.goto(base+"/search",{waitUntil:"domcontentloaded"});await waitReady(page);
  await page.locator("#search-input").fill("Uganda");
  await page.locator("#search-form button[type=submit]").click();
  await page.waitForTimeout(1200);
  await shot(page,device.name,"search-results");
  await page.goto(base+"/",{waitUntil:"domcontentloaded"});await waitReady(page);
  await page.locator("#settings-btn").click();
  await shot(page,device.name,"preferences-dialog");
  await page.locator("#select-theme").selectOption("dark");
  await page.locator("#apply-dialog").click();
  await shot(page,device.name,"dark-home");
  if(device.mobile){
    await page.locator("#mobile-menu").click();
    await shot(page,device.name,"mobile-menu");
  }
 }catch(e){report.errors.push(device.name+" interactions: "+String(e))}
 if(errors.length)report.errors.push(device.name+" script errors: "+errors.slice(0,5).join(" | "));
 await context.close();
 await saveLog();
}
report.completedAt=new Date().toISOString();
await saveLog();
await browser.close();
console.log(JSON.stringify({screenshots:report.screenshots.filter(x=>x.file).length,findings:report.findings,errors:report.errors},null,2));
if(report.errors.length)process.exitCode=1;
