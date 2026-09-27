// ==UserScript==
// @name         Magnific — Tüm Modellerin Ayar Hafızası
// @namespace    magnific-model-memory
// @version      1.0.1
// @description  Her modelin seçeneklerini otomatik kaydeder ve sonraki seçimlerde geri yükler.
// @match        https://magnific.ai/*
// @match        https://*.magnific.ai/*
// @match        https://magnific.com/*
// @match        https://*.magnific.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';
  const STORE = 'magnific-model-memory-v1';
  const MODEL = '[data-cy="tti-mode-selector-v3-trigger"], [data-cy="video-model-selector-trigger"], #image-mode-selector-image-generator-form, #aiModelApi, select[name="model"]';
  const FIELDS = 'input, select, [role="switch"], [role="checkbox"], [role="radio"]';
  const CONTROLS = FIELDS + ', button, [role="combobox"]';
  const text = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
  const visible = el => !!el && el.getClientRects().length > 0;
  const enabled = el => !!el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  let records = GM_getValue(STORE, {});
  if (!records || typeof records !== 'object' || Array.isArray(records)) records = {};
  let active, menu, pending = false, restoring = false, token = 0, revision = 0, checkTimer, saveTimer;
  const modelStorageKey = key => STORE + ':model:' + key;
  // Old aggregate records remain readable. Each new write only touches one model.
  function getRecord(key) {
    const saved = GM_getValue(modelStorageKey(key), undefined);
    return saved === undefined ? records[key] : saved;
  }

  function context() {
    if (typeof document === 'undefined') return null;
    const model = [...document.querySelectorAll(MODEL)].find(visible);
    const name = model?.tagName === 'SELECT' ? model.value : text(model);
    if (!model || !name) return null;
    let root = model.closest('[data-cy="image-generator-form"], [data-cy="video-generator-panel"], form');
    if (!root) {
      root = model.parentElement;
      while (root && !root.querySelector('[data-cy="generate-button"]')) root = root.parentElement;
    }
    if (!root || root === document.body || root === document.documentElement) return null;
    return {root, model, key: location.pathname.replace(/\/$/, '') + '::' + name};
  }
  const controls = root => [...root.querySelectorAll(CONTROLS)];
  const typeOf = el => el.getAttribute('type') || el.getAttribute('role') || '';
  const nameOf = el => el.getAttribute('name') || el.closest('[name]')?.getAttribute('name');
  const refKey = r => r.cy ? 'cy:' + r.cy + ':' + (r.unique === false ? r.label || '' : '') : r.id ? 'id:' + r.id :
    r.name ? 'name:' + r.name + ':' + r.tag : r.label ? 'label:' + r.label : r.tag + ':' + r.type + ':' + r.index;
  function ref(el, root) {
    const cy = el.getAttribute('data-cy');
    return {cy, unique: !!cy && controls(root).filter(n => n.getAttribute('data-cy') === cy).length === 1,
      id: el.id && !/^(id-|radix|headlessui)/.test(el.id) ? el.id : null,
      label: el.getAttribute('aria-label'), name: nameOf(el) || null, tag: el.tagName, type: typeOf(el),
      index: controls(root).filter(n => n.tagName === el.tagName && typeOf(n) === typeOf(el)).indexOf(el)};
  }
  function find(root, r) {
    if (!root) return null;
    const list = controls(root);
    if (r.cy) {
      const matches = list.filter(el => el.getAttribute('data-cy') === r.cy);
      if (matches.length) return matches.length === 1 ? matches[0] : matches.find(el => el.getAttribute('aria-label') === r.label);
    }
    if (r.id) { const el = list.find(el => el.id === r.id); if (el) return el; }
    if (r.name) { const el = list.find(el => nameOf(el) === r.name && el.tagName === r.tag); if (el) return el; }
    if (r.label) { const el = list.find(el => el.getAttribute('aria-label') === r.label); if (el) return el; }
    return list.filter(el => el.tagName === r.tag && typeOf(el) === r.type)[r.index];
  }
  function popup(trigger) {
    const p = trigger && document.getElementById(trigger.getAttribute('aria-controls'));
    return visible(p) ? p : null;
  }
  function isField(el) {
    if (el.matches(MODEL) || el.closest('[contenteditable="true"]')) return false;
    if (el.tagName === 'INPUT' && !el.matches('[type="checkbox"], [type="radio"], [type="range"], [type="number"]')) return false;
    return visible(el) && enabled(el);
  }
  function fields(root) {
    return [...root.querySelectorAll(FIELDS)].filter(isField).map(el => {
      const kind = el.matches('input[type="checkbox"], input[type="radio"]') ? 'checked' : el.hasAttribute('aria-checked') ? 'aria' : 'value';
      return {ref: ref(el, root), kind, value: kind === 'checked' ? el.checked : kind === 'aria' ? el.getAttribute('aria-checked') === 'true' : el.value};
    });
  }
  function isMenu(el, ctx) {
    return visible(el) && enabled(el) && ctx.root.contains(el) && el.hasAttribute('aria-haspopup') &&
      !el.matches(MODEL) && !/reference|upload|template|help|model-selector|mode-selector|prompt-enhancement|unlimited-mode/.test(el.getAttribute('data-cy') || '');
  }
  function snapshot(ctx, old = {}) {
    const plus = ctx.root.querySelector('[data-cy="increase-number-images-button"]');
    const count = text(plus?.parentElement).match(/(?:Number of (?:videos|images):\s*)?(\d+)/i);
    const merge = (previous, current) => {
      const map = new Map((previous || []).map(item => [refKey(item.ref), item]));
      for (const item of current) map.set(refKey(item.ref), item);
      return [...map.values()];
    };
    const next = {...old, fields: merge(old.fields, fields(ctx.root)), count: count ? Number(count[1]) : old.count ?? null,
      menus: merge(old.menus, [...ctx.root.querySelectorAll('[aria-haspopup]')].filter(el => isMenu(el, ctx)).map(el => ({ref: ref(el, ctx.root), summary: text(el)})))};
    const smart = ctx.root.querySelector('[data-cy="smart-prompt-toggle"]');
    const unlimited = ctx.root.querySelector('[data-cy="unlimited-mode-toggle-button"]');
    if (smart) next.smartPrompt = !!smart.querySelector('[class*="translate-x-4"]');
    if (enabled(unlimited)) next.unlimited = /^ON$/i.test(text(unlimited));
    if (menu?.key === ctx.key) {
      const p = popup(find(ctx.root, menu.ref));
      if (p?.querySelector(FIELDS)) next.panels = {...next.panels, [menu.id]: {ref: menu.ref, fields: fields(p)}};
    }
    return next;
  }
  function commit(key, record) {
    if (JSON.stringify(GM_getValue(modelStorageKey(key), undefined)) === JSON.stringify(record)) return;
    try { GM_setValue(modelStorageKey(key), record); }
    catch (error) { console.warn('[Magnific ayar hafızası] Kaydedilemedi:', error); }
  }
  function save() {
    if (pending || restoring || !active) return;
    const ctx = context();
    if (ctx?.key === active.key) commit(ctx.key, snapshot(ctx, getRecord(ctx.key) || {}));
  }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 30); }
  function setValue(el, value) {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')?.set.call(el, value);
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
  }
  async function applyFields(getRoot, savedFields, valid) {
    for (const saved of savedFields || []) {
      if (!valid()) return;
      const el = find(getRoot(), saved.ref);
      if (!enabled(el)) continue;
      if (saved.kind === 'checked') {
        if (el.checked !== saved.value && !(el.type === 'radio' && !saved.value)) el.click();
      } else if (saved.kind === 'aria') {
        if ((el.getAttribute('aria-checked') === 'true') !== saved.value) el.click();
      } else if (el.value !== String(saved.value)) {
        if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === String(saved.value))) continue;
        setValue(el, saved.value);
      }
      await delay(90);
    }
  }
  async function closeMenu(trigger) {
    const p = popup(trigger);
    if (!p) return;
    p.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', code:'Escape', bubbles:true}));
    await delay(40);
    if (popup(trigger)) trigger.click();
    await delay(40);
  }
  async function openMenu(trigger, valid) {
    if (!valid() || !enabled(trigger)) return null;
    if (!popup(trigger)) trigger.click();
    for (let i = 0; i < 15 && valid(); i++) {
      const p = popup(trigger);
      if (p) return p;
      await delay(60);
    }
    return null;
  }
  function isModelChoice(el) {
    return /^(tti-model-selector-popover-model-|video-model-selector-option-)/.test(el?.getAttribute('data-cy') || '');
  }
  function options(p) {
    return [...p.querySelectorAll('button, [role="option"], [role="menuitem"], [role="radio"]')]
      .filter(el => visible(el) && enabled(el) && !isModelChoice(el));
  }
  function matches(el, summary) {
    const cy = el.getAttribute('data-cy') || '';
    const labels = [text(el), ...[...el.querySelectorAll('span')].map(text)];
    if (cy.startsWith('popover-option-')) labels.push(cy.slice(15));
    return summary.split(/[·•|]/).map(s => s.trim()).some(s => !!s && labels.includes(s));
  }
  async function restore(ctx, record, current) {
    restoring = true;
    const valid = () => token === current && context()?.key === ctx.key;
    try {
      const required = [...(record.fields || []), ...(record.menus || []), ...Object.values(record.panels || {})];
      for (let i = 0; i < 30 && valid() && required.some(item => !find(context().root, item.ref)); i++) await delay(100);
      if (!valid()) return;
      const unlimited = ctx.root.querySelector('[data-cy="unlimited-mode-toggle-button"]');
      if (typeof record.unlimited === 'boolean' && enabled(unlimited) && /^ON$/i.test(text(unlimited)) !== record.unlimited) { unlimited.click(); await delay(180); }
      for (const saved of record.menus || []) {
        if (!valid()) return;
        const trigger = find(context().root, saved.ref);
        if (!enabled(trigger) || !saved.summary || text(trigger) === saved.summary) continue;
        let p = await openMenu(trigger, valid);
        if (!p || !valid()) continue;
        const axes = [...p.querySelectorAll('[data-cy^="axis-column-"]')].map(el => el.getAttribute('data-cy'));
        for (const axis of axes.length ? axes : [null]) {
          if (!valid()) return;
          p = await openMenu(trigger, valid);
          if (!p) break;
          const scope = axis ? [...p.querySelectorAll('[data-cy]')].find(el => el.getAttribute('data-cy') === axis) : p;
          const choice = scope && options(scope).find(el => matches(el, saved.summary));
          if (choice) { choice.click(); await delay(120); }
        }
        if (valid()) await closeMenu(trigger);
      }
      for (const choice of Object.values(record.choices || {})) {
        if (!valid()) return;
        const trigger = find(context().root, choice.trigger);
        if (!enabled(trigger)) continue;
        const p = await openMenu(trigger, valid);
        const option = p && options(p).find(el => choice.option.cy ? el.getAttribute('data-cy') === choice.option.cy : text(el) === choice.option.text);
        if (valid() && option) { option.click(); await delay(120); }
        if (valid()) await closeMenu(trigger);
      }
      for (const panel of Object.values(record.panels || {})) {
        if (!valid()) return;
        const trigger = find(context().root, panel.ref);
        if (!enabled(trigger)) continue;
        if (await openMenu(trigger, valid)) await applyFields(() => popup(trigger), panel.fields, valid);
        if (valid()) await closeMenu(trigger);
      }
      if (!valid()) return;
      await applyFields(() => context()?.root, record.fields, valid);
      if (!valid()) return;
      const smart = context().root.querySelector('[data-cy="smart-prompt-toggle"]');
      if (typeof record.smartPrompt === 'boolean' && enabled(smart) && !!smart.querySelector('[class*="translate-x-4"]') !== record.smartPrompt) smart.click();
      for (let i = 0; record.count != null && i < 32 && valid(); i++) {
        const now = snapshot(context()).count;
        if (now == null || now === record.count) break;
        const el = context().root.querySelector(`[data-cy="${now < record.count ? 'increase' : 'decrease'}-number-images-button"]`);
        if (!enabled(el)) break;
        el.click(); await delay(100);
      }
      if (valid()) { ctx.root.setAttribute('data-magnific-memory-state', 'restored'); console.info('[Magnific ayar hafızası] Geri yüklendi:', ctx.key); }
    } catch (error) { console.warn('[Magnific ayar hafızası] Geri yükleme tamamlanamadı:', error); }
    finally { if (token === current) restoring = false; }
  }
  async function check() {
    const ctx = context();
    if (!ctx || (active?.key === ctx.key && active.root === ctx.root)) return;
    const current = ++token, before = revision;
    active = ctx; pending = true; restoring = false; menu = null;
    await delay(550);
    if (token !== current || context()?.key !== ctx.key) { scheduleCheck(); return; }
    pending = false;
    if (before !== revision) { save(); return; }
    const record = getRecord(ctx.key);
    if (record) await restore(context(), JSON.parse(JSON.stringify(record)), current);
    else save();
  }
  function scheduleCheck() { clearTimeout(checkTimer); checkTimer = setTimeout(check, 70); }
  function userEdit(event) {
    if (!event.isTrusted) return;
    revision++;
    if (restoring) { token++; restoring = false; }
  }
  document.addEventListener('click', event => {
    if (restoring && !event.isTrusted) return;
    const button = event.target.closest('button, [role="option"], [role="menuitem"], [role="radio"]');
    if (!button) return;
    if (isModelChoice(button)) { save(); token++; active = null; pending = false; restoring = false; menu = null; scheduleCheck(); return; }
    const ctx = context();
    if (!ctx || button.matches(MODEL)) { menu = null; return; }
    if (!ctx.root.contains(button) && !menu) return;
    userEdit(event);
    if (isMenu(button, ctx)) { const r = ref(button, ctx.root); menu = {key:ctx.key, ref:r, id:refKey(r)}; scheduleSave(); return; }
    if (!pending && menu?.key === ctx.key) {
      const p = popup(find(ctx.root, menu.ref));
      if (p?.contains(button) && text(button) && !p.querySelector(FIELDS)) {
        const axis = button.closest('[data-cy^="axis-column-"]')?.getAttribute('data-cy') || 'single';
        const old = getRecord(ctx.key) || snapshot(ctx);
        const next = {...old, choices: {...old.choices, [menu.id + '::' + axis]: {trigger:menu.ref, option:{cy:button.getAttribute('data-cy'), text:text(button)}}}};
        commit(ctx.key, next);
      }
    }
    scheduleSave();
  }, true);
  for (const type of ['input', 'change']) document.addEventListener(type, event => {
    if (restoring && !event.isTrusted) return;
    const ctx = context();
    if (!ctx || !event.target.matches(FIELDS)) return;
    if (event.target === ctx.model) { scheduleCheck(); return; }
    if (!isField(event.target)) return;
    if (!ctx.root.contains(event.target) && !popup(menu && find(ctx.root, menu.ref))?.contains(event.target)) return;
    userEdit(event); save(); scheduleSave();
  }, true);
  new MutationObserver(() => {
    const ctx = context();
    if (ctx && (ctx.key !== active?.key || ctx.root !== active?.root)) scheduleCheck();
    else scheduleSave();
  }).observe(document.documentElement, {childList:true, subtree:true, characterData:true,
    attributes:true, attributeFilter:['aria-checked', 'aria-pressed', 'value', 'checked', 'class']});
  window.addEventListener('pagehide', save);
  scheduleCheck();
})();
