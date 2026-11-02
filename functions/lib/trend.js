// Breaking / trending detection without any AI: group headlines that describe the same event and count
// how many independent outlets carry it. Pure function, no network, fully unit-tested.
const STOP=new Set("about after again also amid back been before being between could does down from have here into just like live more most much news only other over report reports said says should some still than that their them then there these they this those through today under update updates video watch were what when where which while will with would your".split(" "));
const H=36e5;
const SUFFIX=/ - [^-]{2,40}$/;
export const publisherOf=a=>/^Google News/i.test(a.source||"")&&SUFFIX.test(a.title||"")?String(a.title).split(" - ").pop().trim():String(a.source||"").trim();
export function tokens(title){
 return [...new Set(String(title||"").replace(SUFFIX,"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(w=>w.length>3&&!STOP.has(w)))];
}
export function annotate(articles,now=Date.now(),opts={}){
 const maxBreaking=opts.maxBreaking??4,n=articles.length;
 const T=articles.map(a=>tokens(a.title)),ts=articles.map(a=>Date.parse(a.publishedAt||"")||0);
 const P=Array.from({length:n},(_,i)=>i);
 const find=x=>{while(P[x]!==x){P[x]=P[P[x]];x=P[x]}return x};
 const index=new Map();
 for(let i=0;i<n;i++){
  const hits=new Map();
  for(const t of T[i])for(const j of index.get(t)||[])hits.set(j,(hits.get(j)||0)+1);
  for(const [j,shared] of hits){
   const smaller=Math.min(T[i].length,T[j].length);
   if(shared>=3&&shared/smaller>=0.55&&Math.abs(ts[i]-ts[j])<36*H)P[find(j)]=find(i);
  }
  for(const t of T[i]){if(!index.has(t))index.set(t,[]);index.get(t).push(i)}
 }
 const groups=new Map();
 for(let i=0;i<n;i++){const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(i)}
 const found=[];
 for(const g of groups.values()){
  const outlets=[...new Set(g.map(i=>publisherOf(articles[i])).filter(Boolean))];
  const stamps=g.map(i=>ts[i]).filter(Boolean);
  const newest=stamps.length?Math.max(...stamps):0,oldest=stamps.length?Math.min(...stamps):0;
  const age=newest?now-newest:Infinity,since=oldest?now-oldest:Infinity;
  const labelled=g.some(i=>/^(breaking|just in|urgent)\b/i.test(articles[i].title||""));
  const coverage=outlets.length;
  const trending=coverage>=3&&age<12*H;
  const breaking=(coverage>=3&&since<3*H&&age<1.5*H)||(labelled&&age<3*H);
  found.push({g,outlets,coverage,trending,breaking,newest});
 }
 const keep=new Set(found.filter(x=>x.breaking).sort((a,b)=>b.coverage-a.coverage||b.newest-a.newest).slice(0,maxBreaking));
 for(const x of found){
  for(const i of x.g){
   const a=articles[i];
   a.coverage=x.coverage;
   if(x.coverage>1)a.outlets=x.outlets.slice(0,4);
   if(x.trending)a.trending=true;
   if(keep.has(x))a.breaking=true;
  }
 }
 return articles;
}
