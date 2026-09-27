import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
// Video Generator multi-model mode: a selection in modelIds has its own record and the
// app's reset on leaving the mode must not overwrite the primary model's single record.
const dom=new JSDOM('<html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:'https://www.magnific.com/app/ai-video-generator',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver'])globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
const {createApp,h,reactive,watch,nextTick}=await import('../node_modules/vue/dist/vue.esm-bundler.js');
const state=reactive({modelId:'pixverse-5-5',modelIds:[],prompt:'keep my prompt',aspectRatio:'16:9',duration:5,promptType:'basic',multiShots:[]});
// Observed live: clearing the multi-model selection resets aspectRatio to 1:1.
watch(()=>state.modelIds.length,(n,o)=>{if(o>0&&n===0)state.aspectRatio='1:1';});
const store=new Map();dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':'["assets/useVideoGeneratorForm.test.v2.js"]'});
dom.window.__core={sp:watch,Rf:nextTick,$:()=>({}),Os:'video-form'};
dom.window.__video={t:id=>{assert.equal(id,'video-form');return {videoGeneratorFormState:state};}};
const Root={setup(){return()=>h('aside',[h('div',{'data-cy':'video-generator-panel'},[h('button',{'data-cy':'generate-button'},'Generate')])]);}};
let app=createApp(Root);app.mount('#app');
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('await import(mainUrl)','window.__core').replace("await import(await asset('useVideoGeneratorForm'))",'window.__video');
const settle=async()=>{for(let i=0;i<20;i++){await nextTick();await new Promise(r=>setTimeout(r,5));}};
const ctx=()=>document.querySelector('[data-magnific-memory-context]').getAttribute('data-magnific-memory-context');
const saved=(c,k)=>store.get('magnific-model-memory-v3:control:'+encodeURIComponent(c)+':'+encodeURIComponent('state::'+k))?.value;
dom.window.eval(source);await settle();
assert.equal(ctx(),'/app/ai-video-generator::pixverse-5-5');
state.modelIds.push('pixverse-5-5');state.modelIds.push('wan-2-2');await settle();
assert.equal(ctx(),'/app/ai-video-generator::multi::pixverse-5-5+wan-2-2');
state.duration=8;await settle();
assert.equal(saved('/app/ai-video-generator::multi::pixverse-5-5+wan-2-2','duration'),8);
assert.equal(saved('/app/ai-video-generator::pixverse-5-5','duration'),5);
state.modelIds.splice(0);await settle();
assert.equal(ctx(),'/app/ai-video-generator::pixverse-5-5');
assert.equal(state.aspectRatio,'16:9');assert.equal(state.duration,5);
assert.equal(saved('/app/ai-video-generator::pixverse-5-5','aspectRatio'),'16:9');
// Same selection in another order is the same context.
state.modelIds.push('wan-2-2');state.modelIds.push('pixverse-5-5');await settle();
assert.equal(ctx(),'/app/ai-video-generator::multi::pixverse-5-5+wan-2-2');assert.equal(state.duration,8);
assert.equal(state.prompt,'keep my prompt');assert.ok(!JSON.stringify([...store]).includes('keep my prompt'));
assert.ok(![...store.keys()].some(k=>k.includes('modelIds')));
state.modelIds.splice(0);await settle();assert.equal(ctx(),'/app/ai-video-generator::pixverse-5-5');assert.equal(state.duration,5);
// Multi-shot: shot durations are kept by position; the mode and the derived total are not.
state.promptType='multishot';state.multiShots=[{id:'s1',prompt:'first shot text',duration:7},{id:'s2',prompt:'second shot text',duration:4}];state.duration=11;await settle();
const one='/app/ai-video-generator::pixverse-5-5';
assert.equal(saved(one,'promptType'),'basic');assert.equal(saved(one,'duration'),5);
assert.equal(saved(one,'partial::["multiShots",0,"duration"]'),7);assert.equal(saved(one,'partial::["multiShots",1,"duration"]'),4);
assert.ok(!JSON.stringify([...store]).includes('shot text'));
// Reload: the app does not keep shots; the form must come back in basic mode, not an empty multi-shot mode.
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
state.promptType='basic';state.multiShots=[];state.duration=5;
app=createApp(Root);app.mount('#app');dom.window.eval(source);await settle();
assert.equal(state.promptType,'basic');assert.equal(state.duration,5);assert.deepEqual(state.multiShots,[]);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();dom.window.close();
console.log('PASS: multi-model selection has its own context (order-independent); leaving the mode restores the single model and the app reset is not recorded; prompt and modelIds not stored; multi-shot durations kept by position while the multi-shot mode and derived total are not restored into an empty form.');
