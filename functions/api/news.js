// GlobalNews source-first RSS/Atom gateway. It never fabricates a headline.
// Sources: major international publishers, regional publishers, and Google News (which aggregates thousands of outlets).
import {annotate} from "../lib/trend.js";
const S=(name,url,category="World",extra={})=>({name,url,category,...extra});
// Always fetched (world coverage).
export const CORE=[
 S("BBC World","https://feeds.bbci.co.uk/news/world/rss.xml"),
 S("BBC Africa","https://feeds.bbci.co.uk/news/world/africa/rss.xml"),
 S("The Guardian","https://www.theguardian.com/world/rss"),
 S("Al Jazeera","https://www.aljazeera.com/xml/rss/all.xml"),
 S("DW","https://rss.dw.com/rdf/rss-en-all",undefined,{max:20}),
 S("France 24","https://www.france24.com/en/rss"),
 S("NPR","https://feeds.npr.org/1001/rss.xml"),
 S("CNN","http://rss.cnn.com/rss/edition_world.rss"),
 S("The New York Times","https://rss.nytimes.com/services/xml/rss/nyt/World.xml"),
 S("ABC News","https://abcnews.go.com/abcnews/internationalheadlines"),
 S("CBS News","https://www.cbsnews.com/latest/rss/world"),
 S("Sky News","https://feeds.skynews.com/feeds/rss/world.xml"),
 S("Euronews","https://www.euronews.com/rss?format=mrss&level=theme&name=news"),
 S("The Straits Times","https://www.straitstimes.com/news/world/rss.xml"),
 S("ABC News Australia","https://www.abc.net.au/news/feed/2942460/rss.xml")];
// Topic feeds rotate by 10-minute slot so one run stays inside the platform's subrequest and CPU limits.
export const TOPIC_GROUPS=[
 [S("BBC Technology","https://feeds.bbci.co.uk/news/technology/rss.xml","Technology"),S("TechCrunch","https://techcrunch.com/feed/","Technology"),S("Ars Technica","https://feeds.arstechnica.com/arstechnica/index","Technology"),S("Wired","https://www.wired.com/feed/rss","Technology"),S("The Verge","https://www.theverge.com/rss/index.xml","Technology"),S("The New York Times · Technology","https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml","Technology"),S("Google News · Technology","https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en&gl=US&ceid=US:en","Technology",{noDesc:true})],
 [S("BBC Business","https://feeds.bbci.co.uk/news/business/rss.xml","Business"),S("CNBC","https://www.cnbc.com/id/100003114/device/rss/rss.html","Business"),S("MarketWatch","https://feeds.content.dowjones.io/public/rss/mw_topstories","Business"),S("The New York Times · Business","https://rss.nytimes.com/services/xml/rss/nyt/Business.xml","Business"),S("Google News · Business","https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en&gl=US&ceid=US:en","Business",{noDesc:true})],
 [S("BBC Science","https://feeds.bbci.co.uk/news/science_and_environment/rss.xml","Science"),S("BBC Sport","https://feeds.bbci.co.uk/sport/rss.xml","Sports"),S("Sky Sports","https://www.skysports.com/rss/12040","Sports"),S("ScienceDaily","https://www.sciencedaily.com/rss/all.xml","Science"),S("Nature","https://www.nature.com/nature.rss","Science"),S("Phys.org","https://phys.org/rss-feed/","Science"),S("NASA","https://www.nasa.gov/feed/","Science")]];
const AFRICA=S("allAfrica","https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf");
export const LOCAL={
 UG:[AFRICA],KE:[AFRICA],TZ:[AFRICA],
 NG:[S("Punch","https://punchng.com/feed/"),S("Premium Times","https://www.premiumtimesng.com/feed"),AFRICA],
 ZA:[S("IOL","https://iol.co.za/rss/iol/news"),AFRICA],
 GB:[S("The Guardian · UK","https://www.theguardian.com/uk-news/rss")],
 CA:[S("The Globe and Mail","https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/world/",undefined,{max:20})],
 IN:[S("The Times of India","https://timesofindia.indiatimes.com/rssfeedstopstories.cms"),S("The Hindu","https://www.thehindu.com/news/international/feeder/default.rss")],
 DE:[S("Der Spiegel International","https://www.spiegel.de/international/index.rss")],
 FR:[S("Le Monde in English","https://www.lemonde.fr/en/rss/une.xml")],
 JP:[S("The Japan Times","https://www.japantimes.co.jp/feed/")],
 US:[],BR:[],AU:[]};
const REGIONS={UG:"Uganda",KE:"Kenya",TZ:"Tanzania",NG:"Nigeria",ZA:"South Africa",US:"United States",GB:"United Kingdom",CA:"Canada",IN:"India",DE:"Germany",FR:"France",BR:"Brazil",JP:"Japan",AU:"Australia"};
export function pickSources(country,now=Date.now()){
 const slot=Math.floor(now/6e5)%TOPIC_GROUPS.length,name=REGIONS[country];
 const gn=(label,url)=>({name:"Google News · "+label,url,category:"World",regional:true,region:country,noDesc:true,max:30});
 return [...CORE,...TOPIC_GROUPS[slot],
  ...(LOCAL[country]||[]).map(s=>({...s,regional:true,region:country})),
  gn(name,"https://news.google.com/rss/search?q="+encodeURIComponent(name+" news")+"&hl=en-US&gl="+country+"&ceid="+country+":en"),
  gn(name+" top stories","https://news.google.com/rss?hl=en-US&gl="+country+"&ceid="+country+":en")];
}
function clean(s){return String(s||"").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi,"$1").replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<[^>]*>/g," ").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|ndash|mdash);/gi,(_,k)=>{const m={amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" ",ndash:"–",mdash:"—"};if(k[0]==="#"){const n=k[1]?.toLowerCase()==="x"?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>0&&n<=1114111?String.fromCodePoint(n):""}return m[k.toLowerCase()]||""}).replace(/\s+/g," ").trim()}
function tag(body,name){return body.match(new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i"))?.[1]||""}
function imageAttr(body){for(const name of ["media:thumbnail","media:content","enclosure"]){const m=body.match(new RegExp("<"+name+"\\b[^>]*>","i"))?.[0]||"";const url=m.match(/\burl=["']([^"']+)["']/i)?.[1];if(url)return url}return body.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1]||""}
function safeUrl(u){try{const x=new URL(String(u).replace(/&amp;/g,"&"));return ["https:","http:"].includes(x.protocol)?x.href:null}catch{return null}}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function linkOf(b){const t=clean(tag(b,"link"));if(/^https?:/i.test(t))return t;const l=b.match(/<link\b[^>]*\brel=["']alternate["'][^>]*>/i)?.[0]||b.match(/<link\b[^>]*>/i)?.[0]||"";return l.match(/\bhref=["']([^"']+)["']/i)?.[1]||clean(tag(b,"guid"))}
export function parse(xml,source){
 const cap=source.max||25;
 return [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].slice(0,cap).map(m=>{
  const b=m[2],title=clean(tag(b,"title")).slice(0,240),url=safeUrl(linkOf(b));
  if(!url||title.length<12)return null;
  const description=source.noDesc?"":clean(tag(b,"description")||tag(b,"summary")||tag(b,"content:encoded")||tag(b,"content")).slice(0,450);
  const rawImg=safeUrl(imageAttr(b))?.replace(/^http:/,"https:");
  const image=rawImg&&/\.(jpg|jpeg|png|webp)(\?|$)/i.test(rawImg)?rawImg:null;
  const d=tag(b,"pubDate")||tag(b,"dc:date")||tag(b,"published")||tag(b,"updated");
  const t=d?Date.parse(clean(d)):NaN;
  return{id:hash(url),title,url,description,summary:description,source:source.name,image,category:source.category||"World",regional:!!source.regional,region:source.region||null,publishedAt:Number.isNaN(t)?null:new Date(t).toISOString()};
 }).filter(Boolean);
}
async function fetchFeed(source){try{const res=await fetch(source.url,{headers:{Accept:"application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.5","User-Agent":"GlobalNewsBot/1.0 (+https://globalnews-a0q.pages.dev)"},signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error("RSS "+res.status);const xml=await res.text();if(xml.length>3000000)throw Error("RSS too big");return parse(xml,source)}catch(err){console.warn("Source feed failure",source.name,String(err));return []}}
const FIELDS=["id","title","description","source","url","image","category","country","regional","published_at"];
const UPSERT=n=>"INSERT INTO articles ("+FIELDS.join(",")+") VALUES "+Array.from({length:n},()=>"("+FIELDS.map(()=>"?").join(",")+")").join(",")+" ON CONFLICT(url) DO UPDATE SET title=excluded.title,description=excluded.description,image=COALESCE(excluded.image,articles.image),published_at=COALESCE(excluded.published_at,articles.published_at),ingested_at=CURRENT_TIMESTAMP WHERE articles.title<>excluded.title OR articles.description<>excluded.description";
// Stores everything the collector found (10 rows x 10 columns = the 100 bound-parameter limit per statement).
export async function storeAll(env,country,articles,limit=240){
 const rows=articles.slice(0,limit).map(x=>[x.id,x.title.slice(0,400),String(x.description||"").slice(0,550),x.source,x.url,x.image||null,x.category||"World",x.regional?country:null,x.regional?1:0,x.publishedAt||null]);
 let changed=0;
 for(let o=0;o<rows.length;o+=100){
  const stmts=[];for(let i=o;i<Math.min(o+100,rows.length);i+=10){const part=rows.slice(i,i+10);stmts.push(env.DB.prepare(UPSERT(part.length)).bind(...part.flat()))}
  try{const res=await env.DB.batch(stmts);for(const r of res)changed+=r?.meta?.changes||0}catch(e){console.warn("Archive batch failed",String(e).slice(0,160))}
 }
 return changed;
}
// Keeps regional stories from being crowded out by high-volume world feeds, then orders by recency.
export function select(articles,limit){const reg=articles.filter(a=>a.regional).slice(0,70),glob=articles.filter(a=>!a.regional).slice(0,Math.max(0,limit-reg.length));return [...reg,...glob].sort((a,b)=>Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0))}
// Retention: keep 30 days of stories (summaries are removed first because of the foreign key) and 14 days of run logs.
export async function pruneOld(env,now=Date.now(),days=30,batch=500){
 const iso=new Date(now-days*864e5).toISOString(),plain=iso.slice(0,19).replace("T"," ");
 const old="((published_at IS NOT NULL AND published_at<?) OR (published_at IS NULL AND ingested_at<?))";
 const found=await env.DB.prepare("SELECT id FROM articles WHERE "+old+" ORDER BY COALESCE(published_at,ingested_at) LIMIT ?").bind(iso,plain,batch).all();
 const ids=(found.results||[]).map(r=>r.id);
 const stmts=[env.DB.prepare("DELETE FROM ingestion_log WHERE checked_at<?").bind(new Date(now-14*864e5).toISOString().slice(0,19).replace("T"," "))];
 for(let i=0;i<ids.length;i+=90){const part=ids.slice(i,i+90),marks=part.map(()=>"?").join(",");
  stmts.push(env.DB.prepare("DELETE FROM article_summaries WHERE article_id IN ("+marks+")").bind(...part));
  stmts.push(env.DB.prepare("DELETE FROM articles WHERE id IN ("+marks+")").bind(...part));}
 await env.DB.batch(stmts);
 return ids.length;
}
const HEADERS=(sMax)=>({"Cache-Control":"public,max-age=60,s-maxage="+sMax+",stale-while-revalidate=1200","X-Content-Type-Options":"nosniff"});
const row=s=>{const gn=s.source?.startsWith("Google News"),d=gn?"":clean(s.description||"").slice(0,450);return{id:s.id,title:s.title,description:d,summary:s.gemini_summary||d,aiGenerated:!!s.gemini_summary,aiModel:s.gemini_model||null,source:s.source,url:s.url,image:s.image,category:s.category,regional:!!s.regional,region:s.country||null,publishedAt:s.published_at||null}};
export async function onRequestGet({request,env}){
 const reqUrl=new URL(request.url),country=(reqUrl.searchParams.get("country")||"UG").toUpperCase();
 if(!REGIONS[country])return Response.json({error:"Unsupported country"},{status:400});
 const fresh=reqUrl.searchParams.get("fresh")==="1";
 const cacheKey=new Request(reqUrl.origin+"/api/news?country="+country+(fresh?"&fresh=1":"")),cache=caches.default;
 const old=await cache.match(cacheKey);if(old)return old;
 // Readers use the latest completed D1 snapshot. Only the scheduled collector requests publisher feeds.
 if(!fresh&&env?.DB){
  try{
   const check=await env.DB.prepare("SELECT max(checked_at) AS checked FROM ingestion_log WHERE country=? AND status='ok'").bind(country).first();
   const checked=check?.checked?Date.parse(check.checked.replace(" ","T")+"Z"):NaN;
   if(Number.isFinite(checked)&&Date.now()-checked<50*60000){
    const result=await env.DB.prepare("SELECT a.id,a.title,a.description,a.source,a.url,a.image,a.category,a.country,a.regional,a.published_at,ai.summary AS gemini_summary,ai.model AS gemini_model FROM (SELECT * FROM (SELECT a.id,a.title,a.description,a.source,a.url,a.image,a.category,a.country,a.regional,a.published_at FROM articles a WHERE a.country=? ORDER BY a.published_at DESC LIMIT 70) UNION ALL SELECT * FROM (SELECT a.id,a.title,a.description,a.source,a.url,a.image,a.category,a.country,a.regional,a.published_at FROM articles a WHERE a.regional=0 ORDER BY a.published_at DESC LIMIT 150)) a LEFT JOIN article_summaries ai ON ai.article_id=a.id ORDER BY a.published_at DESC").bind(country).all();
    const articles=select(annotate((result.results||[]).map(row)),150);
    if(articles.length){
     const response=Response.json({articles,checkedAt:new Date(checked).toISOString(),country,aiSummariesEnabled:articles.some(a=>a.aiGenerated),fromArchive:true,warning:""},{headers:HEADERS(300)});
     await cache.put(cacheKey,response.clone());
     return response;
    }
   }
  }catch(e){console.warn("D1 feed lookup unavailable",String(e))}
 }
 const all=await Promise.allSettled(pickSources(country).map(fetchFeed));
 const seen=new Set(),articles=[],cutoff=Date.now()-7*864e5;
 for(const result of all){if(result.status!=="fulfilled")continue;for(const item of result.value){
  if(item.publishedAt&&Date.parse(item.publishedAt)<cutoff)continue;
  const key=item.title.toLowerCase().replace(/[^a-z0-9]+/g," ").slice(0,90);if(seen.has(key))continue;seen.add(key);articles.push(item)}}
 articles.sort((a,b)=>Date.parse(b.publishedAt||0)-Date.parse(a.publishedAt||0));
 let stored=null;
 if(fresh&&env?.DB&&articles.length)try{stored=await storeAll(env,country,select(articles,240))}catch(e){console.warn("Archive store failed",String(e).slice(0,160))}
 if(articles.length===0&&env?.DB){try{const saved=await env.DB.prepare("SELECT id,title,description,source,url,image,category,country,regional,published_at FROM articles WHERE country=? OR regional=0 ORDER BY published_at DESC LIMIT 90").bind(country).all();for(const s of saved.results||[])articles.push({id:s.id,title:s.title,description:s.description,summary:s.description,source:s.source,url:s.url,image:s.image,category:s.category,region:s.country,regional:!!s.regional,publishedAt:s.published_at})}catch(e){console.warn("D1 fallback failed",String(e))}}
 annotate(articles);
 let pruned=null;
 if(fresh&&env?.DB&&Math.floor(Date.now()/6e5)%6===0)try{pruned=await pruneOld(env)}catch(e){console.warn("Prune failed",String(e).slice(0,160))}
 const payload={articles:select(articles,fresh?260:150),checkedAt:new Date().toISOString(),country,aiSummariesEnabled:false,warning:articles.length?"":"Available publisher feeds are temporarily unavailable; no stories were invented."};
 if(stored!==null)payload.archiveChanges=stored;
 if(pruned!==null)payload.pruned=pruned;
 const response=Response.json(payload,{headers:HEADERS(600)});
 if(articles.length)await cache.put(cacheKey,response.clone());
 return response;
}
