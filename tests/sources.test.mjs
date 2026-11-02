import test from "node:test";
import assert from "node:assert/strict";
import {parse,pickSources,storeAll,CORE,TOPIC_GROUPS,LOCAL} from "../functions/api/news.js";
const rss=`<rss><channel><item><title><![CDATA[Quake hits coastal region overnight]]></title><link>https://example.org/a</link><description><![CDATA[<p>Details &amp; more.</p><img src="http://img.example.org/x.jpg">]]></description><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
const atom=`<feed><entry><title>Atom headline about harbour crisis</title><link rel="alternate" href="https://example.org/b"/><updated>2026-11-02T09:00:00Z</updated><summary>Short summary text.</summary></entry></feed>`;
const rdf=`<rdf:RDF><item rdf:about="https://example.org/c"><title>RDF headline from Deutsche Welle feed</title><link>https://example.org/c</link><description>RDF description.</description><dc:date>2026-11-02T08:00:00Z</dc:date></item></rdf:RDF>`;
test("RSS, Atom and RDF feeds all parse into the same shape",()=>{
 const a=parse(rss,{name:"T"})[0],b=parse(atom,{name:"T"})[0],c=parse(rdf,{name:"T"})[0];
 assert.equal(a.url,"https://example.org/a");assert.equal(a.publishedAt,"2026-11-02T10:00:00.000Z");assert.equal(a.description,"Details & more.");
 assert.equal(b.url,"https://example.org/b");assert.equal(b.publishedAt,"2026-11-02T09:00:00.000Z");assert.equal(b.description,"Short summary text.");
 assert.equal(c.url,"https://example.org/c");assert.equal(c.publishedAt,"2026-11-02T08:00:00.000Z");
});
test("images are upgraded to https and javascript: links are rejected",()=>{
 assert.equal(parse(rss,{name:"T"})[0].image,"https://img.example.org/x.jpg");
 assert.equal(parse(rss.replace("x.jpg","x"),{name:"T"})[0].image,null);
 assert.equal(parse(rss.replace("https://example.org/a","javascript:alert(1)"),{name:"T"}).length,0);
});
test("every country stays within the platform subrequest budget",()=>{
 for(const c of Object.keys(LOCAL))for(let slot=0;slot<TOPIC_GROUPS.length;slot++){
  const list=pickSources(c,slot*6e5);assert.ok(list.length<=40,c+" "+list.length);
  assert.ok(list.length>=CORE.length+2);
  assert.equal(new Set(list.map(s=>s.url)).size,list.length,"no duplicate feed urls");
  assert.ok(list.every(s=>s.url.startsWith("http")));
 }
});
test("topic feeds rotate across 10-minute slots",()=>{
 const names=n=>pickSources("UG",n*6e5).map(s=>s.name).join();
 assert.notEqual(names(0),names(1));assert.equal(names(0),names(3));
});
test("archive storage respects D1 limits and writes every row",async()=>{
 const stmts=[];
 const env={DB:{prepare:sql=>({bind:(...a)=>{assert.ok(a.length<=100,"max 100 bound parameters");return{sql,a}}}),batch:async s=>{stmts.push(...s);return s.map(()=>({meta:{changes:10}}))}}};
 const arts=Array.from({length:237},(_,i)=>({id:"id"+i,title:"Headline number "+i+" is long enough",description:"d",source:"S",url:"https://e.org/"+i,image:null,category:"World",regional:i%3===0,publishedAt:null}));
 const changed=await storeAll(env,"UG",arts);
 assert.equal(stmts.length,24);assert.equal(changed,240);
 const regionalRow=stmts[0].a.slice(0,10);assert.equal(regionalRow[7],"UG");assert.equal(regionalRow[8],1);
 assert.equal(stmts[0].a[17],null,"global rows carry no country");
});

import {select} from "../functions/api/news.js";
test("regional stories are never crowded out by high-volume world feeds",()=>{
 const world=Array.from({length:300},(_,i)=>({title:"w"+i,regional:false,publishedAt:new Date(Date.UTC(2026,10,2,12,0,0)-i*1000).toISOString()}));
 const local=Array.from({length:5},(_,i)=>({title:"l"+i,regional:true,publishedAt:new Date(Date.UTC(2026,10,1,12,0,0)-i*1000).toISOString()}));
 const out=select([...world,...local],100);
 assert.equal(out.length,100);assert.equal(out.filter(a=>a.regional).length,5);
 assert.ok(Date.parse(out[0].publishedAt)>=Date.parse(out[99].publishedAt));
});
