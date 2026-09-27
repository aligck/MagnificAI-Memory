import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
const dom=new JSDOM('<html><head><script src="https://cdn.magnific.com/ait/assets/index.test.v2.js"></script></head><body><div id="app"></div></body></html>',{url:'https://www.magnific.com/app/image-editor/family/image',runScripts:'outside-only',pretendToBeVisual:true});
for(const k of ['window','document','Element','HTMLElement','SVGElement','Node','MutationObserver'])globalThis[k]=dom.window[k];
dom.window.HTMLElement.prototype.getClientRects=()=>[{width:100,height:20}];
const {createApp,h,ref,reactive,computed,shallowRef,watch,nextTick}=await import('../node_modules/vue/dist/vue.esm-bundler.js');
const grain=reactive({amount:0,size:1,monochrome:false,lumaAmount:1,chromaAmount:.2});
// The retouch source keeps the flips on the canvas image object and mirrors LUT
// state as a selected lut plus its intensity. Only the lut identifier is needed
// to apply it again; the tool fetches the lut data by id.
const currentImage=shallowRef(null),globalCanvas=ref(null),hasChanges=ref(false);
const selectedLut=ref(null),lutIntensity=ref(1);
const applied={lut:null,intensity:null},flipCalls=[];
let deferred=null;
const flushDeferred=()=>{const pending=deferred||[];deferred=null;for(const apply of pending)apply();};
const api={
  exposure:ref(0),brightness:ref(0),grain,noise:computed({get:()=>grain.amount,set:v=>grain.amount=v}),overlay:ref({color:null,opacity:.3,mode:'screen'}),rotation:ref(0),
  canvas:globalCanvas,canvasNode:ref(null),currentImage,hasChanges,selectedLut,lutIntensity,
  presets:ref([{id:1,name:'vintage',data:{exposure:.2}}]),presetApplied:ref(false),showPremiumModal:ref(false),
  premiumPlusFilters:ref([]),availableAspectRatios:computed(()=>[]),maxLights:3,
  flip(direction){
    const image=currentImage.value;
    if(!image||!globalCanvas.value)return;
    flipCalls.push(direction);hasChanges.value=true;
    const key=direction==='X'?'flipX':'flipY',target=!image[key];
    const apply=()=>{image[key]=target;globalCanvas.value.renderAll();};
    if(deferred)deferred.push(apply);else apply();
  },
  setLut:async(lut,intensity)=>{
    if(!lut){applied.lut=null;return;}
    if(typeof lut.id!=='string'){selectedLut.value=null;return;}
    applied.lut=lut.id;applied.intensity=intensity;
  }
};
watch(selectedLut,()=>api.setLut(selectedLut.value,lutIntensity.value));
watch(lutIntensity,value=>{if(selectedLut.value)applied.intensity=value;});
const store=new Map();dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.fetch=async url=>({text:async()=>String(url).includes('/index.')?'import "./core.test.v2.js"':'["assets/useGlobalCanvasRetouch.test.v2.js"]'});
dom.window.__core={sp:watch,Rf:nextTick,$:()=>({})};dom.window.__adjust={m:()=>api};
const Root={setup(){return()=>h('div',{'data-cy':'full-canvas-layout'},[h('div',{id:'adjust-panel'},[h('p','Flip'),h('textarea','prompt stays unchanged')])]);}};
let app=createApp(Root);app.mount('#app');
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('await import(mainUrl)','window.__core').replace("await import(await asset('useGlobalCanvasRetouch'))",'window.__adjust');
const settle=async()=>{for(let i=0;i<20;i++){await nextTick();await new Promise(r=>setTimeout(r,5));}};
const record=field=>[...store.entries()].find(([k])=>k.endsWith(encodeURIComponent('state::'+field)))?.[1].value;
const readyToOpen=()=>{globalCanvas.value={renderAll(){}};currentImage.value={flipX:false,flipY:false};};
readyToOpen();dom.window.eval(source);await settle();
assert.equal(document.querySelector('[data-magnific-memory-ready]').getAttribute('data-magnific-memory-context'),'/app/image-editor::adjust');
api.exposure.value=.25;api.brightness.value=.2;grain.amount=10;grain.size=2;grain.monochrome=true;api.overlay.value={color:'#336AEA',opacity:.5,mode:'multiply'};api.rotation.value=5;
assert.ok([...store.values()].some(v=>v.value===.25));await settle();
// A lut selection is stored as its identifier and short labels; its file, url,
// owner and size stay out, and the intensity is a plain numeric setting.
const lut={id:'lut-vintage-33',name:'Vintage',category:'vintage',url:'https://cdn.magnific.com/luts/vintage.cube',user_id:null,size:33,slug:'vintage-film',lutData:[1,2,3]};
selectedLut.value=lut;lutIntensity.value=.6;await settle();
assert.deepEqual(JSON.parse(JSON.stringify(record('selectedLut'))),{id:'lut-vintage-33',name:'Vintage',category:'vintage'});
assert.equal(record('lutIntensity'),.6);assert.equal(applied.lut,'lut-vintage-33');assert.equal(applied.intensity,.6);
assert.ok(!/vintage\.cube|user_id|slug|lutData/.test(JSON.stringify([...store])));
// A selection that carries no identifier cannot be applied again, so it is not
// kept as a setting even though it looks like one.
selectedLut.value={name:'no identifier'};await settle();assert.ok(!JSON.stringify([...store]).includes('no identifier'));
selectedLut.value=lut;lutIntensity.value=.6;await settle();
// The flip buttons call the tool's own api; the flip is stored as a boolean and
// a second flip of an axis already marked as changed still has to persist.
api.flip('X');await settle();assert.equal(record('flipX'),true);
api.flip('Y');await new Promise(r=>setTimeout(r,700));assert.equal(record('flipY'),true);
await settle();
assert.ok(!/canvas|currentImage|presets|presetApplied|showPremiumModal|hasChanges|availableAspectRatios|prompt/.test([...store.keys()].join('\n')));
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
api.exposure.value=0;api.brightness.value=0;Object.assign(grain,{amount:0,size:1,monochrome:false});api.overlay.value={color:null,opacity:.3,mode:'screen'};api.rotation.value=0;
selectedLut.value=null;lutIntensity.value=1;applied.lut=null;
dom.reconfigure({url:'https://www.magnific.com/app/image-editor/other-family/other-image'});
// Another image opens unflipped and the canvas setter can land after the
// restore pass reads the flag.
readyToOpen();flipCalls.length=0;deferred=[];
let clicks=0;document.addEventListener('click',()=>clicks++);app=createApp(Root);app.mount('#app');dom.window.eval(source);await settle();
flushDeferred();await settle();
assert.equal(api.exposure.value,.25);assert.equal(api.brightness.value,.2);assert.equal(api.grain,grain);assert.equal(grain.amount,10);assert.equal(grain.size,2);assert.equal(grain.monochrome,true);assert.equal(api.rotation.value,5);assert.deepEqual(JSON.parse(JSON.stringify(api.overlay.value)),{color:'#336AEA',opacity:.5,mode:'multiply'});
assert.equal(currentImage.value.flipX,true);assert.equal(currentImage.value.flipY,true);
assert.deepEqual(flipCalls,['X','Y']);
assert.equal(applied.lut,'lut-vintage-33');assert.equal(applied.intensity,.6);
assert.equal(clicks,0);assert.equal(document.querySelector('textarea').value,'prompt stays unchanged');
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();
// Third boot: the canvas ref lands after the restore passes. The flip call
// silently no-ops without a canvas, so the axis must wait for the periodic
// reconciliation instead of being dropped for the rest of the page load.
dom.reconfigure({url:'https://www.magnific.com/app/image-editor/third-family/third-image'});
currentImage.value={flipX:false,flipY:false};globalCanvas.value=null;deferred=null;flipCalls.length=0;
app=createApp(Root);app.mount('#app');dom.window.eval(source);await settle();
assert.deepEqual(flipCalls,[]);
assert.equal(currentImage.value.flipX,false);assert.equal(currentImage.value.flipY,false);
globalCanvas.value={renderAll(){}};await new Promise(r=>setTimeout(r,1200));
assert.deepEqual(flipCalls,['X','Y']);
assert.equal(currentImage.value.flipX,true);assert.equal(currentImage.value.flipY,true);
await new Promise(r=>setTimeout(r,700));
assert.deepEqual(flipCalls,['X','Y']);
assert.equal(record('flipX'),true);assert.equal(record('flipY'),true);
dom.window.dispatchEvent(new dom.window.Event('pagehide'));app.unmount();dom.window.close();
console.log('PASS: closed adjustment values, reactive grain object, tint and rotation, lut id/label selection, x/y flip booleans restore across image URLs; canvas/content/transient state excluded; one flip call per axis; late-canvas flip retried once and not repeated; prompt unchanged; zero clicks.');
