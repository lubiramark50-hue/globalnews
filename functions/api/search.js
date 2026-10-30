// Bounded Cloudflare D1 search over attributed headlines/excerpts.
export async function onRequestGet({request,env}){
 const u=new URL(request.url);
 const q=(u.searchParams.get('q')||'').trim().slice(0,80);
 if(q.length<2)return Response.json({error:'Search requires at least two characters'},{status:400,headers:{'Cache-Control':'no-store'}});
 if(!env?.DB)return Response.json({error:'Search temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const normalized=q.replace(/[%_\\]/g,' ').replace(/\s+/g,' ').trim();
 if(normalized.length<2)return Response.json({error:'Invalid query'},{status:400});
 const pattern='%'+normalized+'%';
 try{
  const db=await env.DB.prepare('SELECT id,title,description,source,url,image,category,country,regional,published_at FROM articles WHERE title LIKE ? OR description LIKE ? ORDER BY published_at DESC LIMIT 60').bind(pattern,pattern).all();
  const articles=(db.results||[]).map(s=>({id:s.id,title:s.title,description:s.description||'',summary:s.description||'',source:s.source,url:s.url,image:s.image||null,category:s.category||'World',regional:!!s.regional,region:s.country||null,publishedAt:s.published_at||null}));
  return Response.json({articles,count:articles.length,query:q},{headers:{'Cache-Control':'public,max-age=60,s-maxage=120','X-Content-Type-Options':'nosniff'}});
 }catch(e){console.error('News search error',String(e));return Response.json({error:'Search unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
