// ==UserScript==
// @name         Magnific — Tüm Modellerin Ayar Hafızası
// @namespace    magnific-model-memory
// @version      3.1.1
// @description  Ortak kontrol mekanizmasıyla model ayarlarını kaydeder ve tıklamadan geri yükler.
// @match        https://magnific.ai/*
// @match        https://*.magnific.ai/*
// @match        https://magnific.com/*
// @match        https://*.magnific.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @sandbox      raw
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';
  document.documentElement?.setAttribute('data-magnific-memory-version','3.1.1');
  const PREFIX = 'magnific-model-memory-v3:control:';
  const OMIT = Symbol('omit');
  const SETTLE_MS = 3000; // Late app resets after a model switch are undone for this long.
  const CONTENT = /prompt|instruction|textarea|richinput|script-?editor|text-?editor|contenteditable|reference|upload|file|creationselector|assetpicker|mediapicker|password|search|query|token|secret|credential/i;
  const TRANSIENT = /Modal|Popover|Dialog|(?:open|visible|expanded|loading|pending|hovered|focused)$|^(searchTerm|query|hasChanges|isDefaultSettings|presetApplied)$/i;
  const CONTROL = /slider|select|switch|checkbox|radio|toggle|color|number|numeric|outputax|dimension|duration|seed|preset/i;
  // Skin Enhancer names its model choice "version" (faithful/creative/flexible).
  const MODEL = /(?:model|version)(?!.*setting).*(selector|trigger|select)|mode-selector/i;
  // Tools that expose a real form source own their controls; the component chain
  // is checked so a widget record is never written for them, not even while the
  // tool's own marker is still missing from the DOM.
  const NATIVE_FORM = /^(?:ImageGenerator|VideoGenerator|AudioGenerator|MusicGenerator|Voiceover|RelightTool|VideoUpscalerTool|VideoModifyTool)Form$/;
  // Settings belong to a tool, not to the asset it has open. Routes such as
  // /app/video-clip-editor/:creationId? carry the asset in the path (observed live);
  // the app's own route record names its dynamic parts, so they are dropped here.
  const route = () => {
    const path=location.pathname.replace(/\/$/, '');
    if(/^\/app\/image-editor(?:\/|$)/.test(path))return '/app/image-editor';
    try{
      const record=document.getElementById('app')?.__vue_app__?.config?.globalProperties?.$router?.currentRoute?.value?.matched?.at(-1)?.path;
      if(typeof record==='string'&&record.includes('/:')){
        const base=record.split('/').filter(part=>!part.startsWith(':')).join('/').replace(/\/$/,'');
        if(base&&path.startsWith(base))return base;
      }
    }catch{}
    return path;
  };
  const normal = x => String(x ?? '').replace(/\s+/g, ' ').trim();
  const nameOf = c => c.type?.name || c.type?.__name || '';
  const clone = x => JSON.parse(JSON.stringify(x));
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  let watch, nextTick, loading, queued = false, stopped = false, application, scanRunning=false, scanAgain=false;
  let context = '', revision = 0, transition = false, transitionRevision = 0;
  const bindings = new Map(), byComponent = new WeakMap();
  const modelBindings=new WeakMap();
  let native=null,nativeLoading=false;
  const curtain=document.createElement('style');
  curtain.textContent='aside:has([data-cy="generate-button"]):not([data-magnific-memory-ready]), aside:has([data-cy*="slider"]):not([data-magnific-memory-ready]){visibility:hidden!important}';
  function mountCurtain(){if(!curtain.isConnected)(document.head||document.documentElement)?.append(curtain);}
  mountCurtain();
  const revealTimeout=setTimeout(()=>curtain.remove(),6000);

  // Persist option values only. Text, references and file objects never enter storage.
  function option(value, depth = 0) {
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : OMIT;
    if (typeof value === 'string') return value.length <= 256 && !/^(https?:|data:|blob:)/i.test(value) ? value : OMIT;
    if (depth >= 4 || !value || Object.prototype.toString.call(value) !== '[object Object]' && !Array.isArray(value)) return OMIT;
    if (Array.isArray(value)) {
      if (value.length > 32) return OMIT;
      const result = value.map(v => option(v, depth + 1));
      return result.includes(OMIT) ? OMIT : result;
    }
    const entries = Object.entries(value);
    if (entries.length > 24 || entries.some(([k]) => CONTENT.test(k) || /url|creationId|projectId|userId/i.test(k))) return OMIT;
    const result = entries.map(([k, v]) => [k, option(v, depth + 1)]);
    return result.some(([, v]) => v === OMIT) ? OMIT : Object.fromEntries(result);
  }

  function panel() {
    // Production controls live in the tool sidebar. Do not scan account settings or creation cards.
    return (/^\/app\/image-editor(?:\/|$)/.test(location.pathname) && document.querySelector('[data-cy="full-canvas-layout"]'))
      || document.querySelector('[data-cy="image-generator-form"], [data-cy="video-generator-panel"]')?.closest('aside')
      || document.querySelector('aside:has([data-cy="generate-button"]), aside:has([data-cy*="slider"]), aside:has([data-cy*="generator"]), aside:has([data-cy*="enhance"]), aside:has([data-cy*="relight"])')
      || document.querySelector('aside');
  }
  function visible(el) { return el instanceof Element && el.isConnected && el.getClientRects().length > 0; }
  function label(el) {
    const own=el.getAttribute('aria-label');
    if(own)return normal(own);
    const field=el.closest('fieldset');
    const legend=field?.querySelector(':scope > legend');
    if(legend)return normal(legend.textContent);
    // Prefer the surrounding field label over the currently selected button text.
    for(let p=el.parentElement,i=0;p&&i<4;p=p.parentElement,i++){
      if(p.tagName==='ASIDE'||p.querySelectorAll('button,select,input,[role="slider"]').length>8)break;
      const heading=p.querySelector(':scope > label, :scope > div > label');
      if(heading && !heading.contains(el))return normal(heading.textContent);
    }
    for (let p = el, i = 0; p && i < 4; p = p.parentElement, i++) {
      if(p.tagName==='ASIDE'||p.querySelectorAll('button,select,input,[role="slider"]').length>8)break;
      const explicit = p.getAttribute('aria-label') || p.querySelector(':scope > label')?.textContent;
      if (explicit) return normal(explicit);
      const texts = [...p.children].filter(n => !n.contains(el) && !n.matches('button,input,textarea,select') && !n.querySelector('button,input,textarea,select,[role="slider"],[role="switch"],[role="combobox"]'))
        .map(n => normal(n.textContent)).filter(t => t && t.length < 90);
      if (texts.length) return texts[0];
    }
    return '';
  }
  // A model control is named by its own field label. The form-wide heading must not
  // name every control below it (observed live: Sound FX's "Model" heading turned its
  // loop switch and Generate button into model controls, so the context followed the
  // switch). label() stays unchanged because stored control identities depend on it.
  function modelLabel(el){
    const own=el.getAttribute('aria-label');
    if(own)return normal(own);
    const legend=el.closest('fieldset')?.querySelector(':scope > legend');
    if(legend)return normal(legend.textContent);
    for(let p=el.parentElement,i=0;p&&i<4;p=p.parentElement,i++){
      if(p.tagName==='ASIDE'||p.querySelectorAll('button,select,input,[role="slider"],[role="switch"],[role="combobox"]').length>2)break;
      const heading=p.querySelector(':scope > label, :scope > div > label');
      if(heading && !heading.contains(el))return normal(heading.textContent);
    }
    return '';
  }
  function modelControls(root) {
    const result = [...root.querySelectorAll('button,select,[role="combobox"]')].filter(el => {
      if(el.getAttribute('aria-hidden')==='true'||!visible(el))return false;
      const cy = el.getAttribute('data-cy') || '';
      if (/setting|attribution|provider|popover|option|help|tour|how-it-works|tooltip|guide/i.test(cy)) return false;
      // Radix selects keep the stable data-cy on a hidden native select beside the
      // visible trigger (observed live: Skin Enhancer version-select).
      const hidden=el.tagName==='SELECT'?null:el.parentElement?.querySelector(':scope > select[aria-hidden="true"][data-cy]');
      return MODEL.test(cy) || MODEL.test(hidden?.getAttribute('data-cy')||'') || /^(model|ai model)$/i.test(modelLabel(el));
    });
    return [...new Set(result)];
  }
  function getContext(root) {
    if(native?.root.isConnected && native.route===location.pathname && !native.outside)return native.context();
    const models = modelControls(root).map(el => {
      // Radix exposes a hidden native select with a stable ID for the visible model control.
      let select=el.tagName==='SELECT'?el:el.parentElement.querySelector(':scope > select');
      if(select && !/^(model|ai model)$/i.test(label(select)) && !MODEL.test(select.getAttribute('data-cy')||''))select=null;
      return normal(select?.value || el.textContent);
    }).filter(Boolean);
    return route() + '::' + (models.join('|') || 'default');
  }
  function identity(c, prop, el, root) {
    const cy = c.vnode?.props?.['data-cy'] || c.attrs?.['data-cy'] || el.getAttribute('data-cy') || '';
    let caption = normal(c.props?.label || c.props?.name);
    if(!caption) for(let p=c.parent,i=0;p&&i<4;p=p.parent,i++) {
      if(p.props?.label||p.props?.name){caption=normal(p.props.label||p.props.name);break;}
    }
    caption ||= label(el);
    // A data-cy identity stays stable when the selected text or its label changes.
    // Repeated generic IDs (for example form-switch) still need their field label.
    const repeated=cy && [...root.querySelectorAll('[data-cy]')].filter(node=>node.getAttribute('data-cy')===cy).length>1;
    const parts = [nameOf(c), cy, cy&&!repeated?'':caption, prop];
    // Identical CSS classes cannot distinguish four sliders. Use their stable label/key hierarchy.
    if (!cy && !caption) {
      for (let p = c, i = 0; p && i < 4; p = p.parent, i++) {
        parts.push(nameOf(p) + ':' + normal(p.vnode?.key));
      }
      const path=[];
      for(let node=el;node&&node!==root;node=node.parentElement){
        path.push(node.tagName+':'+[...node.parentElement.children].indexOf(node));
      }
      parts.push('slot:' + path.reverse().join('/'));
    }
    return parts.join('::');
  }
  function handler(c, prop) {
    const fn = c.vnode?.props?.['onUpdate:' + prop];
    return typeof fn === 'function' || Array.isArray(fn) && fn.every(f => typeof f === 'function') ? fn : null;
  }
  function componentOwners(root) {
    // Production Vue omits development-only DOM component pointers. Its rendered
    // vnode tree is still the source of truth; walk that tree without modifying it.
    const owners=new WeakMap(), visited=new Set();
    let host=root;
    while(host && !host._vnode)host=host.parentElement;
    const walk=(v,owner)=>{
      if(!v || typeof v!=='object' || visited.has(v))return;
      visited.add(v);
      if(v.component){walk(v.component.subTree,v.component);return;}
      if(v.el instanceof Element && root.contains(v.el) && owner)owners.set(v.el,owner);
      if(Array.isArray(v.children))for(const child of v.children)walk(child,owner);
      if(v.suspense?.activeBranch)walk(v.suspense.activeBranch,owner);
    };
    walk(host?._vnode,null);
    return owners;
  }
  function call(fn, value) { for (const f of Array.isArray(fn) ? fn : [fn]) f(value); }
  function valueOf(c, prop) { return prop in c.props ? c.props[prop] : c.vnode?.props?.[prop]; }
  function safeControl(c, prop, el) {
    const nm = nameOf(c), cy = normal(c.attrs?.['data-cy'] || c.vnode?.props?.['data-cy']);
    for(let p=c,i=0;p&&i<5;p=p.parent,i++)if(/StickyTabs|ToolHeader|Navigation|ToolTabs/.test(nameOf(p)))return false;
    if (TRANSIENT.test(prop) || CONTENT.test(prop) || CONTENT.test(nm) || CONTENT.test(cy)) return false;
    if (MODEL.test(cy) || /ModelSelector|ModeSelector|Provider/i.test(nm)) return false;
    if(modelControls(panel()||document.body).includes(el)) return false;
    const input = el.matches('input,textarea,[contenteditable]') ? el : el.querySelector('input,textarea,[contenteditable]');
    const rendered=c.subTree?.el;
    if(rendered instanceof Element && rendered.querySelector('textarea,[contenteditable="true"]') && !CONTROL.test(nm+cy))return false;
    if (input?.matches('textarea,[contenteditable],input[type="password"],input[type="file"],input[type="search"]')) return false;
    if (input?.matches('input:not([type]),input[type="text"]') && !CONTROL.test(nm + cy + label(el))) return false;
    // A real two-way option binding is the criterion; names are not an allowlist.
    // This also accepts new widget types introduced by Magnific.
    return !input || CONTROL.test(nm) || input.matches('input[type="number"],input[type="range"],input[type="color"],input[type="checkbox"],input[type="radio"],input[inputmode="numeric"],input[inputmode="decimal"]')
      || el.matches('select,[role="slider"],[role="switch"],[role="checkbox"],[role="radio"]');
  }
  function store(b, value) {
    if (transition || b.restoring || !b.ready || !context || b.context !== context) return;
    if(!context.startsWith(route()+'::'))return;
    const clean = option(value);
    if (clean === OMIT) return;
    const k = PREFIX + encodeURIComponent(context) + ':' + encodeURIComponent(b.id);
    const old = GM_getValue(k, null);
    if (!old || !equal(old.value, clean)) GM_setValue(k, {value:clone(clean), version:3});
  }
  function wrap(b) {
    const props = b.c.vnode?.props;
    if (!props) return;
    const key = 'onUpdate:' + b.prop, original = props[key];
    if (!original || original === b.wrapper) return;
    b.original = original;
    b.wrapper = value => {
      call(original, value);
      store(b, value); // The update event saves synchronously, including slider dragging.
    };
    props[key] = b.wrapper;
  }
  async function restore(b) {
    const ticket = ++b.ticket, ctx = context, userRevision = revision;
    b.context = ctx; b.restoring = true; b.ready = false;
    const record = GM_getValue(PREFIX + encodeURIComponent(ctx) + ':' + encodeURIComponent(b.id), null);
    if (record && option(record.value) !== OMIT) {
      for (let i = 0; i < 4; i++) {
        if (ticket !== b.ticket || ctx !== context || userRevision !== revision || !b.el.isConnected) return;
        const fn = handler(b.c, b.prop);
        if (fn && !equal(valueOf(b.c, b.prop), record.value)) call(fn, clone(record.value));
        await nextTick();
      }
    } else for(let i=0;i<4;i++)await nextTick();
    if (ticket !== b.ticket || ctx !== context) return;
    b.restoring = false; b.ready = true;
    // Remember a model's initial values as well as edits made after opening it.
    if(!record)store(b,valueOf(b.c,b.prop));
  }
  function attach(c, prop, el, root) {
    let props = byComponent.get(c);
    if (!props) { props = new Map(); byComponent.set(c, props); }
    let b = props.get(prop);
    if (b) { wrap(b); if (b.context !== context) void restore(b); return; }
    const value = option(valueOf(c, prop));
    if (value === OMIT) return;
    b = {c,prop,el,id:identity(c,prop,el,root),context:'',ready:false,restoring:false,ticket:0};
    props.set(prop,b); bindings.set(c.uid + ':' + prop,b);
    wrap(b);
    b.stop = watch(() => valueOf(c, prop), value => { wrap(b); store(b,value); }, {deep:true,flush:'sync'});
    void restore(b);
  }
  // A model switch keeps settings writes closed until the scan has moved the
  // bindings to the new context. A timer alone is not enough: in a throttled
  // (background) tab it can fire before that scan, and the app's reset of the
  // new model would then be written to the previous model's record.
  function endTransition(ticket){
    if(ticket!==transitionRevision)return;
    const root=panel();
    if(root&&context&&getContext(root)!==context){queue();setTimeout(()=>endTransition(ticket),250);return;}
    transition=false;queue();
  }
  function guardModel(c,prop){
    if(!/^(modelValue|value|modelId|mode|selected|selectedModel)$/.test(prop))return;
    const props=c.vnode?.props,key='onUpdate:'+prop,original=props?.[key];
    if(!original||modelBindings.get(c)?.[prop]===original)return;
    const wrapper=value=>{
      transition=true;const ticket=++transitionRevision;
      call(original,value);queue();
      setTimeout(()=>endTransition(ticket),1000);
    };
    let map=modelBindings.get(c);if(!map){map={};modelBindings.set(c,map);}
    map[prop]=wrapper;props[key]=wrapper;
  }
  async function load() {
    if (loading) return loading;
    loading = (async () => {
      const entry = [...document.querySelectorAll('script[src]')].map(el=>el.src)
        .find(src=>/^https:\/\/cdn\.magnific\.com\/ait\/assets\/index\./.test(src));
      if (!entry) throw Error('Uygulama henüz yüklenmedi');
      const source = await (await fetch(entry,{credentials:'omit'})).text();
      const path = source.match(/import\s*["']([^"']+)["']/)?.[1];
      if (!path) throw Error('Uygulama giriş dosyası bulunamadı');
      const mainUrl=new URL(path,entry).href;
      const core = await import(mainUrl);
      if (typeof core.sp !== 'function' || typeof core.Rf !== 'function') throw Error('Uygulama sürümü değişmiş');
      watch=core.sp; nextTick=core.Rf;
      application={core,mainUrl,asset:async prefix=>{
        application.source ||= await (await fetch(mainUrl,{credentials:'omit'})).text();
        const escaped=prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const match=application.source.match(new RegExp('assets/('+escaped+'\\.[^"`]+?\\.v2\\.js)'));
        if(!match)throw Error('Ayar modülü bulunamadı: '+prefix);
        return new URL(match[1],mainUrl).href;
      }};
    })().catch(error => {loading=null;throw error;});
    return loading;
  }
  function stateOption(key,value){
    // A LUT selection is kept as its identifier and short labels only: the LUT
    // file, its URL and its owner are never stored. The identifier alone is
    // enough for the tool to fetch the LUT data again.
    if(key==='selectedLut'){
      if(value===null)return null;
      if(!value||!['string','number'].includes(typeof value.id))return OMIT;
      const name=option(value.name),category=option(value.category);
      return {id:value.id,...(name===OMIT?{}:{name}),...(category===OMIT?{}:{category})};
    }
    if(TRANSIENT.test(key))return OMIT;
    // Catalogs the tool ships (relightPresets, lightTransferPresets, ...) are not
    // user choices; the selected entry lives in its own field (activePresetId).
    if(/^(?:available.*|(?!selected|active)\w*presets)$|(?:Options|SliderConfig)$/i.test(key))return OMIT;
    // Free text fields are named after their content (astraPrompt, systemPrompt,
    // lyrics...). Boolean switches such as smartPrompt stay ordinary settings.
    if(/(?:prompt|instructions?|script|caption|description|lyrics)$/i.test(key)&&value!==null&&typeof value!=='boolean')return OMIT;
    // References to the user's own assets and form mode switches are not settings.
    if(/brandKit|^voices$|^is[A-Z]\w*Mode$/.test(key))return OMIT;
    // Observed live: the multi-shot prompt mode only exists together with its shots,
    // which are content and are not kept by the app across reloads. Restoring the
    // mode alone leaves the form in multi-shot mode with no shots.
    if(key==='promptType'&&value==='multishot')return OMIT;
    if(/^(canvas|canvasNode|artboard|currentImage|inputImage|outputImages|selectedPreview)$/i.test(key))return OMIT;
    if(/^(mediaType|videoDuration|videoFps|isVideoTrimmed|isVideoTrimming)$/i.test(key))return OMIT;
    if(/^(model|modelId|modelIds|draftId|prompt|negativePrompt|instructions|additionalInstructions|script|text|description|caption)$/i.test(key))return OMIT;
    if(/instruction|reference|upload|file|url|token|secret|password|creation|projectId|userId|loading|pending|generating|error|startFrame|endFrame|sketchImage/i.test(key))return OMIT;
    return option(value);
  }
  // A mixed structure may contain editable settings beside prompts or references.
  // Save its safe leaves separately and restore only existing locations, preserving content.
  function settingLeaves(value,path,out,depth=0){
    if(depth>4||!value||typeof value!=='object')return;
    const entries=Array.isArray(value)?value.slice(0,32).map((v,i)=>[i,v]):Object.entries(value).slice(0,24);
    for(const [key,item]of entries){
      if(typeof key==='string'&&(/^(id|name|label|__proto__|prototype|constructor)$/i.test(key)||stateOption(key,null)===OMIT||CONTENT.test(key)))continue;
      const next=[...path,key],clean=stateOption(String(key),item);
      if(clean!==OMIT)out['partial::'+JSON.stringify(next)]=clean;
      else if(item&&typeof item==='object')settingLeaves(item,next,out,depth+1);
    }
  }
  // Image/Video generators have a multi-model mode (modelIds). Its settings belong
  // to that selection, not to the primary modelId, whose single-model record the
  // app's mode-switch resets would otherwise overwrite.
  function modelSelection(state){
    const ids=Array.isArray(state.modelIds)?state.modelIds.filter(id=>typeof id==='string'&&id):[];
    return ids.length?'multi::'+[...new Set(ids)].sort().join('+'):state.modelId;
  }
  // The real form instance is identified by its owning component's id prop. Several
  // tools reuse the image generator form markup under their own id (observed live:
  // Cinematic Shot renders ImageGeneratorForm id="cinematic-shot").
  function ownerFormId(root,el,pattern){
    for(let c=componentOwners(root).get(el);c;c=c.parent)if(c.props?.id&&pattern.test(nameOf(c)))return c.props.id;
    return null;
  }
  async function connectState(root){
    if(nativeLoading)return;
    const inRoot=root.querySelector('[data-cy="image-generator-form"],[data-cy="video-generator-panel"],[data-cy="enhance-v2-panel"],[data-cy="edit-bar"],[data-cy="audio-generator-form"],[data-cy="audio-generator-panel"],[data-cy="music-generator-form"],[data-cy="voiceover-generator-panel"],[data-cy="relight-mode-toggle"],[data-cy="video-upscaler-type-tabs"],[data-cy="video-modify-form-model-selector"],#adjust-panel');
    // Clip Editor renders the Modify bar outside the tools sidebar that holds the
    // other settings (observed live). It keeps its own context; the sidebar stays generic.
    const outsideForm=inRoot?null:document.querySelector('[data-cy="video-modify-form-model-selector"]');
    const form=inRoot||outsideForm;
    if(!form)return;
    if(native?.root===form)return;
    native?.stop();native=null;nativeLoading=true;
    try{
      const {core,asset}=application;
      let api,state,model,tool;
      if(form.matches('[data-cy="image-generator-form"]')){
        tool='image';const formId=ownerFormId(root,form,/^ImageGeneratorForm$/);
        if(!formId)throw Error('Görsel formu kimliği bulunamadı');
        const mod=await import(await asset('useImageGeneratorForm'));
        api=mod.t(formId);state=api.imageGeneratorFormState;model=()=>modelSelection(state);
      }else if(form.matches('[data-cy="video-generator-panel"]')){
        tool='video';const mod=await import(await asset('useVideoGeneratorForm'));
        api=mod.t(core.Os);state=api.videoGeneratorFormState;model=()=>modelSelection(state);
      }else if(form.matches('[data-cy="audio-generator-form"],[data-cy="audio-generator-panel"],[data-cy="music-generator-form"],[data-cy="voiceover-generator-panel"]')){
        const music=form.matches('[data-cy="music-generator-form"]'),voice=form.matches('[data-cy="voiceover-generator-panel"]');tool=voice?'voice':music?'music':'audio';
        const owners=componentOwners(root);let owner=owners.get(form),formId;
        for(let c=owner;c;c=c.parent)if(c.props?.id&&new RegExp(voice?'VoiceoverForm':music?'MusicGeneratorForm':'AudioGeneratorForm').test(nameOf(c))){formId=c.props.id;break;}
        if(!formId)throw Error('Form kimliği bulunamadı');
        const mod=await import(await asset(voice?'useVoiceoverForm':music?'useMusicGeneratorForm':'useAudioGeneratorForm'));
        api=mod.t(formId);state=voice?api.voiceoverFormState:music?api.musicFormState:api.audioGeneratorFormState;model=voice?()=>api.currentModel.value?.provider:()=>state.modelId;
      }else if(form.matches('[data-cy="relight-mode-toggle"]')){
        tool='relight';const owners=componentOwners(root);let owner=owners.get(form),formId;
        for(let c=owner;c;c=c.parent)if(c.props?.id&&/RelightToolForm/.test(nameOf(c))){formId=c.props.id;break;}
        if(!formId)throw Error('Işık formu kimliği bulunamadı');
        const mod=await import(await asset('useRelightToolForm'));
        api=mod.t(formId);state=api;model=()=> 'default';
      }else if(form.matches('[data-cy="video-upscaler-type-tabs"]')){
        tool='video-upscale';const owners=componentOwners(root);let owner=owners.get(form),formId;
        for(let c=owner;c;c=c.parent)if(c.props?.id&&/VideoUpscalerToolForm/.test(nameOf(c))){formId=c.props.id;break;}
        if(!formId)throw Error('Video iyileştirme formu kimliği bulunamadı');
        const mod=await import(await asset('useVideoUpscaleForm'));
        api=mod.i(formId);state=api.form;model=()=>state.mode+(state.mode==='topaz'?'::'+state.enhancementModel:'');
      }else if(form.matches('[data-cy="video-modify-form-model-selector"]')){
        tool='video-modify';const owners=componentOwners(outsideForm?(document.getElementById('app')||document.body):root);let owner=owners.get(form),formId;
        for(let c=owner;c;c=c.parent)if(c.props?.id&&/^(?:VideoModifyToolForm|VideoModifyModelSelector)$/.test(nameOf(c))){formId=c.props.id;break;}
        if(!formId)throw Error('Video düzenleme formu kimliği bulunamadı');
        const mod=await import(await asset('useVideoModifyForm'));
        api=mod.n(formId);state=api;model=()=>api.model.value;
      }else if(form.matches('#adjust-panel')){
        tool='adjust';const mod=await import(await asset('useGlobalCanvasRetouch'));
        api=mod.m();state=api;model=()=> 'adjust';
      }else if(form.matches('[data-cy="edit-bar"]')){
        tool='editor';const mod=await import(await asset('useImageGeneratorForm'));
        api=mod.t('talk-to-image');state=api.imageGeneratorFormState;model=()=>modelSelection(state);
      }else{
        tool='upscale';
        const componentUrl=await asset('SingleCanvasUpscale');
        const componentSource=await (await fetch(componentUrl,{credentials:'omit'})).text();
        const dependency=componentSource.match(/from\s*["']\.\/(types\.[^"']+\.v2\.js)["']/)?.[1];
        if(!dependency)throw Error('İyileştirme ayar kaynağı bulunamadı');
        const mod=await import(new URL(dependency,componentUrl).href);
        api=mod.n('upscale-panel');state=api;const modes=mod.i('upscale-panel');model=()=>modes.mode.value;
      }
      if(!form.isConnected||!state||!model())return;
      const unlimited=core.$().isUnlimitedModeEnabled;
      const refValue=v=>v?.__v_isRef?v.value:v;
      const stateValues=()=>refValue(state);
      const snapshot=()=>{
        const values={};for(const [key,item]of Object.entries(stateValues())){
          if(['upscale','relight','adjust','video-modify'].includes(tool)&&!item?.__v_isRef&&!item?.__v_isReactive)continue;
          if(item?.__v_isRef&&item.__v_isReadonly)continue;
          if(tool==='video-upscale'&&['mode','enhancementModel'].includes(key))continue;
          const value=refValue(item),clean=stateOption(key,value);
          if(clean!==OMIT)values[key]=clean;
          else if(stateOption(key,null)!==OMIT)settingLeaves(value,[key],values);
        }
        // While shots are edited the video duration is their derived total, not a choice.
        if(tool==='video'&&refValue(stateValues().promptType)==='multishot')delete values.duration;
        if(tool==='adjust'&&api.currentImage?.value){
          values.flipX=!!api.currentImage.value.flipX;values.flipY=!!api.currentImage.value.flipY;
        }
        if(unlimited)values.unlimitedMode=unlimited.value;
        return values;
      };
      const ctx=()=>route()+'::'+model();
      const storage=(id,key)=>PREFIX+encodeURIComponent(id)+':'+encodeURIComponent('state::'+key);
      let id=ctx(),restoring=true,ticket=0,previous={},flipped=new Set(),pendingFlips=new Set(),settle=null;
      const save=()=>{
        if(restoring||!form.isConnected||id!==ctx())return;
        const current=snapshot();
        // Observed in Firefox: after a model switch the app applies the new model's
        // defaults later than the restore passes, over the restored values. Until
        // the user edits or the settle window closes, such a change is not a
        // choice: put the restored record back and do not save the defaults.
        if(settle&&(settle.id!==id||settle.revision!==revision||performance.now()>=settle.until))settle=null;
        const drift=settle?Object.keys(settle.record).filter(key=>key in current&&!equal(current[key],settle.record[key])):[];
        if(drift.length){
          for(const [key,value]of Object.entries(current))if(!drift.includes(key)&&!equal(previous[key],value)){GM_setValue(storage(id,key),{value:clone(value),version:3});previous[key]=value;}
          const my=ticket,record=settle.record;restoring=true;
          void (async()=>{
            await Promise.resolve();
            try{if(my===ticket&&id===ctx()&&form.isConnected){apply(record);await nextTick();}}
            finally{if(my===ticket){restoring=false;previous=snapshot();}}
          })();
          return;
        }
        for(const [key,value]of Object.entries(current))if(!equal(previous[key],value))GM_setValue(storage(id,key),{value:clone(value),version:3});
        previous=current;
      };
      const apply=record=>{
        const flag=api.isSettingFormProgrammatically,oldFlag=flag?.value;
        if(flag?.__v_isRef)flag.value=true;
        try{for(const [key,value]of Object.entries(record)){
          const target=stateValues();
          if(key.startsWith('partial::')){
            let path;try{path=JSON.parse(key.slice(9));}catch{continue;}
            if(!Array.isArray(path)||path.length>5||path.some(p=>/^(?:__proto__|prototype|constructor)$/.test(String(p))))continue;
            let parent=target;for(const part of path.slice(0,-1)){parent=refValue(parent?.[part]);if(!parent||typeof parent!=='object')break;}
            const leaf=path.at(-1);
            if(parent&&typeof parent==='object'&&leaf in parent&&stateOption(String(leaf),value)!==OMIT)parent[leaf]=clone(value);
            continue;
          }
          if(key==='unlimitedMode'&&unlimited){if(typeof value==='boolean')unlimited.value=value;continue;}
          if(tool==='adjust'&&/^flip[XY]$/.test(key)&&typeof value==='boolean'){
            // The tool flips through its own api, which silently no-ops while its
            // canvas ref is unset. Issue each axis once per restore pass and only
            // when the call can take effect; a flip that could not land yet stays
            // pending for the periodic reconciliation instead of being dropped for
            // the rest of this page load.
            const image=api.currentImage?.value;
            if(image&&!!image[key]!==value){
              if(api.canvas?.value&&!flipped.has(key)){flipped.add(key);api.flip(key.slice(-1));}
              else if(value&&!flipped.has(key))pendingFlips.add(key);
            }
            continue;
          }
          if(!(key in target)||stateOption(key,value)===OMIT)continue;
          const current=refValue(target[key]);
          if(equal(current,value))continue;
          if(target[key]?.__v_isRef)target[key].value=clone(value);
          else if(current?.__v_isReactive&&!Array.isArray(current)&&value&&typeof value==='object')Object.assign(current,clone(value));
          else target[key]=clone(value);
        }}finally{if(flag?.__v_isRef)flag.value=oldFlag;}
      };
      const restore=async()=>{
        const my=++ticket,userRevision=revision;restoring=true;settle=null;id=ctx();if(!outsideForm)context=id;flipped=new Set();pendingFlips=new Set();
        const available=snapshot(),record={};
        const old=GM_getValue('magnific-model-memory-v2:model:'+tool+'::'+model(),null);
        for(const key of Object.keys(available)){
          const saved=GM_getValue(storage(id,key),null);
          if(saved&&stateOption(key,saved.value)!==OMIT)record[key]=saved.value;
          else if(old?.settings&&key in old.settings&&stateOption(key,old.settings[key])!==OMIT)record[key]=old.settings[key];
          else if(key==='unlimitedMode'&&typeof old?.unlimited==='boolean')record[key]=old.unlimited;
        }
        for(let i=0;i<4;i++){
          if(my!==ticket||userRevision!==revision||id!==ctx()||!form.isConnected)return;
          apply(record);await nextTick();
        }
        if(my!==ticket||id!==ctx())return;
        restoring=false;previous=snapshot();
        if(Object.keys(record).length)settle={id,revision:userRevision,until:performance.now()+SETTLE_MS,record};
        for(const [key,value]of Object.entries(previous))if(GM_getValue(storage(id,key),null)===null)GM_setValue(storage(id,key),{value:clone(value),version:3});
        transition=false;queue();
      };
      const stopModel=watch(model,()=>void restore(),{flush:'sync'});
      const stopImage=tool==='adjust'&&api.currentImage?.__v_isRef?watch(api.currentImage,()=>void restore(),{flush:'post'}):()=>{};
      const stopSettings=watch(()=>JSON.stringify(snapshot()),save,{flush:'sync'});
      // The mirrored flip lives on the canvas image object, which is not
      // necessarily reactive, so a flip can miss the state watcher. Reconcile
      // those two booleans during the periodic scan and never before a record
      // and an observed baseline exist.
      const syncFlips=()=>{
        if(tool!=='adjust'||restoring||!form.isConnected||id!==ctx())return;
        const image=api.currentImage?.value;
        if(!image)return;
        for(const key of ['flipX','flipY']){
          const value=!!image[key],record=GM_getValue(storage(id,key),null);
          if(!record||!(key in previous))continue;
          // A saved flip whose restore call could not land yet (the canvas ref
          // was unset while the passes ran) is retried once the canvas exists.
          // previous===false pins this to boots where the flip never landed, so
          // a user's later unflip is still saved rather than fought.
          if(value===false&&record.value===true&&previous[key]===false&&pendingFlips.has(key)&&api.canvas?.value){
            api.flip(key.slice(-1));
            if(!!api.currentImage.value?.[key]===true){pendingFlips.delete(key);previous[key]=true;}
            continue;
          }
          if(previous[key]===value)continue;
          GM_setValue(storage(id,key),{value,version:3});previous[key]=value;
        }
      };
      native={root:form,outside:!!outsideForm,route:location.pathname,context:ctx,snapshot,syncFlips:tool==='adjust'?syncFlips:null,stop:()=>{ticket++;stopModel();stopImage();stopSettings();},cancel:()=>{ticket++;restoring=false;settle=null;previous=snapshot();}};
      await restore();
    }catch(error){console.warn('[Magnific ayar hafızası] Ayar kaynağı bağlantısı:',error.message);}
    finally{nativeLoading=false;}
  }
  async function scan() {
    queued=false;
    if (stopped) return;
    const root=panel();
    if (!root || !visible(root)) return;
    if (!watch) {try {await load();root.removeAttribute('data-magnific-memory-error');} catch(error) {root.setAttribute('data-magnific-memory-error',String(error.message).slice(0,180));return;}}
    if(native && (!native.root.isConnected||native.route!==location.pathname)){native.stop();native=null;}
    await connectState(root);
    if(native&&native.route===location.pathname)native.syncFlips?.();
    const ctx=getContext(root);
    if (context !== ctx) {context=ctx; transition=false; for(const b of bindings.values()) if(b.el.isConnected) void restore(b);}
    for (const [key,b] of bindings) if (!b.el.isConnected || b.c.isUnmounted) {b.stop();b.ticket++;bindings.delete(key);}
    const seen=new Set();
    const owners=componentOwners(root);
    const modelElements=new Set(modelControls(root));
    // For native state sources there is one authoritative record. Replaying stale
    // widget records from a previously closed popover would overwrite newer state.
    if(native&&!native.outside)for(const [key,b]of bindings)if(root.contains(b.el)){b.stop();b.ticket++;bindings.delete(key);}
    for (const el of root.querySelectorAll('input,select,button,[role="slider"],[role="switch"],[role="checkbox"],[role="radio"],[role="combobox"]')) {
      if (!visible(el)) continue;
      if(native&&!native.outside)continue;
      let owner=owners.get(el)||el.__vueParentComponent;
      if(!owner)for(let p=el.parentElement;p&&root.contains(p)&&!owner;p=p.parentElement)owner=owners.get(p);
      // Observed live: a tool renders controls before its own marker exists, and the
      // generic pass captured them under a model-less context. A tool that owns a
      // state source owns its controls too, marker or not.
      let nativeTool=false;
      for(let p=owner;p&&!nativeTool;p=p.parent)nativeTool=NATIVE_FORM.test(nameOf(p));
      for (let c=owner,i=0;c && i<32;c=c.parent,i++) {
        const node=c.subTree?.el;
        if (node instanceof Element && node !== root && !root.contains(node)) continue;
        if (seen.has(c)) continue;
        seen.add(c);
        for (const key of Object.keys(c.vnode?.props||{})) {
          if (!key.startsWith('onUpdate:')) continue;
          const prop=key.slice(9);
          if(modelElements.has(el)){guardModel(c,prop);continue;}
          if(nativeTool)continue;
          if (handler(c,prop) && safeControl(c,prop,el)) attach(c,prop,el,root);
        }
      }
    }
    await nextTick();
    root.setAttribute('data-magnific-memory-ready','generic-v3');
    root.setAttribute('data-magnific-memory-controls',String(bindings.size));
    root.setAttribute('data-magnific-memory-context',context);
    // Diagnostics expose control identities, never prompt or reference content.
    root.setAttribute('data-magnific-memory-inventory',JSON.stringify([...bindings.values()].filter(b=>b.el.isConnected).map(b=>({id:b.id,property:b.prop,value:option(valueOf(b.c,b.prop)),ready:b.ready}))));
    if(native)root.setAttribute('data-magnific-memory-state-inventory',JSON.stringify(native.snapshot()));
    else root.removeAttribute('data-magnific-memory-state-inventory');
    if(native?.outside)root.setAttribute('data-magnific-memory-native-context',native.context());
    else root.removeAttribute('data-magnific-memory-native-context');
  }
  function queue() {
    if(scanRunning){scanAgain=true;return;}
    if(!queued){queued=true;setTimeout(async()=>{
      scanRunning=true;
      try{await scan();}finally{scanRunning=false;if(scanAgain){scanAgain=false;queue();}}
    },50);}
  }
  function edit(event) {
    if (!event.isTrusted) return;
    // Keyboard changes of sliders, switches and options are user edits too; typing
    // text or moving focus is not.
    if (event.type==='keydown'&&!/^(?:Arrow\w+|Page(?:Up|Down)|Home|End| |Enter)$/.test(event.key))return;
    if (event.type==='keydown'&&event.target instanceof Element&&event.target.closest('textarea,[contenteditable]:not([contenteditable="false"]),input:not([type="range"]):not([type="number"]):not([type="checkbox"]):not([type="radio"])'))return;
    const root=panel();
    if (!root) return;
    const t=event.target instanceof Element?event.target:null;
    if (!t) return;
    const model=modelControls(root).find(el=>{
      const id=el.getAttribute('aria-controls');
      return el.contains(t) || id && document.getElementById(id)?.contains(t);
    });
    if (model && !model.contains(t) || model?.tagName==='SELECT' && event.type==='change') {
      transition=true; const ticket=++transitionRevision;
      setTimeout(()=>endTransition(ticket),1000);
      return;
    }
    if (!root.contains(t) && !t.closest('[role="dialog"],[role="listbox"]')) return;
    revision++;
    native?.cancel();
    for(const b of bindings.values()) if(b.restoring){b.ticket++;b.restoring=false;b.ready=true;}
  }
  // Earlier builds could store tool catalogs, free-text fields and asset
  // references under state records. Remove only records that the current rules
  // reject, once per rule revision; control and v2 records are left untouched.
  function cleanup(){
    if(typeof GM_listValues!=='function'||typeof GM_deleteValue!=='function')return;
    const mark='magnific-model-memory-v3:meta:cleanup',revisionOfRules=2;
    if(GM_getValue(mark,0)>=revisionOfRules)return;
    for(const k of GM_listValues()){
      if(typeof k!=='string'||!k.startsWith(PREFIX))continue;
      let field;try{field=decodeURIComponent(k.slice(k.lastIndexOf(':')+1));}catch{continue;}
      if(!field.startsWith('state::'))continue;
      const name=field.slice(7);let reject;
      if(name.startsWith('partial::')){
        let path;try{path=JSON.parse(name.slice(9));}catch{continue;}
        reject=!Array.isArray(path)||path.some(part=>typeof part==='string'&&stateOption(part,null)===OMIT);
      }else reject=stateOption(name,GM_getValue(k,null)?.value)===OMIT;
      if(reject)GM_deleteValue(k);
    }
    GM_setValue(mark,revisionOfRules);
  }
  try{cleanup();}catch(error){console.warn('[Magnific ayar hafızası] Eski kayıt temizliği:',error.message);}
  const observer=new MutationObserver(queue);
  observer.observe(document.documentElement||document,{childList:true,subtree:true,attributes:true,attributeFilter:['value','aria-valuenow','aria-checked','data-state']});
  for(const type of ['pointerdown','keydown','input','change']) document.addEventListener(type,edit,true);
  const interval=setInterval(queue,500); // Components also rerender without replacing DOM nodes.
  window.addEventListener('pagehide',()=>{stopped=true;observer.disconnect();clearInterval(interval);clearTimeout(revealTimeout);native?.stop();for(const b of bindings.values())b.stop();});
  queue();
})();
