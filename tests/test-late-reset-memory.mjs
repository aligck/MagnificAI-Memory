import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
// Observed in Firefox: after a model switch the app writes the new model's
// defaults later than the restore passes. The restored values must win and the
// late defaults must not be saved over the model's record.
const dom=new JSDOM('<html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:'https://www.magnific.com/app/tools/video-upscaler',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver'])globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
const {createApp,h,reactive,watch,nextTick}=await import('../node_modules/vue/dist/vue.esm-bundler.js');
const state=reactive({mode:'topaz',enhancementModel:'proteus',topazDetails:.2,topazNoise:0});
const api={form:state};const store=new Map();dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':'["assets/useVideoUpscaleForm.test.v2.js"]'});
dom.window.__core={sp:watch,Rf:nextTick,$:()=>({})};dom.window.__videoUpscale={i:()=>api};
// The app's own late reset: every model switch writes the defaults again 250 ms later.
let lateResets=0;watch(()=>state.enhancementModel,()=>setTimeout(()=>{state.topazDetails=.2;state.topazNoise=0;lateResets++;},250));
const Form={name:'VideoUpscalerToolForm',props:['id'],setup(){return()=>h('div',{},[h('div',{'data-cy':'video-upscaler-type-tabs'},'Creative'),h('button',{'data-cy':'generate-button'},'Upscale')]);}};
const Root={setup(){return()=>h('aside',[h(Form,{id:'form'})]);}};
const app=createApp(Root);app.mount('#app');
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('const SETTLE_MS = 3000','const SETTLE_MS = 900').replace('await import(mainUrl)','window.__core').replace("await import(await asset('useVideoUpscaleForm'))",'window.__videoUpscale');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const settle=async()=>{for(let i=0;i<20;i++){await nextTick();await wait(5);}};
const record=(model,key)=>store.get('magnific-model-memory-v3:control:'+encodeURIComponent('/app/tools/video-upscaler::topaz::'+model)+':'+encodeURIComponent('state::'+key))?.value;
dom.window.eval(source);await settle();
state.topazDetails=.75;state.topazNoise=.3;await settle();
assert.equal(record('proteus','topazDetails'),.75);
// Switch away: the new model has no record yet, so its defaults are its settings.
state.enhancementModel='astra2';state.topazDetails=.2;state.topazNoise=0;await wait(400);await settle();
assert.equal(record('astra2','topazDetails'),.2);
await wait(1000);state.topazDetails=.4;await settle();assert.equal(record('astra2','topazDetails'),.4);
// Switch back: restore lands, then the app's late reset arrives.
state.enhancementModel='proteus';state.topazDetails=.2;state.topazNoise=0;await settle();
assert.equal(state.topazDetails,.75);
await wait(400);await settle();
assert.equal(lateResets,2);
assert.equal(state.topazDetails,.75,'late app reset overwrote the restored value');
assert.equal(state.topazNoise,.3);
assert.equal(record('proteus','topazDetails'),.75,'late app reset was saved over the record');
assert.equal(record('proteus','topazNoise'),.3);
// Once the settle window has closed, a change is an ordinary edit again.
await wait(900);state.topazDetails=.5;await settle();
assert.equal(record('proteus','topazDetails'),.5);assert.equal(state.topazDetails,.5);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();dom.window.close();
console.log('PASS: late app reset after a model switch is undone and not saved; later edits save normally.');
