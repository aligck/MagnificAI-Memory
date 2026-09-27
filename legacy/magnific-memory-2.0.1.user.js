// ==UserScript==
// @name         Magnific — Tüm Modellerin Ayar Hafızası
// @namespace    magnific-model-memory
// @version      2.0.1
// @description  Model ayarlarını anında kaydeder; menü açmadan uygulamanın gerçek ayarlarına geri yükler.
// @match        https://magnific.ai/*
// @match        https://*.magnific.ai/*
// @match        https://magnific.com/*
// @match        https://*.magnific.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @sandbox      raw
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';
  const STORE = 'magnific-model-memory-v2:model:';
  const ROOT = '[data-cy="image-generator-form"], [data-cy="video-generator-panel"]';
  const IMAGE = ['aspectRatio', 'customDimensions', 'resolution', 'quality', 'creativity', 'thinkingLevel',
    'useGoogleSearchTool', 'transparentBackground', 'variant', 'tier', 'numberOfImages', 'draftTileCount',
    'seed', 'smartPrompt', 'magnificSubmode', 'cinematicControls', 'loraScale', 'numInferenceSteps', 'guidanceScale'];
  const VIDEO = ['resolution', 'aspectRatio', 'cameraMotion', 'duration', 'seed', 'withSoundEffects', 'noMusic',
    'promptType', 'promptMode', 'promptEnhanced', 'autoModeDuration', 'multishotDurationControl', 'videoCount',
    'audioSetting', 'outputFormat', 'extendMode', 'characterOrientation', 'talkingVideosLipsyncModelId', 'talkingVideosResolution'];
  const KNOWN = new Set([...IMAGE, ...VIDEO]);
  const EXCLUDED = new Set(['modelId', 'modelIds', 'draftId', 'isTalkingVideosMode', 'prompt', 'negativePrompt',
    'references', 'customReferences', 'externalReferencesForValidation', 'startFrame', 'endFrame', 'sketchImage',
    'colorPalette', 'voices', 'multiShots', 'brandKitId', 'brandKitTemplateSlug', 'magnificOneStyleSelection',
    'magnificOneQualitySource', 'talkingVideosScript', 'talkingVideosVoiceId', 'talkingVideosGeneratedAudioUrl']);
  const OMIT = Symbol('omit');
  function settingName(name) {
    if (EXCLUDED.has(name)) return false;
    if (KNOWN.has(name)) return true;
    return !/prompt|description|caption|script|reference|upload|file|url|thumbnail|token|secret|password|creationId|projectId|userId|brandKit|loading|pending|generating|error/i.test(name);
  }
  function optionValue(value, depth = 0) {
    if (value === null || typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number' && Number.isFinite(value)) return value;
    if (depth >= 4 || typeof value !== 'object') return OMIT;
    if (Array.isArray(value)) return value.every(item => item === null || ['string','number','boolean'].includes(typeof item)) ? [...value] : OMIT;
    if (Object.prototype.toString.call(value) !== '[object Object]') return OMIT;
    const entries = Object.entries(value).filter(([name]) => settingName(name)).map(([name, item]) => [name, optionValue(item, depth + 1)]).filter(([, item]) => item !== OMIT);
    return entries.length ? Object.fromEntries(entries) : OMIT;
  }
  function settings(state) {
    return Object.fromEntries(Object.entries(state).filter(([name]) => settingName(name)).map(([name, value]) => [name, optionValue(value)]).filter(([, value]) => value !== OMIT));
  }
  function mergeOption(current, saved) {
    if (saved && !Array.isArray(saved) && typeof saved === 'object') {
      const merged = current && !Array.isArray(current) && typeof current === 'object' ? {...current} : {};
      for (const [name, value] of Object.entries(saved)) if (settingName(name)) merged[name] = mergeOption(merged[name], value);
      return merged;
    }
    return copy(saved);
  }
  const key = (tool, id) => STORE + tool + '::' + id;
  const copy = value => JSON.parse(JSON.stringify(value));
  const pick = (state, names) => Object.fromEntries(names.filter(name => state[name] !== undefined)
    .map(name => [name, copy(state[name])]));
  const read = (tool, id) => GM_getValue(key(tool, id), null);
  function write(tool, id, value) {
    const name = key(tool, id);
    if (JSON.stringify(GM_getValue(name, null)) !== JSON.stringify(value)) GM_setValue(name, value);
  }

  // Seed Magnific's own persisted defaults before its application initializes.
  function preload() {
    try {
      const current = JSON.parse(localStorage.getItem('imageGenerator.modelId') || 'null')?.value;
      const saved = current && read('image', current);
      if (saved) {
        for (const field of ['aspectRatio', 'customDimensions', 'resolution', 'quality', 'thinkingLevel', 'numberOfImages', 'smartPrompt']) {
          if (saved.settings[field] !== undefined) localStorage.setItem('imageGenerator.' + (field === 'thinkingLevel' ? 'thinkingLevel-v2' : field),
            JSON.stringify({value: saved.settings[field], meta:{expiration:null}}));
        }
        const preferences = JSON.parse(localStorage.getItem('imageGenerator.modelPreferences') || 'null')?.value || {};
        preferences[current] = {...preferences[current], ...pick(saved.settings, ['resolution','quality','creativity','thinkingLevel','numberOfImages'])};
        localStorage.setItem('imageGenerator.modelPreferences', JSON.stringify({value:preferences,meta:{expiration:null}}));
        localStorage.setItem('imageGenerator.smartPromptExplicit', JSON.stringify({value:true,meta:{expiration:null}}));
        localStorage.setItem('imageGenerator.numberOfImagesExplicit', JSON.stringify({value:true,meta:{expiration:null}}));
        localStorage.setItem('imageGenerator.aspectRatioExplicit', JSON.stringify({value:true,meta:{expiration:null}}));
      }
    } catch (error) { console.warn('[Magnific ayar hafızası] İlk değerler hazırlanamadı:', error); }
  }
  preload();
  let corePromise, busy = false, connectedRoot, disconnect;
  const style = document.createElement('style');
  style.textContent = `${ROOT.split(',').map(s => s.trim() + ':not([data-magnific-memory-ready])').join(',')} { visibility:hidden; }`;
  function release() {
    document.querySelectorAll(ROOT).forEach(root => root.setAttribute('data-magnific-memory-ready', 'true'));
  }
  let bootFinished = false;
  const safety = setTimeout(() => { bootFinished = true; style.remove(); release(); }, 6000);
  (document.head || document.documentElement)?.append(style);

  async function application() {
    if (!corePromise) corePromise = (async () => {
      const entry = [...document.querySelectorAll('script[src]')].map(el => el.src)
        .find(src => /^https:\/\/cdn\.magnific\.com\/ait\/assets\/index\./.test(src));
      if (!entry) throw Error('Uygulama dosyası henüz hazır değil');
      const loader = await (await fetch(entry, {credentials:'omit'})).text();
      const mainPath = loader.match(/import\s*["']([^"']+)["']/)?.[1];
      if (!mainPath) throw Error('Uygulama giriş dosyası bulunamadı');
      const mainUrl = new URL(mainPath, entry).href;
      const source = await (await fetch(mainUrl, {credentials:'omit'})).text();
      function url(prefix) {
        const match = source.match(new RegExp('assets/(' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.[^"`]+?\\.v2\\.js)'));
        if (!match) throw Error(prefix + ' bulunamadı');
        return new URL(match[1], mainUrl).href;
      }
      const core = await import(mainUrl);
      if (typeof core.sp !== 'function' || typeof core.Rf !== 'function') throw Error('Ayar bağlantısı sürümle uyumsuz');
      return {core, url};
    })().catch(error => { corePromise = null; throw error; });
    return corePromise;
  }

  function legacy(tool, root) {
    const model = root.querySelector(tool === 'image' ? '[data-cy="tti-mode-selector-v3-trigger"]' : '[data-cy="video-model-selector-trigger"]');
    const modelName = model?.textContent.replace(/\s+/g, ' ').trim();
    const oldKey = location.pathname.replace(/\/$/, '') + '::' + modelName;
    const old = GM_getValue('magnific-model-memory-v1:model:' + oldKey,
      GM_getValue('magnific-model-memory-v1', {})?.[oldKey]);
    if (!old) return null;
    const settings = {};
    if (old.count != null) settings[tool === 'image' ? 'numberOfImages' : 'videoCount'] = old.count;
    if (tool === 'image' && old.smartPrompt !== undefined) settings.smartPrompt = old.smartPrompt;
    for (const menu of old.menus || []) {
      const cy = menu.ref.cy || '', text = menu.summary || '';
      if (/aspect-ratio/.test(cy)) settings.aspectRatio = text;
      if (cy === 'image-output-axes-trigger') {
        const resolution = text.match(/(\d+(?:\.\d+)?)\s*K/i);
        if (resolution) settings.resolution = resolution[1] + 'k';
        if (/\b(Fast|Minimal)\b/i.test(text)) settings.thinkingLevel = 'minimal';
        else if (/\bHigh\b/i.test(text)) settings.thinkingLevel = 'high';
      }
      if (cy === 'video-resolution-option') settings.resolution = text.replace(/p$/i, '') + 'p';
      if (cy === 'video-duration-option') settings.duration = Number(text.replace(/\D/g, ''));
      if (cy === 'video-duration-config-option') settings.autoModeDuration = /Quick/i.test(text) ? 'quick' : /Short/i.test(text) ? 'short' : /Long/i.test(text) ? 'long' : 'extended';
      if (cy === 'prompt-mode-toggle') settings.promptMode = /Auto/i.test(text) ? 'auto' : 'manual';
    }
    for (const field of old.fields || []) if (tool === 'video' && field.ref.cy === 'form-switch') settings.withSoundEffects = field.value;
    for (const panel of Object.values(old.panels || {})) {
      if (!/seed/.test(panel.ref.cy || '')) continue;
      const enabled = panel.fields?.find(field => field.kind === 'checked' || field.kind === 'aria')?.value;
      const seed = panel.fields?.find(field => field.ref.type === 'number')?.value;
      settings.seed = enabled && seed !== undefined ? seed : '';
    }
    return {settings, unlimited: old.unlimited};
  }

  async function connect(root) {
    busy = true;
    try {
      const tool = root.matches('[data-cy="image-generator-form"]') ? 'image' : 'video';
      const {core, url} = await application();
      const module = await import(url(tool === 'image' ? 'useImageGeneratorForm' : 'useVideoGeneratorForm'));
      const api = module.t(tool === 'image' ? 'image-generator-form' : core.Os);
      const state = api[tool === 'image' ? 'imageGeneratorFormState' : 'videoGeneratorFormState'];
      if (!state || !('modelId' in state)) throw Error('Model ayar nesnesi bulunamadı');
      const unlimited = core.$();
      let restoring = false, generation = 0, activeId = state.modelId, userRevision = 0;
      let lastGood = null, stopSave, stopModel;
      const snapshot = () => ({settings:settings(state), unlimited:unlimited.isUnlimitedModeEnabled.value});
      const save = () => {
        if (restoring || !activeId || activeId !== state.modelId) return;
        lastGood = snapshot(); write(tool, activeId, lastGood);
      };
      function apply(record) {
        const oldFlag = api.isSettingFormProgrammatically.value;
        api.isSettingFormProgrammatically.value = true;
        try {
          // Reactive assignments change both the rendered controls and generation settings.
          // No synthetic clicks, opened menus, or DOM-only label replacement.
          for (const [field, value] of Object.entries(record.settings)) {
            if (field in state && settingName(field) && optionValue(value) !== OMIT) {
              const next = mergeOption(state[field], value);
              if (JSON.stringify(state[field]) !== JSON.stringify(next)) state[field] = next;
            }
          }
          if (typeof record.unlimited === 'boolean') unlimited.isUnlimitedModeEnabled.value = record.unlimited;
          if (tool === 'image') {
            core.Bp.set('imageGenerator.smartPromptExplicit', true);
            core.Bp.set('imageGenerator.numberOfImagesExplicit', true);
            core.Bp.set('imageGenerator.aspectRatioExplicit', true);
          }
        } finally { api.isSettingFormProgrammatically.value = oldFlag; }
      }
      async function restore(id, fromLegacy = false) {
        let record = read(tool, id);
        const current = ++generation, revision = userRevision;
        restoring = true; activeId = id;
        if (!record) {
          await core.Rf();
          if (current !== generation || state.modelId !== id) return;
          record = legacy(tool, root);
        }
        if (!record) { restoring = false; save(); return; }
        apply(record);
        // Model handlers run additional constraints after Vue's queued work.
        // Reapply in that queue, before the browser paints; never fight a user's edit.
        for (let i = 0; i < 4; i++) {
          await core.Rf();
          if (current !== generation || state.modelId !== id || revision !== userRevision) return;
          apply(record);
        }
        if (current === generation) {
          restoring = false; save();
          root.setAttribute('data-magnific-memory-state', 'restored-direct');
          root.setAttribute('data-magnific-memory-model', id);
          console.info('[Magnific ayar hafızası] Doğrudan geri yüklendi:', tool, id);
        }
      }
      const edit = event => {
        if (!event.isTrusted || !root.contains(event.target) && !event.target.closest('[role="dialog"], [data-cy*="popover"]')) return;
        if (event.target.closest('[data-cy^="tti-model-selector-popover-model-"]')) return;
        userRevision++;
        if (restoring) { generation++; restoring = false; save(); }
      };
      stopSave = core.sp(() => JSON.stringify(snapshot()), save, {flush:'sync'});
      stopModel = core.sp(() => state.modelId, (id, previous) => {
        if (lastGood && previous) write(tool, previous, lastGood);
        void restore(id);
      }, {flush:'sync'});
      for (const event of ['pointerdown', 'input', 'change']) document.addEventListener(event, edit, true);
      disconnect?.();
      disconnect = () => {
        generation++; stopSave(); stopModel();
        for (const event of ['pointerdown', 'input', 'change']) document.removeEventListener(event, edit, true);
      };
      await restore(state.modelId, true);
      connectedRoot = root;
      root.setAttribute('data-magnific-memory-ready', 'true');
      bootFinished = true; style.remove(); clearTimeout(safety);
      console.info('[Magnific ayar hafızası] 2.0.1 doğrudan ayar bağlantısı hazır:', tool);
    } catch (error) {
      connectedRoot = root;
      root.setAttribute('data-magnific-memory-ready', 'true');
      console.warn('[Magnific ayar hafızası] Doğrudan bağlantı kurulamadı:', error);
    } finally { busy = false; queueMicrotask(check); }
  }
  let checkQueued = false;
  function check() {
    checkQueued = false;
    if (busy) return;
    const root = document.querySelector(ROOT);
    if (root && root !== connectedRoot && document.querySelector('script[src*="/ait/assets/index."]')) void connect(root);
  }
  const observer = new MutationObserver(() => {
    if (!checkQueued) { checkQueued = true; queueMicrotask(check); }
    if (!bootFinished && !style.isConnected && document.head) document.head.append(style);
  });
  observer.observe(document.documentElement || document, {childList:true, subtree:true});
  window.addEventListener('pagehide', () => { observer.disconnect(); disconnect?.(); clearTimeout(safety); });
  check();
})();
