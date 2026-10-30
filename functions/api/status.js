// Public aggregate freshness metrics only: no private logs or credentials.
export async function onRequestGet({env}){
 if(!env?.DB)return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const [a,b,c]=await Promise.all([
   env.DB.prepare('SELECT count(*) AS total FROM articles').first(),
   env.DB.prepare("SELECT max(checked_at) AS last_success FROM ingestion_log WHERE status='ok'").first(),
   env.DB.prepare("SELECT count(DISTINCT country) AS total FROM ingestion_log WHERE status='ok' AND checked_at>=datetime('now','-24 hours')").first()
  ]);
  return Response.json({status:'ok',archivedArticles:a?.total||0,lastSuccessfulCheck:b?.last_success?b.last_success.replace(' ','T')+'Z':null,countriesChecked24h:c?.total||0,collectionScheduleMinutes:10},{headers:{'Cache-Control':'public,max-age=60,s-maxage=600','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('Status database error',String(e));return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
