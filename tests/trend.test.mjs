import test from "node:test";
import assert from "node:assert/strict";
import {annotate,tokens,publisherOf} from "../functions/lib/trend.js";
const NOW=Date.parse("2026-11-02T12:00:00Z");
const ago=m=>new Date(NOW-m*60000).toISOString();
const a=(title,source,min)=>({title,source,publishedAt:ago(min)});
test("same event from three outlets is trending and breaking when fresh",()=>{
 const list=annotate([a("Earthquake strikes northern Japan, tsunami warning issued","BBC World",20),a("Powerful earthquake hits northern Japan; tsunami warning issued","DW",35),a("Japan earthquake: tsunami warning issued after strong quake","CNN",50),a("Central bank holds interest rates steady for third meeting","NPR",30)],NOW);
 assert.ok(list.slice(0,3).every(x=>x.trending&&x.breaking&&x.coverage===3));
 assert.equal(list[3].coverage,1);assert.ok(!list[3].breaking&&!list[3].trending);
});
test("two outlets are not enough to call a story trending",()=>{
 const l=annotate([a("Parliament passes national budget after long debate","BBC World",10),a("National budget passed by parliament after long debate","DW",15)],NOW);
 assert.ok(!l[0].trending&&!l[0].breaking);assert.equal(l[0].coverage,2);
});
test("an old widely covered story is trending-free and never breaking",()=>{
 const l=annotate([a("Earthquake strikes northern Japan, tsunami warning issued","BBC World",3000),a("Powerful earthquake hits northern Japan; tsunami warning issued","DW",3010),a("Japan earthquake: tsunami warning issued after strong quake","CNN",3020)],NOW);
 assert.ok(l.every(x=>!x.breaking&&!x.trending));
});
test("Google News items count the real publisher named in the title",()=>{
 const g=t=>({title:t,source:"Google News · Uganda",publishedAt:ago(25)});
 const l=annotate([g("Flood warning issued for river districts after heavy rain - Reuters"),g("Heavy rain: flood warning issued for river districts - AP News"),g("River districts flood warning issued after heavy rain - Daily Monitor")],NOW);
 assert.equal(l[0].coverage,3);assert.equal(publisherOf(l[0]),"Reuters");
});
test("a publisher's own BREAKING label counts if recent, ignored if old",()=>{
 const fresh=annotate([a("BREAKING: Minister resigns amid corruption inquiry","Al Jazeera",30)],NOW);
 const old=annotate([a("BREAKING: Minister resigns amid corruption inquiry","Al Jazeera",600)],NOW);
 assert.ok(fresh[0].breaking);assert.ok(!old[0].breaking);
});
test("at most four stories are flagged breaking and the widest coverage wins",()=>{
 const events=["Volcano erupts near island resort","Ferry capsizes off coastal harbour","Railway strike halts commuter services","Wildfire forces mountain village evacuation","Stadium roof collapses during concert","Bridge failure closes motorway corridor"];
 const arts=events.flatMap((t,i)=>["BBC World","DW","CNN"].concat(i>=4?["NPR","ABC News"]:[]).map(s=>a(t,s,20+i)));
 const l=annotate(arts,NOW);
 const flagged=new Set(l.filter(x=>x.breaking).map(x=>x.title));
 assert.equal(flagged.size,4);
 assert.ok(flagged.has(events[4])&&flagged.has(events[5]));
 assert.ok(l.every(x=>x.trending));
});
test("tokenising drops short words, stop words and the publisher suffix",()=>{
 assert.deepEqual(tokens("The big Flood hits town - Reuters").sort(),["flood","hits","town"].sort());
});
