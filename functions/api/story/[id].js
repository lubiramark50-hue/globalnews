// Cloudflare Pages Function: durable story deep links, without any AI generation.
export async function onRequestGet({params,env}){
 const id=String(params?.id||'');
 if(!/^[a-z0-9]{1,40}$/.test(id))return Response.json({error:'Invalid story ID'},{status:400,headers:{'Cache-Control':'no-store'}});
 if(!env?.DB)return Response.json({error:'Archive temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 try{
  const row=await env.DB.prepare('SELECT id,title,description,source,url,image,category,country,regional,published_at,ingested_at FROM articles WHERE id=? LIMIT 1').bind(id).first();
  if(!row)return Response.json({error:'Story not found'},{status:404,headers:{'Cache-Control':'public,max-age=60'}});
  const article={id:row.id,title:row.title,description:row.source?.startsWith('Google News')?'':(row.description||'').replace(/&lt;[^&]*?&gt;/g,' ').replace(/<[^>]*>/g,' ').slice(0,450),summary:row.source?.startsWith('Google News')?'':(row.description||'').replace(/&lt;[^&]*?&gt;/g,' ').replace(/<[^>]*>/g,' ').slice(0,450),source:row.source,url:row.url,image:row.image||null,category:row.category||'World',region:row.country||null,regional:!!row.regional,publishedAt:row.published_at||null,ingestedAt:row.ingested_at||null};
  return Response.json({article},{headers:{'Cache-Control':'public,max-age=120,s-maxage=300','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('Story D1 lookup failed',String(e));return Response.json({error:'Archive unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
