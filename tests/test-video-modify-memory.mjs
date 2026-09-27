import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:'https://www.magnific.com/app/tools/video-modify',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver'])globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
const {createApp,h,ref,watch,nextTick}=await import('../node_modules/vue/dist/vue.esm-bundler.js');const DEFAULT_MODEL='video-modify-minimax-h3';
// The live composable keeps one ref bag per form instance, defaults to the
// MiniMax model and clears the chat toggle whenever the model changes.
const normalize=value=>typeof value!=='string'||!value?DEFAULT_MODEL:value.startsWith('video-modify-')?value:'video-modify-'+value;
let bag;
const newBag=()=>{
  const model=ref(DEFAULT_MODEL),resolution=ref('720p'),aspectRatio=ref(),prompt=ref(''),chatEnabled=ref(false);
  watch(model,()=>{chatEnabled.value=false;});
  return bag={
    model,resolution,aspectRatio,prompt,chatEnabled,
    initializeForm:()=>{},setModel:value=>model.value=normalize(value),setResolution:value=>resolution.value=value,
    setAspectRatio:value=>aspectRatio.value=value,setPrompt:value=>prompt.value=value,setChatEnabled:value=>chatEnabled.value=value
  };
};
newBag();
const store=new Map();
dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;
dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':'["assets/useVideoModifyForm.test.v2.js"]'});
dom.window.__core={sp:watch,Rf:nextTick,$:()=>({})};
dom.window.__videoModify={n:id=>{assert.equal(id,'live-modify-form');return bag;}};
const ModelTrigger={name:'ModelTrigger',props:['modelValue'],emits:['update:modelValue'],setup(p){return()=>h('button',{'data-cy':'video-modify-form-model-selector'},p.modelValue);}};
// The live resolution control is a form component with its own two-way binding,
// which is exactly what the generic widget path would capture.
const ResolutionSelect={name:'FormSelector',props:['modelValue','label'],emits:['update:modelValue'],setup(p,{emit}){return()=>h('div',{'data-cy':'video-modify-form-resolution-selector','aria-label':p.label},[h('button',{onClick:()=>emit('update:modelValue','1080p')},String(p.modelValue))]);}};
const showMarker=ref(true);
const Form={name:'VideoModifyToolForm',props:['id'],setup(){return()=>h('div',{},[
  showMarker.value?h(ModelTrigger,{modelValue:bag.model.value}):null,
  h(ResolutionSelect,{modelValue:bag.resolution.value,label:'Resolution','onUpdate:modelValue':v=>bag.setResolution(v)}),
  h('button',{'data-cy':'video-modify-advanced-player-toggle'}),
  h('textarea','prompt content stays untouched'),
  h('button',{'data-cy':'generate-button'},'Modify video')]);}};
const Root={setup(){return()=>h('aside',[h(Form,{id:'live-modify-form'})]);}};
let app=createApp(Root);app.mount('#app');
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('await import(mainUrl)','window.__core').replace("await import(await asset('useVideoModifyForm'))",'window.__videoModify');
const settle=async()=>{for(let i=0;i<20;i++){await nextTick();await new Promise(r=>setTimeout(r,5));}};
const key=(model,field)=>'magnific-model-memory-v3:control:'+encodeURIComponent('/app/tools/video-modify::'+model)+':'+encodeURIComponent('state::'+field);
const saved=(model,field)=>store.get(key(model,field))?.value;
dom.window.eval(source);await settle();
const panel=document.querySelector('aside');
assert.equal(panel.getAttribute('data-magnific-memory-context'),'/app/tools/video-modify::'+DEFAULT_MODEL);
// The closed form source, not the generic widget path, is the authoritative record.
assert.ok(panel.hasAttribute('data-magnific-memory-state-inventory'));
// The ref bag is the authoritative record; a change is saved in the same call.
bag.resolution.value='2k';bag.chatEnabled.value=true;
assert.equal(saved(DEFAULT_MODEL,'resolution'),'2k');
assert.equal(saved(DEFAULT_MODEL,'chatEnabled'),true);
await settle();
assert.ok(!JSON.stringify([...store]).includes('prompt content stays untouched'));
assert.ok(!/state%3A%3Aprompt/.test([...store.keys()].join('\n')));
// The app resets chatEnabled on every model change; that default must not be
// recorded as this model's own choice, and the other model's values stay aside.
bag.setModel('gemini-omni-1_1');await settle();
assert.equal(panel.getAttribute('data-magnific-memory-context'),'/app/tools/video-modify::video-modify-gemini-omni-1_1');
assert.equal(bag.chatEnabled.value,false);
assert.equal(saved(DEFAULT_MODEL,'chatEnabled'),true);
bag.resolution.value='1080p';bag.chatEnabled.value=true;await settle();
bag.setModel('aleph2');await settle();bag.aspectRatio.value='16:9';await settle();
assert.equal(saved('video-modify-aleph2','aspectRatio'),'16:9');
assert.equal(saved('video-modify-gemini-omni-1_1','resolution'),'1080p');
// A model that has no such control must not receive the other model's value.
assert.equal(saved('video-modify-gemini-omni-1_1','aspectRatio'),undefined);
assert.equal(saved(DEFAULT_MODEL,'aspectRatio'),undefined);
bag.setModel('minimax-h3');await settle();
assert.equal(bag.resolution.value,'2k');assert.equal(bag.chatEnabled.value,true);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
// A fresh page starts from the composable defaults and restores through the
// reactive form source, without opening a menu or clicking an option.
newBag();let clicks=0;document.addEventListener('click',()=>clicks++);
app=createApp(Root);app.mount('#app');dom.window.eval(source);await settle();
assert.equal(bag.resolution.value,'2k');assert.equal(bag.chatEnabled.value,true);
assert.equal(bag.prompt.value,'');assert.equal(document.querySelector('textarea').value,'prompt content stays untouched');assert.equal(clicks,0);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
// Observed live: the tool renders its controls before its own marker exists, and
// the generic pass captured them under a model-less context. A control inside a
// tool form must never become a widget record, marker or not.
newBag();showMarker.value=false;const before=new Set(store.keys());
const genericKeys=()=>[...store.keys()].filter(k=>!before.has(k)&&!/:state%3A%3A/.test(k));
app=createApp(Root);app.mount('#app');dom.window.eval(source);await settle();
assert.deepEqual(genericKeys(),[]);
assert.equal(document.querySelector('aside').hasAttribute('data-magnific-memory-state-inventory'),false);
showMarker.value=true;await settle();
assert.ok(document.querySelector('aside').hasAttribute('data-magnific-memory-state-inventory'));
assert.deepEqual(genericKeys(),[]);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();dom.window.close();
console.log('PASS: native video modify ref bag, form ID discovery, per-model resolution/aspect ratio/chat toggle, model-change defaults not recorded, no widget record before the marker renders, prompt untouched, reload, zero clicks.');
