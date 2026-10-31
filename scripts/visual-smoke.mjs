import {chromium} from "playwright";
import fs from "node:fs/promises";

const ORIGIN="https://globalnews-a0q.pages.dev";
const cases=[
 {name:"android-compact",width:320,height:700,mobile:true},
 {name:"android-standard",width:375,height:812,mobile:true},
 {name:"android-small",width:360,height:800,mobile:true},
 {name:"android",width:390,height:844,mobile:true},
 {name:"android-large",width:430,height:932,mobile:true},
 {name:"tablet",width:820,height:1180,mobile:false},
 {name:"tablet-landscape",width:1024,height:768,mobile:false},
 {name:"windows-laptop",width:1366,height:768,mobile:false},
 {name:"windows-desktop",width:1440,height:900,mobile:false},
 {name:"windows-wide",width:1920,height:1080,mobile:false}
];
await fs.mkdir("screenshots",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
for(const size of cases){
 const context=await browser.newContext({viewport:{width:size.width,height:size.height},isMobile:size.mobile,hasTouch:size.mobile,deviceScaleFactor:size.mobile?2:1});
 const page=await context.newPage();
 const consoleErrors=[];
 page.on("pageerror",e=>consoleErrors.push(String(e)));
 for(const route of ["/","/world","/local","/technology","/search"]){
  const path=ORIGIN+route;
  try{
   const response=await page.goto(path,{waitUntil:"domcontentloaded",timeout:30000});
   await page.locator("#main h1").first().waitFor({timeout:18000});
   await page.waitForTimeout(1000);
   const result=await page.evaluate(()=>({
     viewport:window.innerWidth,
     docWidth:document.documentElement.scrollWidth,
     bodyWidth:document.body.scrollWidth,
     mainText:document.querySelector("#main")?.innerText?.trim().slice(0,180)||"",
     dock:!!document.querySelector(".mobile-dock") && getComputedStyle(document.querySelector(".mobile-dock")).display!=="none",
     header:!!document.querySelector(".header"),
     h1:document.querySelector("#main h1")?.textContent?.trim()||"",
   }));
   if(response?.status()!==200)errors.push(size.name+" "+route+" HTTP "+response?.status());
   if(result.docWidth>result.viewport+3)errors.push(size.name+" "+route+" horizontal overflow "+result.docWidth+" > "+result.viewport);
   if(!result.header||!result.h1)errors.push(size.name+" "+route+" missing masthead or H1");
   if(size.mobile!==result.dock && size.width<761)errors.push(size.name+" "+route+" mobile dock visibility mismatch");
   if(route==="/"||route==="/world")await page.screenshot({path:"screenshots/"+size.name+"-"+(route==="/"?"home":"world")+".png",fullPage:true});
   console.log(size.name,route,"HTTP",response?.status(),"width",result.docWidth,"of",result.viewport,"headline",result.h1.slice(0,50));
  }catch(e){errors.push(size.name+" "+route+": "+String(e));try{await page.screenshot({path:"screenshots/"+size.name+"-failure.png"})}catch{}}
 }
 if(["android","windows-desktop"].includes(size.name)){
  try{
   await page.goto(ORIGIN+"/",{waitUntil:"domcontentloaded",timeout:30000});
   await page.locator("#settings-btn").click({timeout:10000});
   await page.locator('#select-theme').selectOption('dark');
   await page.locator('#apply-dialog').click();
   if(await page.locator("html").getAttribute("data-theme")!=="dark")errors.push(size.name+" appearance change failed");
   await page.locator("#settings-btn").click();
   await page.locator('#select-theme').selectOption('light');
   await page.locator('#apply-dialog').click();
   await page.locator("#settings-btn").click();
   await page.keyboard.press("Escape");
   if(await page.locator(".dialog").count())errors.push(size.name+" settings escape did not close");
   if(size.mobile){
     await page.locator("#mobile-menu").click();
     if(!await page.locator(".nav").evaluate(el=>el.classList.contains("open")))errors.push(size.name+" mobile drawer failed to open");
     await page.keyboard.press("Escape");
     if(await page.locator(".nav").evaluate(el=>el.classList.contains("open")))errors.push(size.name+" mobile drawer failed to close");
   }
   const first=page.locator('.story-card a[data-story]').first();
   if(await first.count()){
     await first.click();
     await page.locator(".article-page .read-original").waitFor({timeout:12000});
     const title=await page.locator(".article-page h1").first().textContent();
     if(!title?.trim())errors.push(size.name+" article reader has no heading");
     await page.screenshot({path:"screenshots/"+size.name+"-article.png",fullPage:true});
     const copy=page.locator('[data-copy-link]');
     if(!await copy.count())errors.push(size.name+" article share control missing");
   }else console.log(size.name,"Skipped article test: no current story cards");
   await page.goto(ORIGIN+"/search",{waitUntil:"domcontentloaded"});
   await page.locator("#search-input").fill("Uganda");
   await page.locator("#search-form button[type='submit']").click();
   if(!page.url().includes("q=Uganda"))errors.push(size.name+" search URL not shareable");
  }catch(e){errors.push(size.name+" interaction test: "+String(e))}
 }
 if(consoleErrors.length)errors.push(size.name+" JS errors: "+consoleErrors.slice(0,3).join(" | "));
 await context.close();
}
await browser.close();
if(errors.length){console.error("\nFAILED "+errors.length+" checks:\n"+errors.join("\n"));process.exitCode=1}
else console.log("\nAll Android, tablet and Windows viewport and interaction checks passed.");
