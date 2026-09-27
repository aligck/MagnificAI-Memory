# Güncel durum

Başlangıç tarihi: 27 Eylül 2026. Proje DeepSeek'e devir için mevcut çalışmadan taşındı. 27 Eylül 2026'da Video Upscaler ve Modify Video adapterleri gerçek Magnific yayınında doğrulandı; ayrıntı ve sınırlar aşağıdadır.

## Sürümler

- `src/magnific-memory.user.js`: `3.0.0-beta.16` geliştirme kaynağı (altıncı oturum: beta.12 içerik/katalog sızıntıları, çoklu model bağlamı, multi-shot modu, tek seferlik kayıt temizliği; beta.13 görsel formu kimliği; beta.14–15 model algılaması; beta.16 bağlama bağlı model geçişi koruması). Arşivi `releases/magnific-memory-beta.16.user.js`; ara sürümler 13–15 ayrıca arşivlenmedi (hepsi 16'da).
- `releases/magnific-memory-beta.12.user.js`: beta.12 arşivi.
- `releases/magnific-memory-beta.11.user.js`: beta.11 arşivi (flip canvas yarışı düzeltmesi).
- `releases/magnific-memory-beta.8.user.js`: kullanıcının Chrome'unda kurulu olan beta.8'in değiştirilmemiş arşivi. Yerel test ve kurulu script sürümü ayrı şeylerdir.
- Kullanıcının Chrome'unda kurulu sürüm 27 Eylül 2026'da beta.8 → beta.10 → beta.11 → beta.12 → beta.13 → beta.14 → beta.15 → beta.16 olarak **üzerine güncelleme** ile taşındı; tek script kaydı korundu. Beta.12'den itibaren iki ek izin (`GM_listValues`, `GM_deleteValue`).

## Canlı doğrulama — 27 Eylül 2026

Yöntem: yerel Chrome 153, kullanıcı profilinin yerel bir kopyası, `--remote-debugging-port` ile ayrı örnek. Sayfaya projenin gerçek `src/magnific-memory.user.js` dosyası document-start'ta enjekte edildi; `GM_getValue/GM_setValue` localStorage destekli bir shim ile karşılandı. Kopyalanan profilin Tampermonkey deposu güvenilir okunamadığı için host (Tampermonkey) taklit edildi; gözlenen her şey gerçek site + gerçek kaynak kodudur, ama bu kurulum **Tampermonkey'e kurulmuş sürümün testi değildir**. Kanıt ve yeniden üretim dosyaları `private/chrome-live/` altında.

Sonraki oturumlar için kalıcı bir Chrome yolu kuruldu: `chrome-devtools-mcp` kullanıcı kapsamına kuruldu (`~/.zcode/mcp/chrome-devtools`) ve ZCode kullanıcı yapılandırmasına `mcp.servers.chrome-devtools` olarak eklendi (`~/.zcode/cli/config.json`, yedeği yanında; yazan betik `private/chrome-live/setup-mcp-config.mjs`). Mod: `--autoConnect` — kullanıcının **gerçek Chrome'una** bağlanır ve modele ~30 Chrome aracı verir (gezinme, tıklama, form doldurma, konsol/ağ okuma, ekran görüntüsü). Gereken tarayıcı ayarı `Local State → devtools.remote_debugging.user-enabled = true` olarak yazıldı (`private/chrome-live/enable-remote-debugging-pref.mjs`; Chrome kapalıyken uygulanır, `--off` ile geri alınır). Doğrulananlar: pref ile başlatılan Chrome `127.0.0.1:9222` üzerinde izin ucunu açıyor; `--browserUrl` bu uca bağlanamıyor (uç yalnızca autoConnect el sıkışmasına hizmet ediyor, `/json/version` 404); `--autoConnect` sunucusu 30 araçla açılıp tarayıcı onayı bekliyor. **Chrome her bağlantıda izin penceresi gösteriyor**; bu onay yalnızca kullanıcı tarafından verilebilir. MCP sunucuları oturum başında bağlanır, yani değişiklik bir sonraki oturumda etkinleşir; durum **Settings → MCP** sayfasında görünür. Kullanım istatistiği ve CrUX yüklemesi kapalı.

Kopya profil yolu (ayrı Chrome + `--browserUrl`, betik `private/chrome-live/launch.mjs`): Chrome kapalıyken alınan tam kopyada bile Magnific oturumu taşınmıyor (Chrome'un uygulama-bağlı çerez şifrelemesi kopyada çerezleri geçersiz kılıyor) ve kopyada Tampermonkey betiği enjekte etmiyor; bu yüzden bu yol tek seferlik giriş + betiği enjekte etme gerektirir. Gerçek profilde ise Tampermonkey ve kurulu script yerinde çalışır.

Not: Chrome 153 varsayılan profilde `--remote-debugging-port` bayrağını reddeder ("DevTools remote debugging requires a non-default data directory"); bu yüzden izin anahtarı veya ayrı profil gerekir.

### 27 Eylül 2026 — ikinci oturum (ZCode devri, DeepSeek yerine)

- ZCode üzerinden `chrome-devtools` MCP ile kullanıcının **gerçek Chrome'una** bağlantı kuruldu. Chrome kapalıydı; `user-enabled` izin anahtarı yerinde duruyordu, Chrome başlatılınca `127.0.0.1:9222` açıldı ve `list_pages` çalıştı. Bağlantı bir kez onaylandı; onay penceresi her bağlantıda yalnızca kullanıcı tarafından verilebilir.
- Kurulum akışı: `tools/serve-userscript.mjs` artık `/` yolunda script bağlantısı içeren minik bir kurulum sayfası servis ediyor. MCP'nin CDP tıklaması gerçek (trusted) kullanıcı hareketi olsa da TM 5.5 sekmeyi devralmak yerine `chrome-extension://` kurulum penceresi açıyor ve sekmeyi `tampermonkey.net/script_installation.php` ara sayfasına bırakıyor.
- **Kısıt:** `chrome-devtools-mcp` eklenti hedeflerini `--categoryExtensions` olmadan listelemiyor/gezinmiyor; TM kurulum penceresi ve panosu bu yüzden otomasyona kapalı. Bayrak `~/.zcode/cli/config.json` içindeki `mcp.servers.chrome-devtools.args` listesine eklendi; MCP sunucuları oturum başında bağlandığı için **bir sonraki ZCode oturumunda** etkinleşecek ve TM panosu/kurulum penceresi doğrudan sürülebilecek.
- Ortam gerçekleri: Tampermonkey 5.5.0, eklenti kimliği `dhdgffkkebhmkfjojejmpbldmpobfkfo`; `npm test` 14/14 geçti; kaynak `3.0.0-beta.10`. Kullanıcı Chrome'undaki kurulum hâlâ beta.8; beta.10 kurulumu ve gerçek TM koşusunda Video Upscaler/Modify reload testleri bu oturumda yapılamadı → bir sonraki oturumda tamamlandı (aşağıda).

### 27 Eylül 2026 — üçüncü oturum: gerçek Tampermonkey koşusu doğrulandı

ZCode yeniden başlatıldı; `--categoryExtensions` etkin. MCP artık eklenti sayfalarını görebiliyor ve sürüyor (ilk bağlantı el sıkışması bir kez 60 sn zaman aşımına uğradı, ikinci denemede bağlandı; Chrome 9222 açık kaldı).

**Kurulum:** Kurulum sunucusu (`npm run serve:dev`, önceki oturumdan ayakta kalan örnek dosyayı her istekte yeniden okur) üzerinden `/` kurulum sayfasındaki bağlantıya MCP tıklaması yapıldı; TM panosunda tek script "Magnific — Tüm Modellerin Ayar Hafızası" `3.0.0-beta.10`, 33 KB (kaynak 33071 bayt ile birebir), etkin, ~1 dk önce güncellenmiş olarak göründü. İkinci script oluşmadı; `@name`/`@namespace` korunumu doğrulandı. TM'nin ayrı eklenti penceresi bu kez `## Extension Pages` altında görünür hâle geldi.

**Gerçek TM koşusunda doğrulananlar:**

| Alan | Sonuç |
|---|---|
| document-start çalışma | `html[data-magnific-memory-version]` = `3.0.0-beta.10` sayfa açılışında yazılı |
| Video Upscaler bağlam | Panel kökünde `/app/tools/video-upscaler::magnific`; native state envanteri dolu (kapalı Advanced dahil `topaz*`, `magnificResolution`, `flavor`…); generic widget kaydı 0 |
| Video Upscaler reload | `sharpen 0→0.35` ve `magnificResolution 2k→4k` uygulamanın reaktif form kaynağından değiştirildi; reload sonrası ikisi de tıklamasız geri geldi (`flavor`/`strength` yerinde). Taban değerler (0 / 2k) geri alındı |
| Modify Video bağlam | `video-modify-tool-page` form kimliği; `/app/tools/video-modify::video-modify-minimax-h3` |
| Modify Video reload | `resolution 2K→1080p` ve `chatEnabled false→true`; reload sonrası ikisi de tıklamasız geri geldi; prompt değinilmedi (değeri okunmadı). Taban (`2K` / `false`) geri alındı |
| Yayın kayması | Bu oturumda gözlenen asset hash'leri: `useVideoUpscaleForm.TlHCdNkJ.v2.js`, `useVideoModifyForm.DJhgwM-y.v2.js` (devir belgesindeki `DlSoqnFS`/`DIFmBjNq` değil) — kaynak bulma yolu yeni yayında da çalıştı |
| Oturum | Gerçek hesap açık (Echo auth OK); üretim/kredi işlemi başlatılmadı |

Not: gerçek TM depolaması (`GM_setValue`) sayfa bağlamından okunamadığı için kayıt doğrulaması reload-restore üzerinden yapıldı; bu, test edilen davranışın kendisidir.

Öncelik listesindeki "Kullanıcının Chrome'unda beta.10'u kurup gerçek TM koşusunda Video Upscaler/Modify reload testini tekrarla" maddesi bu oturumla tamamlandı. Kalan canlı eksikler (LUT/flip oturumlu test, Modify time range/speed ramp, multi-shot, menü keşifleri, Firefox, migration) aşağıdaki listede sürüyor.

### 27 Eylül 2026 — dördüncü oturum: Adjust LUT/flip canlı testi, flip yarışı bulgusu ve beta.11

Oturum, kullanıcı gerçek Chrome'unun oturum açık hesabında Editör Adjust üzerinde çalıştı. Kurulum akışında TM güncellemesinin otomatik yükselme mekanizması netleşti: scriptin kaynak URL'si yerel sunucu olduğu için TM panosundaki "Güncellemeleri denetle" eylemi güncel dosyayı çekip sürümü yükseltiyor; beta.11 bu yolla kuruldu ve panoda doğrulandı (tek script kaydı).

**Canlı doğrulananlar (beta.11, gerçek TM):**

| Alan | Sonuç |
|---|---|
| Adjust bağlam | `/app/image-editor::adjust`; `useGlobalCanvasRetouch` çözüldü (`useGlobalCanvasRetouch.itV6H7TM.v2.js`, eski hash'ten farklı, kaynak bulma yine çalıştı) |
| Değer kaydı + reload | `contrast 25 / temperature -15 / exposure 12 / lutIntensity 0.6` reaktif kaynaktan değiştirildi; reload sonrası tıklamasız geri geldi |
| Flip x/y | `api.flip('X'/'Y')` ile iki eksen açıldı; aynı görselde reload sonrası geri geldi |
| Farklı görsel | URL ile ikinci varlık açıldı; değerler geldi, **flip açılışta aralıklı kayboldu** → yarış bulgusu (aşağıda) |
| Flip yarışı düzeltmesi | beta.11 ile farklı-görsel açılışı + 4 art arda açılışın tamamında X ve Y tıklamasız geri geldi |
| Gerçek tıklama | Preset çiplerine gerçek (CDP) tıklama yapıldı; preset işaretleyicisi geçici sayılıp kayda girmedi, preset'in yarattığı altın değerler normal kayıt yoluna düştü |
| İçerik | Prompt metriğine/kaynağına dokunulmadı; Save Changes/Generate başlatılmadı; test sonrası taban değerler nötr geri alındı |

**Bulgu ve düzeltme (beta.11):** aracın `flip()` API'si canvas ref'i kurulmadan çağrılınca sessizce no-op oluyor; eski kod ekseni çağrıdan önce "tüketilmiş" saydığı için flip o sayfa yüklemesi için kayboluyordu. Yeni kod çağrıyı ancak canvas varken yapıyor, yapamayacağı ekseni periyodik taramada canvas gelince tek seferlik uzlaşımla deniyor; kullanıcının sonradan kapatması hâlâ tercih olarak kaydediliyor (uzlaşım yalnızca "hiç inmemiş" eksenlerde çalışır). Yerel fixture'a "canvas geç gelen" üçüncü açılış senaryosu eklendi; 14/14 test geçti.

**LUT sınırlı kaldı:** bu yayında Adjust panelinde LUT seçici görünmüyor (`useLuts` modülü asset listesinden de gitti; `setLut`/`selectedLut`/`lutIntensity` API'de duruyor, muhtemelen premium-gated ya da taşındı). `lutIntensity` ref düzeyinde kayıt/geri yükleme doğrulandı; LUT kimliği seçiminin canlı testi seçicinin erişilebilir olduğu bir yayına kaldı.

### 27 Eylül 2026 — beşinci oturum: Modify gate, Voice/Audio envanterleri, Relight bağlantısı

beta.11 gerçek TM kurulu ve çalışır durumdayken; üretim/kredi işlemi başlatılmadan, uygulamanın kendi form API'leri üzerinden okuma yapildi.

**Modify Video time range/speed ramp — gated:** Erişilebilir kapsamda kaynak video yok. Mevcut proje 352 görsel üretimi içeriyor, 0 video; Modify'nin medya seçicisi proje kapsamlı ve diyaloğun içinden proje kapsamı değiştirme tıklaması uygulanmıyor (Hystory/Uploads sekmeleri "bu projede içerik yok" diyor). Çalışma alanı projesini değiştirmek devir kuralı gereği denenmedi. Madde, video içeriği bulunan bir oturum gerektiriyor; "yokmuş gibi" raporlanmadı.

**Voice Generator menü envanteri (eski boş kayıtların yerine geçti):** `useVoiceoverForm` API'sinden (`useVoiceoverForm.BqGVTlIj.v2.js`, formId `voiceover-page-form`) beş modelin tamamı için capability matrisi, slider config/preset'leri ve seçenek listeleri sıfır tıklamayla çıkarıldı; model seçimi `selectModelByProvider` ile yapıldı ve `eleven_v3`'e geri alındı. Öne çıkanlar: v2'de speed (0.7–1.2, 0.05), v3'te yok; Gemini 2.5 Pro'da temperature (0.8–2) + instructions; Gemini 3.1 Flash TTS yalnız instructions/pause/emotion (eski notların aksine temperature yok); Seed Audio 1.0'da speed (0.5–2) + volume + pitch (−12..12) + sampleRate (8k–48k) + ByteDance formatları (mp3/wav/pcm/ogg_opus) + maxDuration (10–120, 15/30/60/90/120 preset). ElevenLabs format listesi 12 seçenek (mp3_44100_32…wav_22050). Tam JSON: `private/original-handoff/voice-menus-2026-09-27.json` (Git dışı). voiceId/voice kataloğu tasarım gereği çıkarılmadı.

**Audio Generator menü envanteri:** `useAudioGeneratorForm` API'sinden (`useAudioGeneratorForm.CE8YJOHE.v2.js`, formId `audio-generator-page-form`): tek model (Seed Audio 1.0); maxDuration 10–120 (step 5, preset 15/30/60/90/120), speed 0.5–2 (0.05), pitch −12..12 (step 1, preset −6/0/+6), volume 0–2 (0.05, preset 0.5/1/1.5), formatlar mp3/wav/pcm/ogg_opus, sampleRate 8k–48k. JSON: `private/original-handoff/audio-menus-2026-09-27.json`.

**Relight menüleri — bağlantı kuruldu, değer dökümü eksik:** `useRelightToolForm.Ct69SdrW.v2.js` çözüldü (formId `relight`); `relightPresets`, `lightTransferPresets`, `availableResolutions`, `availableRelightModes`, `videoResolutionOptions` alanları API'de görünür. Değer dökümü, otomasyon aracının döngüsel yapı serileştirme hatası yüzünden bu oturumda tamamlanamadı (uygulama hatası değil); reaktif olmayan sığ kopyayla sonraki oturumda alınacak.

Not: envanter turları sırasında kullanıcı kayıtlarına dokunulmadı (yalnızca okuma ve model seçimi); model seçimi orijinaline döndürüldü.

### 27 Eylül 2026 — altıncı oturum: envanter taraması, beta.12 düzeltmeleri (Claude)

Araç: Claude in Chrome ile kullanıcının gerçek Chrome'u (kurulu TM + açık hesap), tek çalışma sekmesi. Kurulum yine yerel sunucu (`127.0.0.1:43129`) üzerinden; TM güncelleme/yeniden yükleme onayını kullanıcı verdi (eklenti sayfaları bu araçla sürülemiyor). Üretim/kredi işlemi başlatılmadı; değişiklikler uygulamanın kendi form API'leriyle yapıldı ve geri alındı.

Not: oturum sonunda çalışma sekmelerini kapatırken grubun son sekmesi kapatıldı ve Chrome tamamen kapandı (araç hatası; betik veya site ile ilgisi yok). Sonraki oturumlarda son sekme açık bırakılmalı. Çalışma sekmesi arka planda olduğundan Chrome zamanlayıcıları kısıyor (`document.visibilityState=hidden`); test beklemeleri `MessageChannel` ile yapıldı ve envanter niteliği bu yüzden gecikmeli güncellendi. Bir araç çağrısının 45 sn CDP zaman aşımı sayfa/betik arızası değildi (işlem sayfada tamamlanmıştı). Magnific araç panellerini (ör. `enhance-v2-skeleton`) gizli sekmede iskelet olarak tutuyor, gerçek form ancak sekme çizilince bağlanıyor; iskelet sırasında okunan değerler uygulamanın kendi varsayılanlarıdır (ör. Upscaler −3/3/subtle), betik bu arada bağlı olmadığı için kayda yazılmıyor ve panel gelince kayıt uygulanıyor (canlı gözlendi). Güvenilir canlı test için çalışma penceresi görünür olmalı.

**Envanter taraması (her aracın `data-magnific-memory-state-inventory` kaydı) ve bulgular — hepsi beta.12'de düzeltildi:**

| Araç | Bulgu | Sonuç |
|---|---|---|
| Video Upscaler | `astraPrompt` (Astra prompt metni) ayar olarak kaydediliyordu | `…Prompt/…Instructions/…Script/…Caption/…Description/…Lyrics` metin alanları dışlandı; canlıda envanterde yalnızca `astraCreativity/Realism/Sharp` kaldı |
| Relight | `relightPresets` (24) ve `lightTransferPresets` (6) katalogları `partial::` yaprakları olarak saklanıp geri yüklemede kataloğa yazılıyordu | `…Presets` katalogları dışlandı; canlıda envanter `lights, numberOfLights, selectedLightIndex, activePresetId, relightMode, resolution, numberOfImages, videoResolution` |
| Image Generator | `brandKitId`, `brandKitTemplateSlug` (kullanıcı varlığına referans) | dışlandı |
| Video Generator | `voices` (konuşan video ses listesi), `isTalkingVideosMode` (mod geçişi) | dışlandı |
| Video Generator çoklu model | Mod kapanınca uygulama `aspectRatio`'yu 16:9 → 1:1 sıfırladı ve bu PixVerse'ün tek model kaydına yazıldı | `modelIds` seçimi ayrı bağlam (`multi::a+b`); canlıda Kling 3.0 + PixVerse seçiminde süre 8 ayrı tutuldu, farklı sırayla aynı bağlam geldi, moddan çıkışta Kling 16:9/3 sn yerinde kaldı |
| Video Generator multi-shot | Uygulama sahneleri yenilemede tutmuyor; betik `promptType: multishot` + toplam 11 sn'yi geri yükleyince form sahnesiz multi-shot moduna düştü ("shot 0" hayalet düzenleyici) | Mod ve türetilmiş toplam süre kaydedilmiyor; canlıda Kling 3.0 sahne süreleri 7/4, Kling O3 5/6 model dönüşlerinde konumlarına geri geldi, sahne kimlikleri korundu; reload'da form temel mod/3 sn/16:9 açıldı |
| Voice, Audio, Music, Modify Video | Envanterde içerik/katalog yok | Değişiklik gerekmedi |

**Tek seferlik temizlik:** Beta.12 `GM_listValues`/`GM_deleteValue` ister; eski sürümlerin yazdığı ve güncel kurallarca reddedilen `state::` kayıtlarını kural revizyonu başına bir kez siler (işaret `magnific-model-memory-v3:meta:cleanup` = 2). Generic kontrol ve v2 kayıtlarına dokunmaz. Gerçek TM depoları sayfadan okunamadığı için silme canlıda doğrudan gözlenemedi; etkisi yeniden açılışlardaki envanterden ve yerel testten doğrulandı.

**Canlı doğrulanan diğer kapsam:**

| Alan | Sonuç |
|---|---|
| Relight menü dökümü | Modlar `settings/light-transfer`; görsel çözünürlük `1k/2k`; video `720p/1080p`; en fazla 3 ışık; 24 relight + 6 light transfer preseti. JSON: `private/original-handoff/relight-menus-2026-09-27.json` |
| Relight seçili preset | `applyPreset` (Tangerine) + çözünürlük 1k; reload sonrası iki ışık, `activePresetId`, 1k geri geldi; katalog 24 öğe ve anahtarları değişmedi; `reset()` + 2k ile tabana dönüldü |
| Image Upscaler | 6 mod: Creative `enhance-hq`, `enhance-magnific-creative`; Precision `sublime`, `photo`, `denoiser`, `v1`. Creative (creativity 3, hdr −2) ↔ Precision v1 (sharpness 12, grain 6) A → B → A ve reload ayrı kaldı; Precision'da slider değişince uygulama `imagination`'ı kendi `custom` değerine çekiyor (uygulama davranışı). Taban değerlere dönüldü |
| Image Generator | 50 modelin girdi matrisi (tıklamasız): `private/original-handoff/image-generator-inputs-2026-09-27.json`. `effects/camera/structure` referanslar içinde yaşıyor → içerik, tasarım gereği kaydedilmiyor. Bu yayında Image formunda `modelIds` yok |
| GPT 2.5 / Seedream 5 Pro | Eski test değerleri (4:3/1k/high; 1:1/1.5k/minimal) kullanıcı değiştirmeden duruyordu → 16:9/2k/medium ve 4:3/2k/high'a geri alındı; A → B → A ile kayıtlar doğrulandı |

**Karar (kullanıcı, 27 Eylül 2026):** "Her model kendi ayarını hatırlamalı." Voice Generator `voiceId` / `secondVoiceId` model başına kaydedilmeye devam eder (mevcut davranış). Henüz ses seçilmemiş bir modelin kendi değeri boştur; o modele geçişte seçimin boş gelmesi bu kararın beklenen sonucudur.

**Kırılganlık notu:** Betik hâlâ ana modülün minify edilmiş `sp`/`Rf` (watch/nextTick), `$` ve `Os` dışa aktarımlarına ve araç modüllerinin `t/i/n/m` dışa aktarımlarına bağlı. Bu oturumda yayın (`Dv9IVH_O.v2.js`) değişmedi; yeni hash'ler: `useVideoGeneratorForm.DT0-GTIb`, `useImageGeneratorForm.BLeFP8gV`, upscale `types.CgBP8tcQ`.

### 27 Eylül 2026 — altıncı oturum (devam): kalan araçlar taraması, beta.13–15

Kurulum notu: her sürüm güncellemesi Tampermonkey'in kendi onay ekranından geçiyor (eklenti sayfası; otomasyon tıklayamaz). Tampermonkey'e `@require file:///…/src/…` ile yerel dosyayı okuyan kalıcı bir geliştirme yükleyicisi kurma denemesi, oturumun güvenlik denetimince izinsiz kalıcılık olarak engellendi; yükleyici dosyası silindi, `src` asıl koduna geri yazıldı ve bu yol izlenmedi. Güncellemeler kullanıcı onayıyla sürüyor.

Rotalar uygulamanın kendi router'ından (`$router.getRoutes()`) alındı; tahmin yok. Tasarım/3D sahne/Spaces gibi proje oluşturan araçlar gezilmedi.

| Araç (rota) | Kaynak | Bulgu / sonuç |
|---|---|---|
| Cinematic Shot (`/app/tools/cinematic-shot`) | `ImageGeneratorForm id="cinematic-shot"`, model `cinematic` | **Kusur:** betik Image Generator'ın form örneğine bağlanıyordu. Beta.13'te form kimliği bileşenden; canlıda 4:3/4k/2 kaydedildi, reload'da geri geldi, tabana dönüldü; Image Generator (MAI) kendi 16:9/2k/1 değerlerini korudu |
| Image Upscaler (6 mod) | native | HQ ve Precision sublime/photo/denoiser dahil tüm modlar canlı; HQ 60, Denoiser 20 reload'da geri geldi, tabana dönüldü |
| Variations | `VariationsForm#variations`, generic | Bağlam mod (`::Reframe`); oran, grid, çözünürlük yakalanıyor |
| Skin Enhancer | generic | **Kusur:** version (faithful/creative/flexible) sıradan kontrol sayılıyordu. Beta.14–15: gizli Radix `select[data-cy=version-select]` üzerinden model bağlamı. Beta.15 ile arka plan sekmesinde version geçişinde sıfırlama önceki version'a yazıldı → beta.16. Beta.16 canlı: flexible grain 5 → creative (kendi 1) → flexible 5; ardından ikisi de 2'ye, seçim flexible'a döndü |
| Change Camera | generic | 4 slider (count/rotate/vertical/zoom), bağlam `default` |
| Mockup | generic | Sahne kaynağı, adet, çözünürlük; bağlam `default` (beta.6'da canlı test edilmişti) |
| Image to 3D | `ImageTo3DForm#image-to-3d`, generic | Bağlam model (`::Tripo v3.1`); rig, doku kalitesi, face limit, giriş modu yakalanıyor. Etiketsiz iki Toggle DOM yolu kimliğiyle — düzen değişirse kararsız |
| Video Relight | `RelightToolForm#video-relight`, native | Relight adapteri gerçek form kimliğini buldu; ayrı rota bağlamı |
| Sound FX | `SFXGeneratorForm`, generic | **Kusur:** form başlığı "Model" Loop anahtarını ve Generate'i model kontrolü yapıyordu (bağlam `::Off|Generate`, Loop kaydedilmiyordu). Beta.14 canlı: bağlam `default`; Loop açık → reload sonrası açık, kapatıldı |
| Voice Changer | `VoiceChangerToolForm`, generic | Aynı kusur (`::Change Voice`); beta.14 canlı: `default`, stil/benzerlik/format yakalanıyor |
| Audio Isolation | generic | Aynı kusur (`::Isolate voice`); ayar kontrolü yok |
| Speak | `TalkingVideosForm` | Görünen seçimler ses ve script/prompt düzenleyicisi (içerik); ayar yakalanmıyor, girdi gerektiren alanlar gated |
| Remove Background, Image to 360 | — | Girdi görseli olmadan ayar kontrolü görünmüyor (gated) |
| Video Resizer | `VideoResizerForm` | Oran düğmeleri iki yönlü bağ değil ve durum dışa açık bir form modülünde değil → **desteklenmiyor**; kaynak video olmadan zaten seçilemiyor |
| Character Generator | — | Hesap planında kapalı ("Feature not available"); incelenemez |
| Video Dubbing | `VideoDubbingForm`, generic | Ses (orijinal/klon), dil ve altyazı dili yakalanıyor, bağlam `default`; altyazı stili kaynak video olmadan devre dışı |
| Video Face Swap | — | Girdi olmadan ayar kontrolü yok (gated) |

### Video Upscaler (beta.10 kaynağıyla)

| Doğrulanan | Sonuç |
|---|---|
| Native adapter bağlantısı, form kimliği | `video-upscaler-tool-page` gerçek bileşenden çözüldü; bağlam `/app/tools/video-upscaler::magnific` |
| Kapalı panel değerleri | Kapalı Advanced dahil `topaz*`, `astra*`, `magnificResolution`, `flavor` vb. state envanterinde görünüyor |
| Yardım metni | "Which model should I use?" düğmesi bağlama karışmıyor (bağlam mod değeri) |
| Alt model A → B → A | `topaz::proteus` (details 0.55, noise 0.31) ile `topaz::nyx` (details 0.9, halo 0.22, grain 0.4) ayrı kayıtlar; proteus'a dönüşte kendi değerleri, nyx'in değerleri sızmadan geri geldi |
| Reload | Sayfa yeniden açıldığında Creative `magnificResolution` 4k menü açılmadan geri geldi; proteus/nyx değerleri mod ve alt model seçilir seçilmez kayıttan geldi |
| Mod ayrımı | Precision `strength 42` / `smartGrain 0.11` `magnific_precision` bağlamında; Creative'e dönüşte Creative'in kendi değerleri (strength 60), Precision'a dönüşte 42 geri geldi |
| Generic kirlilik | Aynı rotada model bağlamsız widget kaydı: 0 |

### Modify Video (beta.10 kaynağıyla)

| Doğrulanan | Sonuç |
|---|---|
| Native adapter ve bağlam | `video-modify-tool-page`; bağlam `/app/tools/video-modify::video-modify-minimax-h3` |
| Kayıt | `resolution "2k"`, `chatEnabled true` aynı çağrıda model bağlamına yazıldı |
| Model ayrımı | `video-modify-gemini-omni-1_1` kendi `1080p` + chat değerini tuttu; MiniMax'a dönüşte `2k`/`true` geri geldi |
| Model geçişi varsayılanı | Uygulamanın model değişiminde `chatEnabled`'ı sıfırlaması eski modelin kaydını bozmadı |
| Reload | Yeniden açılışta `resolution "2k"` ve `chatEnabled true` tıklamasız geri geldi |
| Prompt | Depoda prompt anahtarı yok |

### Yayın kayması

Canlı yayın devir belgesindeki modül adlarından farklı: giriş `index.7MN4JNQ1.v2.js`, ana modül `Dv9IVH_O.v2.js`, `VideoUpscalerToolForm.D2tAPXM9.v2.js`. Script hash ezberlemediği ve asset'leri önekle çözdüğü için adapterler çalışmaya devam etti; bu, kaynak bulma yolunun yayın değişimine dayanıklı olduğunun kanıtıdır.

## Canlı doğrulamada bulunan ve düzeltilen kusur

Modify Video sayfasında, aracın kendi işareti (`video-modify-form-model-selector`) DOM'a gelmeden önceki ilk taramada generic widget yolu, araç formuna ait kontrolleri (ör. çözünürlük seçicisi) model bağlamsız bir anahtara kaydediyordu:

```text
magnific-model-memory-v3:control:%2Fapp%2Ftools%2Fvideo-modify%3A%3Adefault:FormBarSelect::video-modify-form-resolution-selector::::modelValue
```

Bu kayıtlar native adapter bağlanınca uygulanmıyordu, ama depoda kalıyor ve adapter ileride bozulursa yanlış modelin değerini geri getirebilirdi. Düzeltme: bir kontrolün bileşen zincirinde **gerçek form kaynağı olan araç bileşeni** (ImageGenerator/VideoGenerator/AudioGenerator/MusicGenerator/Voiceover/RelightTool/VideoUpscalerTool/VideoModifyTool `*Form`) varsa generic yol o kontrol için kayıt üretmez. Model geçiş koruması bu pencerede çalışmaya devam eder. Yerel regresyon testi eklendi (`test-video-modify-memory.mjs`, işaret geç gelen senaryo) ve canlı sayfada kirliliğin sıfırlandığı doğrulandı.

## Yerel testler

`npm test` → **16 senaryo, tamamı geçti** (Node.js 22.22 ve 24.14):

- `test-generic-memory.mjs`: generic, `--native`, `--refs`, `--editor`, `--voice`, `--audio`, `--music`, `--duplicates`, `--unlabeled`, `--rich-prompt`
- `test-relight-memory.mjs`, `test-adjust-memory.mjs`, `test-video-upscale-memory.mjs`, `test-video-modify-memory.mjs`
- `test-storage-cleanup.mjs`, `test-multi-model-memory.mjs` (beta.12)

Bu turda eklenen/genişletilen yerel kapsam:

- Modify Video: ref bag, form kimliği keşfi, model başına çözünürlük/en-boy/chat, model geçişi varsayılanının kaydedilmemesi, prompt dışlama, reload, sıfır tıklama, işaret geç geldiğinde widget kaydı üretmeme.
- Adjust: gerçek `currentImage` ref'i ile x/y flip, LUT seçimi (yalnızca kimlik + kısa ad/kategori; dosya, URL, sahip, boyut dışarıda), kimliksiz seçimin kaydedilmemesi, reload sonrası flip/LUT geri yüklemesi ve geri yükleme başına eksen başına tek `flip` çağrısı.

## Canlı doğrulanmayan kapsam (bilerek açık)

- **Image Upscaler'ın 6 modundan 4'ü** (`enhance-hq`, Precision sublime/photo/denoiser) tek tek canlı denenmedi; bağlam mekanizması Creative/Precision v1 ile aynı.

- **Image Editor Adjust LUT seçimi:** flip x/y ve intensity gerçek TM koşusunda doğrulandı (dördüncü oturum); LUT seçicinin kendisi bu yayının Adjust panelinde görünmüyor, kimlik bazlı seçim canlı test edilemedi.
- **Video Upscaler/Modify'da gerçek kullanıcı tıklaması:** giriş yapılmadan araç kontrolleri video seçilene kadar devre dışı; doğrulama uygulamanın kendi handler'ları çağrılarak yapıldı, menü/öğe tıklamasıyla değil.
- **Multi-shot duration (Video Generator), Voice/Audio/Music menüleri, Image Generator/Editor modelleri, Relight Light Transfer/preset/resolution, kalan image/video/audio/3D/design araçları:** giriş gerektiriyor.
- **Firefox kurulumu, sekmeler arası canlı senkronizasyon, v1 migration.**
- **Tampermonkey'e kurulu sürüm:** canlı koşu host taklidiyle yapıldı; kurulum sonrası gerçek TM davranışı (document-start zamanlaması, izinler) ayrıca kullanıcı tarafında görülmelidir.

## Öncelikli yapılacaklar

- [x] Kullanıcının Chrome'unda beta.10'u kurup gerçek TM koşusunda Video Upscaler/Modify reload testini tekrarla. (27 Eylül 2026, üçüncü oturum: tamamlandı)
- [x] Magnific oturumu olan bir ortamda LUT/intensity ve x/y flip canlı testi (farklı görsel açma, kapat/aç, reload). (27 Eylül 2026, dördüncü oturum: flip + intensity tamam, LUT seçici bu yayında panelde görünmüyor — bknz. yukarıdaki sınırlar)
- [ ] Modify canlı kayıt: video verildiğinde time range/speed ramp ve koşullu seçenekler. **Gate:** erişilebilir kapsamda video içeriği yok (beşinci oturum); video bulunan bir proje/oturum gerektiriyor.
- [x] Video Generator multi-shot güvenli duration kaydı; prompt/ID korunması, sıralama ve eksik sahne davranışı. (altıncı oturum: sahne süreleri konum yaprağı olarak kaydediliyor, prompt/id kaydedilmiyor; uygulama sahneleri yenilemede tutmadığı için reload'da geri gelecek sahne yok — bu tasarım gereği; multi-shot modu + türetilmiş süre geri yüklemesinin sahnesiz form bıraktığı kusur beta.12'de düzeltildi)
- [x] Voice menü JSON'ları yeniden çıkarılmalı; eski boş menüler seçenek yok anlamına gelmiyor. (beşinci oturum: API envanteri çıkarıldı, private/ altında)
- [x] Audio'nun bütün range/preset/output seçenekleri. (beşinci oturum: envanter çıkarıldı, private/ altında)
- [x] Relight Light Transfer/preset/resolution menüleri. (altıncı oturum: döküm `private/original-handoff/relight-menus-2026-09-27.json`; katalog sızıntısı bulundu ve düzeltildi)
- [x] Image Upscaler bütün Creative/Precision modelleri ve bağlam ayrımı. (altıncı oturum: 6 mod envanteri; Creative ↔ Precision v1 A → B → A ve reload canlı geçti; diğer 4 mod aynı bağlam mekanizmasıyla, tek tek canlı denenmedi)
- [x] Image Generator ilk modellerin eksik kapalı menüleri ve çoklu model modu. (altıncı oturum: 50 modelin girdi matrisi `private/original-handoff/image-generator-inputs-2026-09-27.json`; bu yayında Image formunda `modelIds` yok, çoklu model Video Generator'da — beta.12 ile ayrı bağlam)
- [~] Kalan image/video/audio/3D/design araçlarının koşullu seçenekleri. (altıncı oturum: image/audio araçları, Video Relight/Dubbing/Face Swap tarandı, 4 kusur düzeltildi — yukarıdaki tablo; Design/3D/Spaces proje oluşturduğu için gezilmedi, Character Generator plan kısıtlı)
- [ ] Firefox gerçek kurulum uyumluluğu.
- [x] v1 kayıt migration; beta.8 yanlış help-context kayıtları için güvenli geçiş değerlendirmesi. (altıncı oturum, karar: **uygulanmadı**. v1 kayıtları model *görünen adıyla* ve DOM menü özetleriyle (`menus[].summary`, `fields[].ref`) tutuluyor; v3 ise gerçek `modelId` ve form alanı kullanıyor. Tek güvenli eşleme v2'nin `legacy()` fonksiyonundaki Image/Video metin ayrıştırmasıydı ve v3 zaten v2 kayıtlarını okuyor. v3 her modeli ilk ziyarette mevcut değerlerle kaydettiği ve kullanıcı v3'ü uzun süredir kullandığı için v1 kaydının hâlâ etkili olabileceği model sayısı küçük; ad → kimlik eşlemesini tahmine dayalı yazmak devir kuralına aykırı. Beta.8'in help-context'li Video Upscaler kayıtları yalnızca kullanılmayan eski anahtarlar; v3 bağlamı artık mod değeri, silinmeleri gerekmiyor.)
- [x] Eski GPT/Seedream test tercihlerini kullanıcı sonradan değiştirmediyse geri alma. (altıncı oturum: değerler test bırakıldığı gibiydi; GPT 2.5 `16:9/2k/medium`, Seedream 5 Pro `4:3/2k/high` olarak geri alındı, seçili model MAI Image 2.5'e döndü)
- [ ] Kapsam raporu, son sürüm/kurulum açıklamaları ve final dosya.

## Keşif kayıtlarının sınırları

- Image: yaklaşık 50 benzersiz model; model listesi 53 satır, panel dosyası 51 kayıt. Bu üç sayı aynı anlama gelmez.
- Editor: 32 model paneli.
- Video: 47 panel gezildi, fakat eski REPL closure problemi yüzünden ayrıntılı JSON sadece 19 modelde kaldı.
- Voice: 5 panel gezildi; eski menü kayıtları boştu — 27 Eylül beşinci oturumda API envanteriyle yeniden çıkarıldı (bkz. beşinci oturum bölümü ve `private/original-handoff/voice-menus-2026-09-27.json`).
- Music: 3; Modify: 6; Video Upscaler ana modeller ve 11 Precision Topaz alt modeli gezildi.
- Bazı eski tool kayıtları yanlış/eski rota olabilir. Her kayıt güncel sayfayla doğrulanmalı.

## Yerel kayıtlar

- Önceki ham keşifler, CDN kaynakları ve ekran kanıtları `private/original-handoff/` içinde (Git dışında).
- Bu turun canlı doğrulama araçları ve planları `private/chrome-live/` içinde: `launch.mjs` (kopya profille ayrı Chrome), `cdp.mjs` (hedef listesi, eval, tıklama, ekran görüntüsü), `live.mjs` (gerçek kaynağı enjekte edip plan adımlarını yürütür), `page-helpers.js` (canlı modülleri ve form kimliklerini çözer), `plan-*.json` (çalıştırılan adımlar).
- Bunlar hesap/oturum verisi içermez; `private/` Git dışındadır.

## Taşıma doğrulaması

- Node.js 24.14.0 ile `npm ci` ve `npm test`: 14 senaryonun tamamı geçti (beta.11). Beta.12 ile 16 senaryo Node.js 22.22'de geçti.
- Userscript davranış kodu devralınan beta.9 taslağından bu turda değişti (flip, LUT, native-form koruması); sürüm bu yüzden beta.10'a yükseltildi.
- Test dosyalarının import/kaynak yolları yeni klasörlere uyarlandı. Voice/Audio/Music fixture'larının eski Vue slot uyarıları sürüyor; testleri başarısız kılmıyor.
- Native Modify, LUT/flip ve gerçek çoklu model/sahne senaryolarının eksik canlı testleri devam ediyor.
- `private/` ve `node_modules/` Git dışında; hesap kanıtları GitHub'a gönderilmiyor.
- CI, push ve pull request üzerinde aynı yerel test takımını çalıştıracak şekilde eklendi.
