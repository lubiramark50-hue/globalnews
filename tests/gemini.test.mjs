import test from "node:test";
import assert from "node:assert/strict";
import {enrichGemini} from "../worker/ingest.js";

test("Gemini stays off without a server-side key",async()=>{
 let calls=0;
 const DB={prepare:()=>{calls++;throw Error("DB should not be queried")}};
 const result=await enrichGemini({DB});
 assert.equal(result.enabled,false);
 assert.equal(calls,0);
});
test("hard daily budget prevents all Gemini network calls",async()=>{
 const old=globalThis.fetch;
 globalThis.fetch=async()=>{throw Error("Do not make API calls")};
 try{
  const env={GEMINI_API_KEY:"test-only-not-a-real-key",DB:{prepare:()=>({first:async()=>({calls:12})})}};
  const result=await enrichGemini(env);
  assert.equal(result.processed,0);
  assert.equal(result.reason,"daily cap reached");
 }finally{globalThis.fetch=old}
});
test("constrained Gemini output is recorded only when grounded",async()=>{
 const previous=globalThis.fetch;
 let calls=0,wrote=false,secretHeader=false;
 const article={id:"example1",title:"Local council opens new clinic",description:"The council has opened a new clinic serving residents in the town centre, according to the council's published statement.",source:"Example publisher",url:"https://example.org/clinic"};
 const env={
  GEMINI_API_KEY:"nonsecret-fixture",
  DB:{prepare:sql=>({
   first:async()=>({calls:0}),
   bind:(...args)=>({
    all:async()=>({results:[article]}),
    run:async()=>{if(sql.includes("article_summaries")){wrote=true;assert.match(args[1],/clinic/)}return{meta:{last_row_id:2,changes:1}}}
   })
  })}
 };
 globalThis.fetch=async(url,opts)=>{calls++;secretHeader=opts.headers["x-goog-api-key"]==="nonsecret-fixture";assert.match(url,/generativelanguage.googleapis.com/);return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({supported:true,summary:"The local council opened a new clinic for residents in the town centre, according to its published statement."})}]}}]})}};
 try{const result=await enrichGemini(env);assert.equal(result.processed,1);assert.equal(calls,1);assert.equal(wrote,true);assert.equal(secretHeader,true)}
 finally{globalThis.fetch=previous}
});
test("unsupported numeric Gemini claims are discarded",async()=>{
 const old=globalThis.fetch;
 let summaryWritten=false;
 const article={id:"a",title:"Council opens local clinic",description:"A local council opened a clinic in the town centre for residents in the area.",source:"Example",url:"https://example.org/a"};
 const env={GEMINI_API_KEY:"fixture",DB:{prepare:sql=>({first:async()=>({calls:0}),bind:()=>({all:async()=>({results:[article]}),run:async()=>{if(sql.includes("article_summaries"))summaryWritten=true;return{meta:{last_row_id:3}}}})})}};
 globalThis.fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({supported:true,summary:"The council opened 50 new clinics for residents in the town centre, according to an official statement."})}]}}]})});
 try{const x=await enrichGemini(env);assert.equal(x.processed,0);assert.equal(summaryWritten,false)}
 finally{globalThis.fetch=old}
});
