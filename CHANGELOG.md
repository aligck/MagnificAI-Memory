# Sürüm geçmişi

## 3.0.0-beta.16 — model geçişi koruması bağlama bağlı

- Canlı bulgu (beta.15, arka plandaki sekme): Skin Enhancer'da flexible'da grain 5 → creative'e geçiş → flexible'a dönüşte 2 geldi. Model geçişini koruyan pencere yalnızca 1 sn'lik zamanlayıcıyla kapanıyordu; kısıtlanan sekmede bu zamanlayıcı yeni bağlamı algılayan taramadan önce çalışabiliyor ve uygulamanın yeni model için yaptığı sıfırlama önceki modelin kaydına yazılıyordu. Pencere artık DOM'daki model bağlamı taranan bağlama eşitlenene kadar açık kalır.
- Yerel test `test-model-label.mjs`: taraması geciken sekme senaryosu (beta.15'te başarısız).

## 3.0.0-beta.15 — Radix gizli select üzerinden model algılama

- Canlı bulgu (beta.14): Skin Enhancer'ın görünür version tetikleyicisinin `data-cy`'si yok; `version-select` kimliği yanındaki gizli Radix `select`'te. Beta.14 bu alanı ayar olmaktan çıkarıp model de sayamadığı için version hiç hatırlanmıyordu. Model algılaması artık görünür tetikleyicinin yanındaki gizli `select[data-cy]`'yi de okur. Test fixture'ı gerçek yapıya (görünür combobox + gizli select) çevrildi; beta.14'te başarısız.
- Canlı doğrulandı (beta.14): Sound FX bağlamı `::default`, Loop ve adet kontrolleri yakalanıyor; Loop açık → reload sonrası açık geldi, kapatıldı. Voice Changer bağlamı `::default`.

## 3.0.0-beta.14 — model algılaması: form başlığı ve "version" seçicisi

- Canlı bulgu: Sound FX, Voice Changer ve Audio Isolation formlarının en üstündeki "Model" başlığı, etiket sezgisinde 8 kontrole kadar büyük kapsayıcılardaki her düğmeye atfediliyordu. Loop anahtarı ve Generate düğmesi model kontrolü sayıldığı için bağlam `::Off|Generate`, `::Change Voice`, `::Isolate voice` gibi oluşuyor, Loop değişince bağlam da değişiyor ve Loop değeri kaydedilmiyordu. Model algılaması artık yalnızca kontrolün kendi alan etiketini (en fazla 2 kontrollü kapsayıcı) kullanır. Kayıtlı kontrol kimlikleri değişmesin diye `label()` aynen korundu.
- Skin Enhancer'ın model seçimi `version-select` (faithful/creative/flexible) artık model bağlamıdır; her version kendi değerlerini tutar. Önceki `::default` kayıtları bu araç için bir kez yeniden başlar.
- Yerel testler 18 senaryo: `test-model-label.mjs` (form başlığı + version seçicisi; beta.13'te başarısız).

## 3.0.0-beta.13 — görsel formu kimliği gerçek bileşenden

- Canlı bulgu: Cinematic Shot, Image Generator'ın form işaretini (`data-cy="image-generator-form"`) kendi form kimliğiyle (`ImageGeneratorForm id="cinematic-shot"`, model `cinematic`) kullanıyor. Betik görsel formunu sabit `image-generator-form` kimliğiyle açtığı için Cinematic sayfasında Image Generator'ın form örneğine bağlanıyordu: bağlam `…/cinematic-shot::mai-image-2-5` görünüyor, Cinematic ayarları hiç hatırlanmıyordu. Form kimliği artık diğer araçlarda olduğu gibi sahibi olan `ImageGeneratorForm` bileşeninin `id` prop'undan alınır; bulunamazsa bağlantı kurulmaz (tahmin yok). Image Generator'daki gerçek kimliğin `image-generator-form` olduğu canlı doğrulandı.
- Image Upscaler'ın kalan 4 modu (`enhance-hq`, Precision sublime/photo/denoiser) canlı doğrulandı: HQ creativity 60 ve Denoiser sharpness 20 A → B → A ve reload sonrası geri geldi; taban değerlere dönüldü.
- Yerel testler 17 senaryo: `test-generic-memory.mjs --cinematic` (form kimliği bileşenden; beta.12'de başarısız).

## 3.0.0-beta.12 — içerik/katalog sızıntıları, çoklu model ve multi-shot düzeltmeleri

Canlı yayında her aracın durum envanteri taranarak bulunan kusurlar:

- **Prompt sızıntısı:** Video Upscaler'ın `astraPrompt` metni ayar olarak kaydediliyordu (filtre yalnızca tam adı `prompt` olan alanı yakalıyordu). Adı `…Prompt`, `…Instructions`, `…Script`, `…Caption`, `…Description`, `…Lyrics` ile biten metin alanları artık kaydedilmez; `smartPrompt` gibi boolean anahtarlar ayar olarak kalır.
- **Katalog sızıntısı:** Relight'ın uygulamayla gelen preset katalogları (`relightPresets` 24, `lightTransferPresets` 6 öğe) kısmi yapraklar olarak saklanıp geri yüklemede kataloğun üstüne yazılıyordu. `…Presets` katalogları (seçim alanları `selected…`/`active…` hariç) dışlandı; seçili preset (`activePresetId`) hatırlanmaya devam eder.
- **İçerik referansları ve mod geçişleri:** `brandKitId`/`brandKitTemplateSlug`, konuşan video `voices` listesi ve `is…Mode` anahtarları (ör. `isTalkingVideosMode`) ayar değildir.
- **Çoklu model modu (Video Generator):** `modelIds` seçimi artık kendi bağlamıdır (`multi::a+b`, sıradan bağımsız). Önceden moddan çıkışta uygulamanın yaptığı `aspectRatio` sıfırlaması ana modelin tek model kaydına yazılıyordu (canlı gözlendi).
- **Multi-shot:** uygulama sahneleri (içerik) yenilemede saklamıyor; `promptType: "multishot"` ve türetilmiş toplam süre geri yüklenince form sahnesiz multi-shot moduna düşüyordu (canlı gözlendi). Bu mod ve multi-shot sırasındaki toplam süre artık kaydedilmez; sahne süreleri, sahneler mevcutken konumlarına göre korunur.
- **Tek seferlik temizlik:** `GM_listValues`/`GM_deleteValue` izinleri eklendi. Güncel kurallarca reddedilen eski `state::` kayıtları (yukarıdakiler) kural revizyonu başına bir kez silinir; generic kontrol kayıtları ve v2 kayıtları korunur. İzinler yoksa temizlik atlanır.
- Yerel testler 16 senaryo: `test-storage-cleanup.mjs`, `test-multi-model-memory.mjs` eklendi; Relight (katalog + seçili preset) ve Video Upscaler (`astraPrompt`) fixture'ları genişletildi. Yeni testler beta.11 kaynağında başarısız, beta.12'de geçer.

## 3.0.0-beta.11 — flip canvas yarışı düzeltmesi

- Canlı bulgu düzeltmesi: Editör Adjust geri yüklemesinde x/y flip çağrısı, aracın canvas ref'i henüz kurulmamışken sessizce no-op olup o sayfa yüklemesi için kaybolabiliyordu (farklı görsel açılışında gözlendi; aralıklı). Flip çağrısı artık yalnızca etki edebileceği anda yapılıyor; etki edemeyen eksen periyodik taramada canvas gelince tek seferlik uzlaşımla deneniyor ve kullanıcı sonradan kapatırsa tercih olarak kaydedilmeye devam ediyor.
- Yerel senaryo: `test-adjust-memory.mjs`'e "canvas geç gelen" üçüncü açılış eklendi (çağrı yapılmadan bekler, canvas gelince eksen başına tam bir kez çağrılır, tekrar etmez). 14/14 senaryo geçti.
- Canlı doğrulandı: gerçek TM koşusunda farklı görsel açılışı + 4 art arda açılışta flip X/Y ve Adjust değerleri tıklamasız geri geldi; taban değerlere geri alındı. Bu yayında LUT seçici Adjust panelinde görünmüyor; `selectedLut`/`lutIntensity` yalnız ref düzeyinde doğrulandı.

## 3.0.0-beta.10 — canlı doğrulanmış geliştirme sürümü

- Canlı bulgu düzeltmesi: bir aracın kontrolleri kendi form kaynağına bağlanmadan önce generic widget yolu tarafından model bağlamsız bir anahtara kaydediliyordu (Modify Video'da `::default` widget kayıtları). Araç formu içindeki bir kontrol artık widget kaydı üretmez; model geçiş koruması bu pencerede çalışmaya devam eder.
- Adjust x/y flip: geri yükleme başına eksen başına en fazla bir çevirme çağrısı; canvas görseli reaktif değilse flip değişikliği periyodik taramada eşitlenir.
- LUT seçimi: kimlikle birlikte yalnızca kısa ad/kategori saklanır; ad ve kategori de uzunluk/URL kuralına tabidir.
- Yerel test takımı 14 senaryo: Modify Video native adapter fixture'ı (işaret geç geldiğinde widget kaydı üretmeme dahil) ve LUT/flip fixture'ı eklendi.
- Canlı doğrulandı: Video Upscaler (form kimliği, kapalı değerler, Topaz A → B → A, reload, Creative/Precision ayrımı) ve Modify Video (model başına çözünürlük/chat, model geçişi varsayılanı, reload). Kapsam ve sınırlar `docs/STATUS.md` içinde.
- Gerçek Tampermonkey kurulumu ve TM koşusunda reload testleri tamamlandı (önceki canlı koşu host taklidiydi); ayrıntılar `docs/STATUS.md` içinde.
- Geliştirme aracı: `tools/serve-userscript.mjs` artık `/` yolunda script bağlantılı kurulum sayfası sunar (otomasyonla TM kurulum akışını tetiklemek için).

## 3.0.0-beta.9 — devralınan taslak (hiç canlı kurulmadı)

- Video Upscaler ve Modify Video doğrudan kaynak adapterleri.
- Topaz alt modellerini ayrı bağlamda tutma.
- Katalog/source/transient metadata filtrelerinin sıkılaştırılması; help düğmesinin model bağlamından dışlanması.
- İçerikle karışık yapılarda güvenli ayar yapraklarının ayrı kaydı.
- Editor Adjust LUT ve flip tercihleri.

Bu taslak beta.10 ile düzeltilip canlı doğrulandı; ayrı bir kurulum dosyası olarak yayımlanmadı.

## 3.0.0-beta.8 — son kurulu beta

- Relight çoklu ışık state desteği.
- Editor Adjust kapalı bölüm state desteği.
- Canlı Relight/Adjust reload testleri geçti; diğer kapsam için devir belgesine bakın.

## Önceki çalışmalar

- beta.6: doğru panel sınırı ve Editor form kaynağı, Mockup/Music canlı testleri.
- beta.7: Voice/Audio adapterleri, tekrarlanan/etiketsiz kontrol kimlikleri, rich text içerik dışlama.
- 2.0.1: daha eski Image/Video doğrudan yaklaşımı.
- 1.0.1: eski DOM tabanlı yaklaşım ve sekmeler arası kayıt düzeltmesi.
