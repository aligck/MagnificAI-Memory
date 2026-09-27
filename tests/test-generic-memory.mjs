import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const extraMode=process.argv.includes('--voice')?'voice':process.argv.includes('--audio')?'audio':process.argv.includes('--music')?'music':null;
const editorMode=process.argv.includes('--editor');
const duplicateMode=process.argv.includes('--duplicates');
const unlabeledMode=process.argv.includes('--unlabeled');
// Cinematic Shot renders the image generator form markup under its own form id.
const cinematicMode=process.argv.includes('--cinematic');
const panelSelector=editorMode?'[data-cy="full-canvas-layout"]':'aside';
const dom=new JSDOM('<!doctype html><html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:editorMode?'https://www.magnific.com/app/image-editor/family-one/image-one':'https://www.magnific.com/app/tools/test',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver']) globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=function(){return [{width:100,height:20}];};
const {createApp,h,reactive,defineComponent,watch,nextTick,ref,computed}=await import('../node_modules/vue/dist/vue.esm-bundler.js');
const refMode=process.argv.includes('--refs');
const nativeMode=process.argv.includes('--native')||cinematicMode||refMode||editorMode||!!extraMode;
const imageFormId=cinematicMode?'cinematic-shot':'image-generator-form';
const values=reactive({model:'Model A',strength:0,steps:5,enabled:false,palette:'#ffffff',quality:'low',hiddenResolution:'low',prompt:'keep my prompt'});
const store=new Map();
dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;
dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':String(url).includes('/SingleCanvasUpscale.')?'import {n as settings}from "./types.test.v2.js"':'["assets/useImageGeneratorForm.test.v2.js","assets/SingleCanvasUpscale.test.v2.js"]'});
const unlimited=ref(false);
dom.window.__testCore={sp:watch,Rf:nextTick,$:()=>({isUnlimitedModeEnabled:unlimited})};
const nativeState=reactive({modelId:'Model A'});
const stateKeys=['strength','steps','enabled','palette','quality','hiddenResolution','prompt'];
for(const key of stateKeys)Object.defineProperty(nativeState,key,{enumerable:true,get:()=>values[key],set:v=>values[key]=v});
const formCalls=[];
dom.window.__testNativeMod={t:id=>{formCalls.push(id);assert.equal(id,editorMode?'talk-to-image':imageFormId);return {imageGeneratorFormState:nativeState,isSettingFormProgrammatically:ref(false)};}};
const refsState=Object.fromEntries(stateKeys.map(key=>[key,computed({get:()=>values[key],set:v=>values[key]=v})]));
dom.window.__testUpscaleMod={n:()=>refsState,i:()=>({mode:computed(()=>values.model)})};
dom.window.__testExtraMod={t:id=>{assert.equal(id,'actual-live-form-id');return extraMode==='voice'?{voiceoverFormState:ref(nativeState),currentModel:computed(()=>({provider:nativeState.modelId}))}:{[extraMode==='music'?'musicFormState':'audioGeneratorFormState']:nativeState};}};
const ImageFormWrapper=defineComponent({name:'ImageGeneratorForm',props:['id'],setup(p,{slots}){return()=>h('section',{'data-cy':'image-generator-form'},slots.default?.());}});
const FormWrapper=defineComponent({name:extraMode==='voice'?'VoiceoverForm':extraMode==='music'?'MusicGeneratorForm':'AudioGeneratorForm',props:['id'],setup(p,{slots}){return()=>h('section',{'data-cy':extraMode==='voice'?'voiceover-generator-panel':extraMode==='music'?'music-generator-form':'audio-generator-panel'},slots.default?.());}});
const widget=(name,tag,attrs={})=>defineComponent({name,props:['modelValue','label'],emits:['update:modelValue'],setup(p,{emit}){return()=>h(tag,{...attrs,'aria-label':p.label,value:p.modelValue,'aria-checked':String(p.modelValue),onInput:e=>emit('update:modelValue',attrs.type==='number'||attrs.type==='range'?Number(e.target.value):e.target.value),onChange:e=>emit('update:modelValue',attrs.type==='checkbox'?e.target.checked:e.target.value)},tag==='select'?[h('option',{value:'low'},'low'),h('option',{value:'high'},'high')]:null);}});
const Slider=widget('SliderSetting','input',{type:'range',min:-10,max:10});
const Numeric=widget('NumberInput','input',{type:'number'});
const Switch=widget('SwitchRoot','input',{type:'checkbox'});
const Color=widget('ColorPicker','input',{type:'color'});
const Select=widget('SelectRoot','select');
// Production widgets are often wrapped in components with no public update event.
const NestedSelect=defineComponent({name:'ImageGeneratorFormAspectRatioInput',props:['modelValue','label'],setup(p,{attrs}){return()=>h(Select,{modelValue:p.modelValue,label:p.label,...attrs});}});
const Prompt=process.argv.includes('--rich-prompt')?defineComponent({name:'FormRichInput',props:['modelValue','label'],emits:['update:modelValue'],setup(p){return()=>h('div',{'data-cy':'audio-text-editor'},[h('div',{contenteditable:'true'},p.modelValue),h('button','Format')]);}}):widget('PromptTextarea','textarea');
let sliders=[];
let modelControl;
const ModelSelect=defineComponent({name:'SelectRoot',props:['modelValue'],emits:['update:modelValue'],setup(p){return()=>h('div',[
  h('div',[h('label','Model')]),h('button',{'data-cy':'test-model-selector-trigger'},p.modelValue),
  h('select',{'aria-hidden':'true','data-cy':'enhance-mode-dropdown',value:p.modelValue},[h('option',{value:'Model A'},'Model A'),h('option',{value:'Model B'},'Model B')])]);}});
const app=createApp({setup(){return()=>h(editorMode?'div':'aside',editorMode?{'data-cy':'full-canvas-layout'}:{},[h(extraMode?FormWrapper:nativeMode&&!editorMode&&!refMode&&!extraMode?ImageFormWrapper:'div',extraMode?{id:'actual-live-form-id'}:nativeMode&&!editorMode&&!refMode&&!extraMode?{id:imageFormId}:nativeMode?{'data-cy':editorMode?'edit-bar':'enhance-v2-panel'}:{},[
  h(ModelSelect,{modelValue:values.model,'onUpdate:modelValue':v=>{values.model=v;if(nativeMode)nativeState.modelId=v;values.strength=0;values.steps=5;values.hiddenResolution='low';},ref:c=>modelControl=c}),
  ...[[Slider,'strength','Creativity'],[duplicateMode||unlabeledMode?Slider:Numeric,'steps','Novel numerical option'],[Switch,'enabled','Enabled'],[Color,'palette','Tint'],[NestedSelect,'quality','Quality'],[Prompt,'prompt','Prompt']].map(([type,key,label])=>h(type,{modelValue:values[key],label:unlabeledMode&&['strength','steps'].includes(key)?undefined:label,'data-cy':['strength','steps'].includes(key)?unlabeledMode?undefined:duplicateMode?'shared-slider':'test-'+key:'test-'+key,'onUpdate:modelValue':v=>values[key]=v,ref:c=>{if(key==='strength'&&c)sliders[0]=c;}})),
  h('button',{'data-cy':'generate-button'},'Generate')
])]);}});
app.mount('#app');
// Tool pages also use full-canvas-layout around both their sidebar and gallery.
// Only Image Editor should use that whole layout as its settings root.
if(!editorMode)document.querySelector('#app').setAttribute('data-cy','full-canvas-layout');
// Magnific uses production Vue: there are no development-only component pointers.
for(const el of document.querySelectorAll('*'))delete el.__vueParentComponent;
let source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('await import(mainUrl)','window.__testCore').replaceAll("await import(await asset('useImageGeneratorForm'))",'window.__testNativeMod').replace("await import(await asset(voice?'useVoiceoverForm':music?'useMusicGeneratorForm':'useAudioGeneratorForm'))",'window.__testExtraMod').replace('await import(new URL(dependency,componentUrl).href)','window.__testUpscaleMod');
dom.window.eval(source);
const settle=async()=>{
  for(let i=0;i<12;i++){await nextTick();await new Promise(r=>setTimeout(r,5));}
  // Readiness can be published before the four-tick restore finishes. Wait for
  // the actual bindings, rather than relying on Windows timer granularity.
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){
    const panel=document.querySelector(panelSelector);
    const inventory=JSON.parse(panel?.getAttribute('data-magnific-memory-inventory')||'[]');
    const ready=panel?.getAttribute('data-magnific-memory-ready')==='generic-v3';
    if(ready&&(nativeMode?panel.hasAttribute('data-magnific-memory-state-inventory'):inventory.length===6&&inventory.every(item=>item.ready)))return;
    await nextTick();await new Promise(r=>setTimeout(r,10));
  }
  assert.fail('Timed out waiting for userscript bindings to finish restoration');
};
await settle();
assert.equal(document.querySelector(panelSelector).getAttribute('data-magnific-memory-ready'),'generic-v3');
assert.equal(document.querySelector(panelSelector).getAttribute('data-magnific-memory-controls'),nativeMode?'0':'6');
if(!editorMode)assert.equal(document.querySelector('#app').getAttribute('data-magnific-memory-ready'),null);
// A real Vue emit must be saved in the same call, before the DOM rerenders.
sliders[0].$emit('update:modelValue',7);
assert.equal([...store.values()].find(v=>v.value===7)?.value,7);
values.steps=19;values.enabled=true;values.palette='#123456';values.quality='high';values.prompt='new unsaved prompt';await settle();
if(nativeMode){values.hiddenResolution='high';await settle();}
assert.ok(store.size>=6,JSON.stringify([...store.keys()]));assert.ok(!JSON.stringify([...store]).includes('prompt'));
// Separate model contexts, including a model that the script has never seen.
modelControl.$emit('update:modelValue','Model B');await settle();values.strength=-4;values.steps=31;await settle();
assert.ok([...store.keys()].some(k=>k.includes('Model%20B')));
modelControl.$emit('update:modelValue','Model A');await settle();
assert.equal(values.strength,7);assert.equal(values.steps,19);assert.equal(values.prompt,'new unsaved prompt');
if(nativeMode)assert.equal(values.hiddenResolution,'high');
// Prompt content remains unchanged while color, toggle and dropdown values restore.
modelControl.$emit('update:modelValue','Model B');await settle();values.enabled=false;values.palette='#abcdef';values.quality='low';await settle();
modelControl.$emit('update:modelValue','Model A');await settle();assert.equal(values.enabled,true);assert.equal(values.palette,'#123456');assert.equal(values.quality,'high');
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
// A fresh page uses the durable store and restores through Vue, without any clicks.
values.strength=0;values.steps=5;values.enabled=false;values.palette='#ffffff';values.quality='low';values.hiddenResolution='low';let clicks=0;document.addEventListener('click',()=>clicks++);
if(editorMode)dom.reconfigure({url:'https://www.magnific.com/app/image-editor/family-two/image-two'});
const second=createApp(app._component);second.mount('#app');dom.window.eval(source);await settle();
assert.equal(values.strength,7);assert.equal(values.steps,19);assert.equal(clicks,0);
if(nativeMode)assert.equal(values.hiddenResolution,'high');
// Visiting a model without editing a field must still remember its original value.
modelControl.$emit('update:modelValue','Model C');await settle();const untouched=values.quality;
modelControl.$emit('update:modelValue','Model D');await settle();values.quality=untouched==='high'?'low':'high';await settle();
modelControl.$emit('update:modelValue','Model C');await settle();assert.equal(values.quality,untouched);
if(nativeMode&&!editorMode&&!refMode&&!extraMode){assert.ok(formCalls.length>0);assert.ok(formCalls.every(id=>id===imageFormId));}
dom.window.dispatchEvent(new dom.window.Event('pagehide'));second.unmount();dom.window.close();
console.log('PASS ('+(extraMode?extraMode+' state with discovered form ID':editorMode?'editor state across image URLs':cinematicMode?'image form reused under its own form ID (Cinematic Shot)':refMode?'writable refs + generic controls':nativeMode?'native state + generic controls':'generic controls')+'): synchronous slider save; per-model reset/restore; durable reopen; closed-menu option restore; no prompt storage; zero clicks.');
