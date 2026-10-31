import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const publicFile=x=>readFileSync(new URL("../public/"+x,import.meta.url),"utf-8");
test("static sitemap contains canonical publication pages",()=>{
 const sitemap=publicFile("sitemap.xml");
 for(const path of ["/world","/technology","/business","/sports","/about"])assert.ok(sitemap.includes("https://globalnews-a0q.pages.dev"+path+"</loc>"));
 assert.equal(sitemap.includes("/search"),false);
});
test("robots describes sitemap, hides personalized search from indexing",()=>{
 const robots=publicFile("robots.txt");
 assert.match(robots,/Sitemap: https:\/\/globalnews-a0q\.pages\.dev\/sitemap\.xml/);
 assert.match(robots,/Disallow: \/saved/);
});
test("site manifest supports full-screen mobile navigation",()=>{
 const manifest=JSON.parse(publicFile("manifest.webmanifest"));
 assert.equal(manifest.display,"standalone");
 assert.equal(manifest.scope,"/");
});
test("primary HTML uses device viewport and accessible navigation",()=>{
 const html=publicFile("index.html");
 assert.match(html,/width=device-width/);
 assert.match(html,/mobile-dock/);
 assert.match(html,/rel="canonical"/);
});
