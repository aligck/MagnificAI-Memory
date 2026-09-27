import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
// Observed live: Clip Editor lives at /app/video-clip-editor/:creationId? and renders
// the Modify bar (VideoModifyModelSelector id="video-clip-editor-modify") outside the
// tools sidebar, which holds generic controls such as the speed ramp audio switch.
const dom=new JSDOM('<html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:'https://www.magnific.com/app/video-clip-editor/clipA',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver'])globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
const {createApp,h,ref,reactive,watch,nextTick,defineComponent}=await import('../node_modules/vue/dist/vue.esm-bundler.js');
const bag={model:ref('video-modify-minimax-h3'),resolution:ref('2K'),prompt:ref('keep this modify prompt'),chatEnabled:ref(false)};
const values=reactive({audio:true,multiplier:'4'});
const store=new Map();dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':'["assets/useVideoModifyForm.test.v2.js"]'});
dom.window.__core={sp:watch,Rf:nextTick,$:()=>({})};
dom.window.__videoModify={n:id=>{assert.equal(id,'video-clip-editor-modify');return bag;}};
const Switch=defineComponent({name:'ToggleSwitch',props:['modelValue'],emits:['update:modelValue'],setup(p){return()=>h('button',{role:'switch','data-cy':'speedramp-process-audio-toggle','aria-checked':String(p.modelValue)});}});
const Segmented=defineComponent({name:'SegmentedControl',props:['modelValue'],emits:['update:modelValue'],setup(p){return()=>h('div',{role:'radiogroup','data-cy':'speedramp-multiplier-control'},['4','8','16'].map(v=>h('button',{role:'radio','aria-checked':String(p.modelValue===v)},v+'x')));}});
const Selector=defineComponent({name:'VideoModifyModelSelector',props:['id'],setup(){return()=>h('div',[h('button',{'data-cy':'video-modify-form-model-selector'},bag.model.value),h('textarea',bag.prompt.value)]);}});
const Root={setup(){return()=>h('div',[
  h('div',{'data-cy':'video-tool-bar'},[h(Selector,{id:'video-clip-editor-modify'})]),
  h('aside',{'data-cy':'video-clip-editor-tools-sidebar'},[h(Switch,{modelValue:values.audio,'onUpdate:modelValue':v=>values.audio=v}),h(Segmented,{modelValue:values.multiplier,'onUpdate:modelValue':v=>values.multiplier=v}),h('button',{'data-cy':'generate-button'},'Generate Speed Ramp')])]);}};
const mount=()=>{const app=createApp(Root);app.config.globalProperties.$router={currentRoute:{value:{matched:[{path:'/app'},{path:'/app/video-clip-editor/:creationId?'}]}}};app.mount('#app');for(const el of document.querySelectorAll('*'))delete el.__vueParentComponent;return app;};
let app=mount();
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('await import(mainUrl)','window.__core').replace("await import(await asset('useVideoModifyForm'))",'window.__videoModify');
const settle=async()=>{for(let i=0;i<30;i++){await nextTick();await new Promise(r=>setTimeout(r,5));}};
const aside=()=>document.querySelector('aside');
dom.window.eval(source);await settle();
assert.equal(aside().getAttribute('data-magnific-memory-context'),'/app/video-clip-editor::default');
assert.equal(aside().getAttribute('data-magnific-memory-native-context'),'/app/video-clip-editor::video-modify-minimax-h3');
values.audio=false;values.multiplier='16';bag.resolution.value='1080p';await settle();
const keys=[...store.keys()].join('\n');
assert.ok(!keys.includes('clipA'),'asset id must not enter a record key');
assert.ok(keys.includes(encodeURIComponent('/app/video-clip-editor::default')));
assert.equal(store.get('magnific-model-memory-v3:control:'+encodeURIComponent('/app/video-clip-editor::video-modify-minimax-h3')+':'+encodeURIComponent('state::resolution')).value,'1080p');
assert.ok(!JSON.stringify([...store]).includes('keep this modify prompt'));
// Another clip: same tool records apply.
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
dom.reconfigure({url:'https://www.magnific.com/app/video-clip-editor/clipB'});
values.audio=true;values.multiplier='4';bag.resolution.value='2K';
let clicks=0;document.addEventListener('click',()=>clicks++);
app=mount();dom.window.eval(source);await settle();
assert.equal(values.audio,false);assert.equal(values.multiplier,'16');assert.equal(bag.resolution.value,'1080p');
assert.equal(bag.prompt.value,'keep this modify prompt');assert.equal(clicks,0);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();dom.window.close();
console.log('PASS: Clip Editor context drops the asset id from the route; Modify bar outside the sidebar keeps its own model context while sidebar controls stay generic; both restore on another clip; prompt untouched; zero clicks.');
