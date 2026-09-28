import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
// Observed live on Sound FX: the form heading "Model" sits above the whole settings
// group. Controls below it (loop switch, Generate) are not model controls, and a
// setting change must not change the model context.
const dom=new JSDOM('<!doctype html><html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:'https://www.magnific.com/app/soundfx-generator',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver'])globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
const {createApp,h,reactive,defineComponent,watch,nextTick}=await import('../node_modules/vue/dist/vue.esm-bundler.js');
const store=new Map();dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':'[]'});
dom.window.__core={sp:watch,Rf:nextTick,$:()=>({})};
const values=reactive({loop:false,duration:5,version:'flexible'});
const Switch=defineComponent({name:'Switch',props:['modelValue'],emits:['update:modelValue'],setup(p,{emit}){return()=>h('button',{role:'switch','data-cy':'sfx-generator-loop-switch','aria-checked':String(p.modelValue),onClick:()=>emit('update:modelValue',!p.modelValue)},p.modelValue?'On':'Off');}});
const Duration=defineComponent({name:'FormSelector',props:['modelValue'],emits:['update:modelValue'],setup(p){return()=>h('select',{'data-cy':'sfx-generator-duration-selector',value:p.modelValue},[h('option',{value:5},'5'),h('option',{value:10},'10')]);}});
// Radix pattern: visible trigger without data-cy, stable data-cy on a hidden native select.
let versionComp;
const VersionSelect=defineComponent({name:'SelectRoot',props:['modelValue'],emits:['update:modelValue'],setup(p){return()=>h('div',[h('div','Version'),h('button',{role:'combobox'},p.modelValue),h('select',{'data-cy':'version-select','aria-hidden':'true',value:p.modelValue},['faithful','creative','flexible'].map(v=>h('option',{value:v},v)))]);}});
const Root={setup(){return()=>h('aside',[h('div',[h('label','Model'),h('button',{'data-cy':'sfx-model-attribution'},'ElevenLabs'),h(VersionSelect,{modelValue:values.version,'onUpdate:modelValue':v=>values.version=v,ref:c=>versionComp=c}),
  h('div',[h('div',[h(Switch,{modelValue:values.loop,'onUpdate:modelValue':v=>values.loop=v})]),h(Duration,{modelValue:values.duration,'onUpdate:modelValue':v=>values.duration=v})]),
  h('div',[h('button',{'data-cy':'decrease-number-images-button'},'-'),h('button',{'data-cy':'increase-number-images-button'},'+')]),
  h('button',{'data-cy':'generate-button'},'Generate')])]);}};
const app=createApp(Root);app.mount('#app');
for(const el of document.querySelectorAll('*'))delete el.__vueParentComponent;
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('const SETTLE_MS = 3000','const SETTLE_MS = 0').replace('await import(mainUrl)','window.__core');
const settle=async()=>{for(let i=0;i<30;i++){await nextTick();await new Promise(r=>setTimeout(r,5));}};
const ctx=()=>document.querySelector('aside').getAttribute('data-magnific-memory-context');
dom.window.eval(source);await settle();
assert.equal(ctx(),'/app/soundfx-generator::flexible');
values.loop=true;await settle();
assert.equal(ctx(),'/app/soundfx-generator::flexible');
const saved=[...store].find(([k])=>k.includes('sfx-generator-loop-switch'));
assert.ok(saved&&saved[0].includes(encodeURIComponent('/app/soundfx-generator::flexible')));assert.equal(saved[1].value,true);
// A "version" selector is a model choice (Skin Enhancer): each version keeps its own values.
values.version='creative';await settle();values.loop=false;await settle();
assert.equal(ctx(),'/app/soundfx-generator::creative');
values.version='flexible';await settle();assert.equal(ctx(),'/app/soundfx-generator::flexible');assert.equal(values.loop,true);
// Background tab: the scan timer is throttled past the model-switch guard timer, and the
// app resets a setting for the new version after that guard would have expired. The reset
// must not reach the previous version's record.
const realTimeout=dom.window.setTimeout.bind(dom.window);
dom.window.setTimeout=(fn,ms,...a)=>realTimeout(fn,ms===50?1500:ms,...a);
const sel=[...document.querySelectorAll('select')].find(e=>e.getAttribute('data-cy')==='version-select');
versionComp.$.vnode.props['onUpdate:modelValue']('creative');await nextTick();
await new Promise(r=>realTimeout(r,1200));values.loop=false;
await new Promise(r=>realTimeout(r,1000));await settle();
dom.window.setTimeout=realTimeout;
assert.equal(ctx(),'/app/soundfx-generator::creative');
const flexibleLoop=[...store].find(([k])=>k.includes(encodeURIComponent('/app/soundfx-generator::flexible'))&&k.includes('sfx-generator-loop-switch'))[1].value;
assert.equal(flexibleLoop,true);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();dom.window.close();
console.log('PASS: a form-wide "Model" heading does not turn settings or Generate into model controls; the context stays fixed while a setting changes; a version selector separates model contexts; a throttled scan cannot let the new version reset reach the previous record.');
