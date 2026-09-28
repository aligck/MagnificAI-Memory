import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
// Records written by earlier builds under rules that are stricter now: they must be
// removed once, while ordinary settings, generic control records and v2 records stay.
const dom=new JSDOM('<html><head></head><body></body></html>',{url:'https://www.magnific.com/app/tools/video-upscaler',runScripts:'outside-only',pretendToBeVisual:true});
const P='magnific-model-memory-v3:control:';
const key=(ctx,field)=>P+encodeURIComponent(ctx)+':'+encodeURIComponent(field);
const upscale='/app/tools/video-upscaler::magnific',relight='/app/tools/relight::default',video='/app/ai-video-generator::pixverse-5-5',image='/app/ai-image-generator::mai-image-2-5';
const rejected=[
  key(upscale,'state::astraPrompt'),
  key(relight,'state::partial::["relightPresets",0,"key"]'),
  key(relight,'state::partial::["relightPresets",0,"lights"]'),
  key(relight,'state::partial::["lightTransferPresets",3,"key"]'),
  key(image,'state::brandKitId'),
  key(image,'state::brandKitTemplateSlug'),
  key(video,'state::voices'),
  key(video,'state::isTalkingVideosMode'),
  key(video,'state::promptType')
];
const kept=[
  key(upscale,'state::sharpen'),
  key(image,'state::smartPrompt'),
  key(video,'state::promptEnhanced'),
  key(video,'state::multiShots'),
  key(video,'state::partial::["multiShots",0,"duration"]'),
  key(relight,'state::lights'),
  key(relight,'state::activePresetId'),
  key(image,'state::promptType'),
  key(upscale,'FormSlider::video-upscaler-sharpen::::modelValue'),
  'magnific-model-memory-v2:model:image::gpt-2-5'
];
const values={[rejected[0]]:'a private astra prompt',[rejected[8]]:'multishot',[kept[7]]:'basic',[kept[0]]:.35,[kept[1]]:true,[kept[2]]:false,[kept[3]]:[],[kept[4]]:8,[kept[6]]:'Frost Edge',[kept[8]]:.35};
const store=new Map();
for(const k of [...rejected,...kept])store.set(k,{value:k in values?values[k]:null,version:3});
store.set(kept[5],{value:[{type:'neutral',color:'#ffffff',azimuth:90,elevation:0,intensity:9}],version:3});
dom.window.GM_getValue=(k,d)=>store.has(k)?structuredClone(store.get(k)):d;
dom.window.GM_setValue=(k,v)=>store.set(k,structuredClone(v));
dom.window.GM_listValues=()=>[...store.keys()];
dom.window.GM_deleteValue=k=>store.delete(k);
const source=fs.readFileSync(new URL('../src/magnific-memory.user.js',import.meta.url),'utf8').replace('const SETTLE_MS = 3000','const SETTLE_MS = 0');
dom.window.eval(source);
for(const k of rejected)assert.ok(!store.has(k),'rejected record kept: '+decodeURIComponent(k));
for(const k of kept)assert.ok(store.has(k),'setting record removed: '+decodeURIComponent(k));
assert.ok(!JSON.stringify([...store]).includes('a private astra prompt'));
assert.equal(store.get('magnific-model-memory-v3:meta:cleanup'),2);
// Runs once per rule revision: a second page load does not scan or delete again.
const late=key(upscale,'state::astraPrompt');store.set(late,{value:'x',version:3});
let listed=0;dom.window.GM_listValues=()=>{listed++;return [...store.keys()];};
dom.window.dispatchEvent(new dom.window.Event('pagehide'));
dom.window.eval(source);
assert.equal(listed,0);assert.ok(store.has(late));
// Hosts without list/delete grants keep working and do not throw.
const bare=new JSDOM('<html><body></body></html>',{url:'https://www.magnific.com/app',runScripts:'outside-only',pretendToBeVisual:true});
bare.window.GM_getValue=(k,d)=>d;bare.window.GM_setValue=()=>{};
bare.window.eval(source);
for(const w of [dom.window,bare.window]){w.dispatchEvent(new w.Event('pagehide'));w.close();}
console.log('PASS: one-time cleanup removes stored catalogs, named prompt text, asset references, mode switches and a stored multi-shot prompt mode; keeps settings, partial duration, lights, generic control and v2 records; no rescan after the mark; tolerant without list/delete grants.');
