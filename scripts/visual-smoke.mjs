import {chromium} from "playwright";
import fs from "node:fs/promises";

const ORIGIN="https://globalnews-a0q.pages.dev";
const cases=[
 {name:"android-small",width:360,height:800,mobile:true},
 {name:"android",width:390,height:844,mobile:true},
 {name:"android-large",width:430,height:932,mobile:true},
 {name:"tablet",width:820,height:1180,mobile:false},
 {name:"windows-laptop",width:1366,height:768,mobile:false},
 {name:"windows-desktop",width:1440,height:900,mobile:false}
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
 if(consoleErrors.length)errors.push(size.name+" JS errors: "+consoleErrors.slice(0,3).join(" | "));
 await context.close();
}
await browser.close();
if(errors.length){console.error("\nFAILED "+errors.length+" checks:\n"+errors.join("\n"));process.exitCode=1}
else console.log("\nAll Android, tablet and Windows viewport checks passed.");
