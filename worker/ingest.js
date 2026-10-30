/** 10-minute Cloudflare Cron → source feeds → GlobalNews D1.
 * D1 keeps public excerpts available when original publishers are temporarily unavailable.
 * No article is generated. The source title, excerpt and link stay intact.
 */
const COUNTRIES=["UG","KE","TZ","NG","ZA","US","GB","CA","IN","DE","FR","BR","JP","AU"];
const FIELDS=["id","title","description","source","url","image","category","country","regional","published_at"];
async function store(env,country,articles){
 const rows=articles.slice(0,30).filter(x=>x.id&&x.title&&x.url).map(x=>[String(x.id),String(x.title).slice(0,400),String(x.description||"").slice(0,550),String(x.source||"Unknown"),String(x.url),x.image||null,x.category||"World",x.regional?country:null,x.regional?1:0,x.publishedAt||null]);
 let inserted=0;
 for(let offset=0;offset<rows.length;offset+=10){
  const part=rows.slice(offset,offset+10);
  const marks=part.map(()=>"("+FIELDS.map(()=>"?").join(",")+")").join(",");
  const sql="INSERT INTO articles ("+FIELDS.join(",")+") VALUES "+marks+" ON CONFLICT(url) DO UPDATE SET title=excluded.title,description=excluded.description,image=COALESCE(excluded.image,articles.image),published_at=COALESCE(excluded.published_at,articles.published_at),ingested_at=CURRENT_TIMESTAMP WHERE articles.title<>excluded.title OR articles.description<>excluded.description";
  const result=await env.DB.prepare(sql).bind(...part.flat()).run();
  inserted+=result.meta?.changes||0;
 }
 await env.DB.prepare("INSERT INTO ingestion_log (country,fetched,inserted,status) VALUES (?,?,?,?)").bind(country,articles.length,inserted,"ok").run();
 return inserted;
}
async function run(env,at){
 const cycle=Math.floor(at/600000);
 const batch=cycle%4;
 const codes=COUNTRIES.slice(batch*4,batch*4+4);
 for(const country of codes){
  try{
   const response=await fetch("https://globalnews-a0q.pages.dev/api/news?country="+country,{signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw Error("Feed gateway HTTP "+response.status);
   const data=await response.json();
   if(!Array.isArray(data.articles))throw Error("Unexpected news feed format");
   if(!env.DB){console.error("D1 binding missing, cannot store",country);continue}
   const inserted=await store(env,country,data.articles);
   console.log("GlobalNews",country,"checked",data.articles.length,"new-or-corrected",inserted);
  }catch(e){console.error("GlobalNews cycle failed",country,String(e));if(env.DB)try{await env.DB.prepare("INSERT INTO ingestion_log(country,fetched,inserted,status) VALUES (?,?,?,?)").bind(country,0,0,String(e).slice(0,160)).run()}catch{}}
 }
}
export default{
 scheduled(controller,env,ctx){ctx.waitUntil(run(env,controller.scheduledTime))},
 async fetch(request,env){
  if(new URL(request.url).pathname!=="/health")return new Response("Not found",{status:404});
  let totals={articles:0,lastCheck:null};
  if(env.DB)try{const r=await env.DB.prepare("SELECT (SELECT count(*) FROM articles) AS total,(SELECT max(checked_at) FROM ingestion_log) AS checked").first();totals={articles:r?.total||0,lastCheck:r?.checked||null}}catch(e){totals={error:String(e)}}
  return Response.json({service:"GlobalNews ingestion",status:"available",schedule:"every 10 minutes",databaseConfigured:!!env.DB,totals,at:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}});
 }
};