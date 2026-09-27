> Depoya taşıma notu: Bu belge önceki çalışmanın ayrıntılı devir kaydından uyarlanmıştır; tarihsel kayıttır. Güncel dizin, sürüm ve doğrulanmış kapsam için README.md ve STATUS.md esas alınır. Devir sırasında src/ beta.9, releases/ beta.8 idi; devralınan beta.9 taslağı hiç canlı kurulmadı ve beta.10 olarak düzeltilip doğrulandı (bkz. STATUS.md). Aşağıda work/ veya outputs/ adıyla geçen eski ham kayıtlar, bu yerel checkout'ta private/original-handoff/ altındadır; GitHub'da bulunmaz. Kurulum sunucusu artık src/ dosyasını doğrudan sunar; beta.8 arşivinin üzerine kopyalama gerekmez. Ayrı ZIP talimatları ilk taşınabilir devir paketinin tarihçesidir, depoyu clone ederek devam edilebilir.
# Magnific ayar hafızası — DeepSeek için ayrıntılı devir belgesi

Belgenin hazırlandığı tarih: 27 Eylül 2026. Dil: Türkçe.

Bu belge, devam eden ve henüz tamamlanmamış bir Tampermonkey userscript çalışmasını devreder. Kullanıcı çalışmayı durdurdu; şimdi DeepSeek üzerinden sürdürmek istiyor. Bu belge hazırlanırken Magnific üzerinde yeni keşif veya test yapılmadı. Aşağıdaki durum, son çalışma oturumunun dosyaları, test kayıtları ve notlarına dayanır. Site sürümü, model listeleri ve tarayıcı sekmeleri daha sonra değişmiş olabilir.

## 1. Yeni asistana ilk mesaj

Kullanıcının istediği işi şu çerçevede devam ettir:

> Magnific'teki bütün araçları ve bunların içindeki modelleri incele. Prompt, negative prompt ve kullanıcı içeriğini kaydetmeden, sunulan bütün gerçek ayar kontrolü türlerini destekleyen ortak bir hafıza mekanizmasını tamamla. Alanları tanıyan mekanizma genel olsun; her model kendi son değerlerini hatırlasın. Kullanıcı bir ayarı değiştirince anında kaydet. Aynı modele dönünce veya sayfayı yeniden açınca ayarı doğrudan uygulamanın ayar kaynağında geri yükle. Menüleri açıp seçeneklere tıklayarak geri yükleme yapma. Mevcut kodu ve kanıtları incele, açıkları bul, düzelt, test et; yalnızca gerçekten doğruladığın kapsamı tamamlanmış olarak raporla.

İşe sıfırdan başlamak gerekmiyor. Aşağıdaki sürüm ayrımını koruyarak mevcut beta.9 kaynak dosyasını temel al. Kullanıcıya aynı tercih sorularını yeniden sorma; aşağıda belirtilen kararlar verilmiş durumda.

## 2. Kullanıcının kesinleşmiş beklentileri

1. **Bütün modeller desteklenmeli.** Sadece testte seçilen birkaç model için alan listesi yazılması istenmiyor.
2. **Alan tanıma genel; değerler model başına ayrı.** Kullanıcının açık cevabı: “Her model kendi değerini hatırlasın; alanları tanıyan mekanizma ortak olsun.”
3. **Aracın bağlamı da ayrılmalı.** Aynı model veya benzer kontrol farklı araçlarda bulunabilir. Şu an kayıtlar araç rotası + model bağlamıyla ayrılıyor.
4. **Prompt kaydedilmeyecek.** Negative prompt, sistem talimatları, script/metin editörünün içeriği, ek talimatlar da kapsam dışında. Promptla ilgili bir boolean seçenek, örneğin `smartPrompt`, metin içeriğinden farklıdır; gerçekten ayar ise kaydedilebilir.
5. **Değişiklik anında kayıt.** Özellikle slider sürüklerken, sadece başka yere tıklanınca veya sayfa kapanınca kaydetmek yeterli değil.
6. **Geri yükleme doğrudan yapılmalı.** Kullanıcı menülerin sırayla açılıp kapanmasını ve otomatik tıklamaları istemedi. Uygulamanın gerçek reaktif değerini veya iki yönlü kontrol bağını güncellemek hedeflendi.
7. **Sayfa/model açılırken tercihleriyle görünmeli.** Sonradan görünür biçimde varsayılandan kayda geçiş mümkün olduğunca önlenmeli. Mevcut uygulama bunu tamamen garanti ediyor diye iddia etme; özellikle Editor ve geç gelen kaynaklar ayrıca test edilmeli.
8. **Modele özgü yeni bir seçenek de yakalanmalı.** Örneğin bir modelde bulunup diğerinde bulunmayan dropdown, slider veya toggle.
9. **Bütün araçların altyapısı keşfedilmeli.** Image Generator, Image Editor, Mockup ve diğer araçlar dahil. Sadece etiketlerin adı değil, kontrol mekanizması anlaşılmalı.
10. **Gereksiz sekmeler açılmamalı.** Kullanıcı açıkça fazla sekmelerden rahatsız oldu. Tek keşif sekmesini kullan; yükleme sekmesini işlem bitince kapat.

Kullanıcının “class” örneğini düz anlamıyla CSS sınıfını kayıt anahtarı yapma talebi olarak yorumlama. Anlatmak istediği ortak kontrol mekanizmasıdır. Aynı CSS sınıfını dört slider paylaşabilir; sınıf tek başına güvenilir kimlik değildir.

## 3. Mevcut durum ve kritik sürüm ayrımı

| Öğe | Durum | Ne anlama geliyor? |
|---|---|---|
| Chrome/Tampermonkey'de son doğrulanan kurulum | `3.0.0-beta.8` | Kullanıcı güncelledi; canlı testler bu sürümle yapıldı. Yeni oturumda sayfa üzerindeki sürüm niteliğinden yeniden kontrol edilmeli. |
| `src/magnific-memory.user.js` | `3.0.0-beta.9` | En güncel geliştirme kaynağı. Son eklemeler henüz canlı sitede doğrulanmadı. |
| `releases/magnific-memory-beta.8.user.js` | `3.0.0-beta.8` | Son kurdurulan beta dosyası. Beta.9 ile karıştırma. |
| `legacy/magnific-memory-2.0.1.user.js` | `2.0.1` | Eski ana dosya. Güncel ve tamamlanmış sürüm diye teslim etme. |
| `outputs/Kurulum.txt` | Eski açıklamalar | Son sürüm ve kapsamla yeniden yazılması gerekiyor. |
| Firefox'ta son kurulum/test durumu | Belirsiz | Kullanıcı daha önce Firefox'ta denemek için script istedi; son beta sürümlerinin Firefox testi doğrulanmadı. |

Çalışmanın kökü:

```text
D:\Coding\magnific memory
```

Yeni düzen: `src/` kaynak, `tests/` testler, `docs/` belgeler, `tools/` yardımcılar, `releases/` arşivler. Tarihsel `work/` ve `outputs/` kanıt yolları yalnızca bu yerel checkout'taki `private/original-handoff/` altında bulunur. Bunlar GitHub'da yoktur.

Bu depo doğrudan devir projesidir. Güncel kod `src/magnific-memory.user.js`, testler `tests/` altındadır. Hesap içerikli ham kanıtlar yalnızca yerel `private/original-handoff/` klasöründe tutulur; GitHub deposuna dahil edilmez.

## 4. Tarayıcı ve çalışma geçmişi

Başlangıçta Firefox MCP bağlantısı değerlendirildi. Ayrı kalıcı profil, kullanıcının normal profili, Cloudflare doğrulaması ve alternatifler konuşuldu. Kullanıcı sonunda Firefox MCP'nin kaldırılmasını ve Chrome bağlantısıyla devam edilmesini istedi. Şu an çalışma Firefox MCP gerektirmiyor; bunu yeniden kurma girişimini işin ön koşulu yapma.

Tampermonkey kullanıcı tarafından kuruldu. Script yükleme ekranındaki yükle/güncelle düğmelerini kullanıcı yaptı. Kullanılan Chrome kontrol bağlantısı `chrome-extension://` ekranlarını kontrol etmeye izin vermiyordu. Bu yüzden eklenti ekranını otomasyonla aşmaya veya tarayıcı profil dosyalarını değiştirmeye çalışılmadı. Yeni aracın kısıtları farklıysa kendi aracının kurallarını uygula; eski bağlantıya ait bir kısıtı bütün MCP'lerin zorunlu davranışı olarak sunma.

Son çalışma Chrome'daki oturum açık Magnific hesabında yürütüldü. Araç çubuğundaki proje seçimi değiştirilmeden mevcut görsel/video girdileri kullanıldı. Üretim, ücretli önizleme veya kredi harcayan işlemler başlatılmadı.

Son kaydedilen tarayıcı sayfası `https://www.magnific.com/app/tools/speak`. Açılan voice picker durdurma sırasında Escape ile kapatıldı. Codex bağlantısının son tarayıcı kimliği `3`, keşif sekmesi `1576517350` idi; bunlar DeepSeek'e taşınabilecek kalıcı kimlikler değildir. Yeni bağlantıda mevcut sekmeleri gözlemleyerek doğru sekmeyi seç.

Geçmişte Chrome kontrol bağlantısı gecikti veya debugger bağlantısı koptu. Kullanıcı sayfanın normal çalıştığını söyledi. Bu durumdan scriptin sayfayı dondurduğu sonucu çıkarılmadı. Tarayıcı kontrol arızası ile userscript arızasını birbirinden ayır.

## 5. Ne yaptık, neden bu mimariye geçtik?

### İlk yaklaşım ve sorunlar

`1.0.1` döneminde ayarları DOM üzerinden bulup menü etkileşimleriyle geri yükleyen yaklaşım vardı. Farklı sekmelerde kayıtların birbirini silmesi düzeltildi. Ancak kullanıcı görünür tıklamalardan memnun değildi. Image Upscaler'daki Creativity, HDR, Resemblance ve Fractality sliderlarının kaydı da eksikti.

`2.0.1` yaklaşımı Image/Video Generator'ın ayar kaynaklarına daha doğrudan bağlandı. Bazı yerel depolama alanlarını başlangıçta hazırlayan bir yöntem de bu eski sürümde vardı. Güncel v3 mimarisini anlatırken eski v2'nin alan listelerini veya localStorage davranışını v3'ün tamamına mal etme.

Kullanıcı bütün araçları kapsayan ortak bir mekanizma istediğinde v3 geliştirildi. İki tamamlayıcı yol var:

1. **Genel Vue kontrol bağı keşfi:** Yeni ayar kontrolünü adı sabit bir alan listesinde olmadan tanır.
2. **Araç formunun doğrudan reaktif kaynağı:** Popover kapalıyken DOM'da bulunmayan alanları da kaydeder ve geri yükler.

Doğrudan kaynağa bağlanmak bir modele özel alan listesi yazmak değildir. Aracın form kaynağına bir kez bağlanıp, güvenli ayar değerlerini ortak kurallarla tarıyoruz. Model kimliği sadece kaydın hangi model için olduğunu belirliyor.

### Önemli düzeltmelerin özeti

| Aşama | Önemli değişiklik |
|---|---|
| beta.1–beta.5 | Üretim sürümüyle kaynak uyumu, model kayıtlarının ayrılması, iç içe seçim kontrolleri, kapalı menü değerleri ve Editor desteği üzerinde iterasyon yapıldı. |
| beta.6 | `full-canvas-layout` sadece Editor rotasında kök olarak kullanılacak şekilde düzeltildi. Diğer araçlarda galeri taranması önlendi. Editor'ın gerçek form kaynağı `talk-to-image` olarak düzeltildi. |
| beta.7 | Voice/Audio form kimlikleri gerçek üst bileşenden alındı. Aynı `data-cy` değerini paylaşan ve etiketsiz kontroller ayrıldı. Rich text editörünün format düğmelerinin ayar sanılması önlendi. |
| beta.8 | Relight'ın bütün ışıkları ve Editor Adjust'ın kapalı bölümleri doğrudan kaynak üzerinden desteklendi. |
| beta.9, henüz kurulu değil | Video Upscaler/Modify Video kaynakları, LUT/flip, içerikle karışık yapılardaki güvenli ayar yaprakları ve daha sıkı metadata filtreleri eklendi. |

## 6. Teknik mimari

### 6.1 Userscript ortamı

Script `magnific.ai`, `magnific.com` ve alt alan adlarına eşleşiyor. `@run-at document-start`, `@sandbox raw`, `GM_getValue` ve `GM_setValue` kullanıyor. Kayıtlar Tampermonkey'nin script depolamasında tutuluyor; başka bir tarayıcı profiline veya Firefox'a otomatik taşınmıyor.

Scriptin çalışması için yerel kurulum sunucusunun sürekli açık kalması gerekmiyor. Sunucu yalnızca `.user.js` dosyasını yükleme ekranına ulaştırmak için kullanıldı. Script, çalışırken Magnific'in o anda yüklenmiş resmi uygulama modüllerini kullanıyor.

### 6.2 Kayıt anahtarları

Genel kontrol kaydı:

```text
magnific-model-memory-v3:control:
  encodeURIComponent(route::modelContext)
  :encodeURIComponent(controlIdentity)
```

Doğrudan form kaynağı kaydı aynı öneki kullanır; alan kimliği `state::<field>` olur. Değer kayıt biçimi:

```json
{"value": "gerçek ayar değeri", "version": 3}
```

Her alan ayrı anahtarda tutulur. Bu, iki sekmenin bütün model nesnesini yeniden yazıp diğer sekmenin farklı alan değişikliklerini silme riskini azaltır. Bunun bütün sekmelerin arayüzünün anında birbirine senkronlandığı anlamına geldiğini söyleme; böyle bir canlı sekme senkronizasyonu ayrıca doğrulanmadı.

Editor'ın `/app/image-editor/...` görsel kimliği içeren rotaları `/app/image-editor` olarak normalize edilir. Böylece farklı görseller açılınca aynı model tercihleri kullanılabilir. Mockup veya modeli olmayan başka bir araç `default` bağlamına sahip olabilir. Adjust için `adjust` bağlamı kullanılır.

### 6.3 Genel kontrol keşfi

`panel()` gerçek ayar panelini sınırlar; tüm sayfayı veya hesap menülerini taramak amaçlanmaz. Editor'da tam canvas düzeni, diğer araçlarda çoğunlukla sidebar kullanılır.

Magnific Vue kullanıyor. Production sürümünde geliştirme ortamındaki `__vueParentComponent` gibi DOM işaretçileri bulunmayabiliyor. Bu yüzden `componentOwners()` uygulama kökünün `_vnode` ağacını, `component.subTree`, çocuklar ve suspense dalları üzerinden dolaşır. Render edilen DOM öğesinin sahibi olan bileşeni bulur.

Gerçek iki yönlü bağ `onUpdate:<prop>` üzerinden tanınır. `modelValue` ile sınırlı değildir; mevcut prop ve gerçek güncelleme handler'ı incelenir. Güvenli ayar kontrolü için `safeControl()` uygulanır. Prompt, rich input, textarea, dosya, parola, arama, navigasyon ve model seçicileri ayar kaydı olarak değerlendirilmez.

Kimlik oluşturulurken bileşen adı + `data-cy` + gereken durumlarda sabit alan etiketi + prop kullanılır. Tekil `data-cy` varsa seçili değerin metni kimliğe eklenmez. Tekrarlanan `data-cy` için etiket gerekir. Kimliksiz/etiketsiz kontrol için bileşen hiyerarşisi ve DOM yolu son çare olarak kullanılır. Bu yol sayfa düzeni değişince kararsız hale gelebilir; gelecekteki sürüm testlerinde dikkat edilmeli.

Güncelleme handler'ı sarılır: önce uygulamanın gerçek handler'ı çağrılır, sonra yeni değer senkron kaydedilir. Ek olarak derin `watch(..., {flush:'sync'})` kullanılır. Geri yükleme kayıtlı değeri gerçek handler'a verir; sayfada menü açma veya tıklama yapmaz.

### 6.4 Doğrudan form kaynağı

Kaynak bağlantısı varsa ilgili panelde tek yetkili kayıt yolu bu olur. Eski widget kayıtlarını aynı anda uygulamak, kapalı menüden kalan eski değerlerin güncel form değerini ezmesine neden olabileceğinden genel widget geri yüklemesi bu durumda devre dışı bırakılır.

`snapshot()` güvenli alanları çıkarır. `save()` yalnızca değişen alanları kaydeder. Ref'ler `.value` ile güncellenir. Bazı düz reaktif nesnelerde `Object.assign` kullanılır; örneğin Adjust `grain` nesnesinin kimliği korunur. Readonly ref/computed metadata değiştirilmez. Kaynak uygunsa `isSettingFormProgrammatically` bayrağı geçici kullanılır.

Model geçişi izlenir. Geçiş sırasında uygulamanın yaptığı varsayılan sıfırlamalar eski modelin kaydını bozmamalıdır. Geri yükleme dört `nextTick` boyunca tekrar uygulanır; ticket/revision kontrolleri yeni kullanıcı müdahalesi veya bağlam değişince eski işlemi durdurur. İlk ziyarette eksik kayıtlar başlangıç değerleriyle oluşturulur; daha önce kaydı olan modelin başlangıç değerleriyle kaydı ezilmez.

Yeni, hiç ziyaret edilmemiş bir model uygulamanın o an taşıdığı değerlerle açılıyorsa script bu başlangıcı görür. Böyle bir modelde kayıtlı bir önceki tercih varmış gibi garanti verilemez. İlk ziyaret ile tekrar ziyareti testlerde ayır.

### 6.5 Resmi uygulama modüllerinin bulunması

Script DOM'daki `https://cdn.magnific.com/ait/assets/index.*` giriş dosyasını bulur. Giriş dosyasının import ettiği ana modülü okur. Gerçek `watch` ve `nextTick` fonksiyonlarını buradan alır; son incelenen yayında bunlar `core.sp` ve `core.Rf` idi. `core.$().isUnlimitedModeEnabled` ayrıca kaydedilen global ayar ref'idir. Video form kimliği için incelenen yayındaki `core.Os` kullanılır.

Araç modülleri ana uygulamanın gerçek asset listesinden `asset(prefix)` ile bulunur. Hash içeren dosya adları tahmin edilmemeli veya sabitlenmemeli. Son incelenen giriş `index.Vx78OwRt.v2.js`, ana modül `CHvkbT4D.v2.js` idi. Önceki `FDlrLRbd` sürümü eskidir. Bunlar güncel site için garanti değildir.

**Kırılganlık:** Minify edilmiş export adları ve Magnific'in dahili API'leri resmi, kararlı bir plugin API'si değildir. Site yayını değişirse arayüz normal çalışırken adapter bozulabilir. Kod hata yakalayıp genel kontrol yoluna düşebilse de kapalı alan kapsamı azalabilir. Bir kaynak modülünün yüklenmesi ile doğru canlı form örneğine bağlanılması aynı şey değildir; ikisini de doğrula.

### 6.6 İçerik dışlama ve beta.9 kısmi kayıt

`option()` yalnızca sınırlı boyutlu JSON benzeri ayar değerlerini kabul eder: sonlu sayılar, boolean, null, en fazla 256 karakter string, sınırlı derinlik/nesne/dizi. HTTP/data/blob URL'leri reddedilir. İçerik anahtarı veya uygunsuz değer barındıran nesne/dizi bütünü normal yoldan kabul edilmez.

`stateOption()` prompt, talimat, referans, upload, dosya, URL, token, kimlik/üretim/proje metadata'sı, canvas/currentImage, yüklenme durumu ve katalogları dışlar. Bu filtre bir kontrolün adını ezberleyen liste değildir; içerik ve geçici durumu ayıklayan ortak kuraldır.

Beta.9'da `settingLeaves()` eklendi. Örnek:

```js
multiShots: [{id: 'geçerli-sahne', prompt: 'kullanıcı metni', duration: 5}]
```

Bu yapıda prompt/id kaydedilmez, güvenli `duration` ayrı yol kaydı olur:

```text
state::partial::["multiShots",0,"duration"]
```

Geri yükleme yalnızca mevcut yapıda bulunan yaprağı günceller. Farklı mevcut prompt ve id korunur. **Eksik sahneleri oluşturmaz; sahne sayısını bu mekanizma tek başına hatırlamaz.** Yerel test geçti, gerçek Video Generator multi-shot arayüzüyle test henüz yapılmadı. Dizi sırası değiştiğinde konum tabanlı eşleşmenin kullanıcı beklentisi ayrıca değerlendirilmelidir.

Beta.9 LUT seçiminde yalnızca `id`, varsa `name` ve `category` kaydedilir. LUT dosyası, URL veya kullanıcı metadata'sı kaydedilmez. Flip sadece x/y boolean tercihidir; kaynak görsel nesnesi depolanmaz. Bu iki desteğin canlı testi eksik.

### 6.7 Başlangıç görünümü ve tarama

Başlangıçta CSS perdesi ilgili sidebar'ı kayıtlar uygulanana kadar gizlemeye çalışır; altı saniyelik fail-safe kaldırır. `document-start` ve doğrudan native restore erken yüklemeyi hedefler. Bunun “sayfa daha HTML yüklenirken her araç yüzde yüz tercihleriyle gelir” şeklinde kesin garantisi yoktur. Editor canvas, geç gelen ref'ler, yeni bileşenler ve ilk render görüntüsü ayrıca kontrol edilmeli.

Tarama 500 ms aralıkla ve olaylara bağlı 50 ms kuyrukla çalışır. `scanRunning/scanAgain` aynı anda üst üste taramayı sınırlar. Kullanıcı değişikliği kaydı yalnızca bu 500 ms taramaya bağlı değildir; bağlı kontrollerde senkron handler/watch kullanılır.

## 7. Bulunan doğrudan kaynaklar

| Araç | DOM giriş işareti | Kaynak/API | Bağlam |
|---|---|---|---|
| Image Generator | `image-generator-form` | `useImageGeneratorForm.t('image-generator-form').imageGeneratorFormState` | `modelId` |
| Video Generator | `video-generator-panel` | `useVideoGeneratorForm.t(core.Os).videoGeneratorFormState` | `modelId` |
| Image Editor model paneli | `edit-bar` | `useImageGeneratorForm.t('talk-to-image').imageGeneratorFormState` | `modelId`; Editor rotası normalize |
| Image Upscaler | `enhance-v2-panel` | `SingleCanvasUpscale` modülünün gerçek `types.*` bağımlılığı: `n('upscale-panel')`; `i('upscale-panel').mode` | Mevcut mode değeri; iç modellerle bağlam ayrımı ayrıca incelenmeli |
| Audio Generator | `audio-generator-form` veya `audio-generator-panel` | `useAudioGeneratorForm.t(formId).audioGeneratorFormState` | `modelId` |
| Music | `music-generator-form` | `useMusicGeneratorForm.t(formId).musicFormState` | `modelId` |
| Voice Generator | `voiceover-generator-panel` | `useVoiceoverForm.t(formId).voiceoverFormState` bir Ref | `currentModel.value.provider` |
| Relight | `relight-mode-toggle` | `useRelightToolForm.t(formId)` ref bag | `default`; mod ayrıca tercih |
| Editor Adjust | `#adjust-panel` | `useGlobalCanvasRetouch.m()` | `adjust` |
| Video Upscaler, beta.9 | `video-upscaler-type-tabs` | `useVideoUpscaleForm.i(formId).form` | `mode`; Topaz için `mode::enhancementModel` |
| Modify Video, beta.9 | `video-modify-form-model-selector` | `useVideoModifyForm.n(formId)` ref bag | `api.model.value` |
| Mockup | Sidebar kontrolleri | Genel Vue bağları; ayrı state export bulunmadı | `default` |
| Speak | `talking-videos-form` | `talkingVideosFormState` kaynakta görüldü; adapter yok | Henüz netleştirilmedi |

`formId` tahmin edilmez. Audio/Music/Voice/Relight/VideoUpscale/Modify için gerçek üst bileşenin `props.id` değeri alınır. Bileşenler sırasıyla `AudioGeneratorForm`, `MusicGeneratorForm`, `VoiceoverForm`, `RelightToolForm`, `VideoUpscalerToolForm`, `VideoModifyToolForm` olarak tanındı.

Voice form Ref'i her snapshot/apply sırasında yeniden açılır. Tek sefer alınmış eski `.value` nesnesine bağlanmak yeterli değildir.

## 8. Keşif kapsamı: neler gezildi, neler doğrulanmadı?

“Menüyü gördük”, “kaynak yapısını anladık” ve “kayıt/reload testini geçtik” ayrı seviyelerdir.

| Araç | Keşif | Eksik kalan bölüm |
|---|---|---|
| Image Generator | Önceki notlara göre 50 benzersiz model; model listesinde 53 satır; panel dosyasında şu an 51 kayıt | İlk modellerin kapalı seçenek menülerinin ayrıntısı kısmi; kayıt sayısını benzersiz model sayısı diye sunma; çoklu model modu incelenmedi |
| Image Editor | 32 model paneli seçildi ve temel menüler kaydedildi | Bütün özel seçeneklerin kapsamını kontrol et; LUT/flip son kodu canlı doğrulanmadı |
| Video Generator | Auto dahil 47 model ve etkin option menüleri gezildi | JSON ayrıntıları sadece 19 modelde korunmuş; devre dışı/ref gerektiren alanlar eksik; multi-shot gerçek testi eksik |
| Voice Generator | 5 model paneli gezildi | Eski menü JSON'ları boş; doğru popover seçimiyle seçenek/range kayıtları yeniden çıkarılmalı |
| Music | 3 model ve ana menüler incelendi | Ek kaynak/koşullu kontroller varsa kontrol et |
| Audio Generator | Bir SeedAudio 1.0 modeli; pitch/output canlı test edildi | Altı ayar menüsünün bütün seçenekleri/range/preset envanteri tamamlanmalı |
| Mockup | Sayı ve çözünürlük dahil ortak kontrol testi | Model yoksa `default`; prompt ve referansları ayar sayma |
| Relight | Çoklu ışıklar ve native kaynak | Light Transfer, preset ve çözünürlük menülerinin ayrıntılı keşfi tamamlanmalı |
| Image Upscaler | İlk dört slider sorunu test edildi; native adapter var | Son sürümle Creative/Precision ve bütün modeller tekrar canlı kontrol edilmeli |
| Video Upscaler | Creative Magnific/Topaz, Precision Magnific + 11 Topaz, HDR 2 model gezildi | beta.9 native adapter canlı test edilmedi; Flavor/Precision çözünürlük menüsü ve bazı gated seçenekler eksik |
| Modify Video | 6 model ve her birinin etkin çözünürlük menüsü gezildi | Kaynak video verilmedi; gelişmiş/time range/speed ramp ve koşullu seçenekler eksik; beta.9 adapter canlı testi eksik |
| Speak | Temel panel, script/audio toggle ve voice picker incelendi | Seçim/girdi sonrası alanlar, güvenli ses tercihi kaydı ve adapter eksik |
| Diğer image/video/audio/3D/design araçları | Eski `tool-panels.json` içinde kısmi geziler var | Bazı kayıtlar eski/yanlış rota olabilir; tek tek tekrar doğrulanmalı |

Video Upscaler Precision Topaz alt modelleri:

Starlight Precise 2.6, Starlight Fast 2, Proteus, Artemis, Nyx, Rhea, Gaia, Dione, Theia, Iris, Themis.

Creative Topaz: Astra 2 ve Colorize. HDR: Hyperion 2.5 (`topaz_hdr`) ve Runway Ruby (`runway_hdr`). Topaz Advanced settings: Details, Compression, Recover Original Detail, Noise, Halo, Pre-noise, Pre-blur, Blur, Grain, Grain Size, Focus Fix. Astra: Creativity, Realism, Sharpness ve prompt; prompt dışarıda. Magnific Custom: Flavor, Creativity, Premium Quality, Sharpen, Smart Grain; ayrıca çözünürlük, FPS Boost, Turbo, ProRes.

Modify modelleri: MiniMax H3, Gemini Omni 1.1, Seedance 2.5, Seedance 2.0, Runway Aleph 2, Grok.

Voice modelleri: ElevenLabs v3, ElevenLabs v2, Gemini 2.5 Pro, Gemini 3.1 Flash TTS, SeedAudio 1.0. Bazı listelerde v3 “enhance” etiketiyle görüldü; kayıt bağlamında asıl provider kimliği kullanılmalı.

Music: ElevenLabs Music v2, ElevenLabs Music v1, Google Lyria 3. ElevenLabs tarafında custom duration, duration slider/presetleri, output format ve Instrumental toggle bulundu.

### Bütün araçlar için katalog listesi

Image Generator, Image Editor, Image Upscaler, Cinematic, Variations, Skin Enhancer, Change Camera, Mockup Generator, Remove Background, Relight; Video Generator, Clip Editor, Video Upscaler, Modify Video, Video Project Editor (experimental), Speak, Video Relight; Voice Generator, Music, Audio Generator, Sound FX, Voice Cloning, Voice Changer, Audio Isolation; Spaces, Spaces Templates, Build Flow; Design, Design Templates, Auto Layers, Legacy Design Editor; 3D Scenes, 3D Generator, 360 Generator.

MCP, Plugins, API, Desktop ve Mobile bağlantı menüleri de katalogda vardı. Bunlar üretim ayarı paneli değil; yalnızca keşif uğruna entegrasyon kurma, API anahtarı oluşturma veya hesap yetkisini değiştirme.

Spaces/design gibi otomatik proje oluşturup kaydeden araçlarda bir paneli görmek için yeni içerik oluşturmanın gerekli olup olmadığını önce incele. Eksik girdi yüzünden bir seçenek görünmüyorsa bunu açıkça kayıt et; yokmuş gibi kabul etme.

## 9. Gerçek sayfada başarılı testler

| Araç / sürüm | Yapılan test ve sonuç | Sonrasında geri alınan değerler / not |
|---|---|---|
| Upscaler, beta.2 | Dört slider `[10,-10,10,-10]`; reload sonrası korundu | İlk değerler `[-3,0,3,0]` geri alındı; son native sürüm testi değildir |
| Image, beta.4 | GPT 2.5 `4:3/1K/High`; Seedream 5 Pro `1:1/1.5K/Fast`; modele dönünce ayrı değerler; GPT reload geçti | GPT/Seedream eski değerlerini geri alma işi hâlâ açık |
| Mockup, beta.6 | 4 mockup + 2K; reload geçti | İlk 2 mockup + 4K geri alındı |
| Music, beta.6 | v2 60 s/Instrumental açık/`mp3_48000_128`; v1 30 s/kapalı/Auto ayrı kaldı; v2 dönüş ve reload geçti | v2 30 s/kapalı/Auto geri alındı |
| Voice, beta.7 | v3 Consistent/stability 1/WAV48000/streaming açık; v2 Neutral 0.5/MP3; v3 dönüş ve reload geçti | v3 Neutral 0.5/MP3_44100_128/streaming kapalı geri alındı; v2 gizli streaming değeri ayrıca kontrol edilmeli |
| Audio, beta.7 | Pitch preset 6 sonra ok tuşuyla 7, anında kayıt; WAV + 7 reload geçti | Pitch 0/MP3 geri alındı |
| Editor, beta.7 | MAI Image 2.5 image count 2; Nano Banana 2 resolution 4K; model dönüşleri ve MAI reload geçti | MAI count 1/Nano 2K geri alındı; seçili model başlangıçtakinden farklı olabilir |
| Adjust, beta.8 | Vintage preset, kapalı bölümlerdeki kontrast/ışık/grain/tint değerleri reload sonrası korundu | `reset-filters-button` ile sıfır/default geri alındı; Save Changes yapılmadı |
| Relight, beta.8 | Üç ışık; ayrı renk, yön ve intensity; reload sonrası bütün ışıklar/selected index korundu | `relight-reset-settings` ile bir beyaz varsayılan ışığa dönüldü |

Relight testinde bir ışık için UI elevation slider 45, gerçek kaynak 60 gösteriyordu. İkisi de reload öncesi/sonrası aynıydı. Bu UI eşlemesi/clamp farkı gözlendi; yalnızca bu farktan kayıt başarısızlığı çıkarma.

Kanıt ekranları `outputs/magnific-*-test.png`; state gözlemleri `work/magnific-audit/*-reopen.json` ve `*-test.json` dosyalarında. Yeni adapterlerin çalıştığını eski sürüm ekran görüntüsünden çıkarma.

## 10. Yerel test altyapısı

Gerçek Vue + jsdom kullanılıyor. Dev DOM component pointer'ları olmayan production vnode yolu da test edildi. Bu testler gerçek sitenin yerine geçmez; zamanlama, form kimliği ve kayıt kurallarını izole kontrol eder.

Taşınan proje Node.js 24 ile test edilir. Bağımlılıklar Vue `3.5.43`, jsdom `29.1.1`; kökteki `package.json` ve `package-lock.json` ile sabitlenmiştir. Test importları yeni proje yapısına uyarlandı; userscript kaynak kodu değiştirilmedi.

Bağımlılıklar yoksa proje kökünde:

```powershell
npm ci
```

Mevcut test komutları:

```powershell
node tests/test-generic-memory.mjs
node tests/test-generic-memory.mjs --native
node tests/test-generic-memory.mjs --refs
node tests/test-generic-memory.mjs --editor
node tests/test-generic-memory.mjs --voice
node tests/test-generic-memory.mjs --audio
node tests/test-generic-memory.mjs --music
node tests/test-generic-memory.mjs --duplicates
node tests/test-generic-memory.mjs --unlabeled
node tests/test-generic-memory.mjs --rich-prompt
node tests/test-relight-memory.mjs
node tests/test-adjust-memory.mjs
node tests/test-video-upscale-memory.mjs
```

Önceki oturumda ilk 10 mod beta.8 ile; beta.9 ile Adjust, Relight ve Video Upscaler testleri geçmişti. Depoya taşıma sırasında beta.9 ile **13 senaryonun tamamı yeniden çalıştırıldı ve geçti**. Canlı site yeniden test edilmedi. Voice/Audio/Music fixture'larındaki eski Vue slot uyarıları tek başına başarısızlık değildir.

Testler: senkron slider kaydı, model geçişi/default reset çakışması, ilk kayıt, kapalı seçim alanı, switch/color/nested selector, aynı kimlikli ve etiketsiz kontroller, prompt dışlama, sayfa yeniden açılışı, Editor rota normalize, form kimliği keşfi, sıfır otomatik UI tıklaması.

`test-video-upscale-memory.mjs` ayrıca Topaz alt model ayrımı ve prompt/id yanında duration'ın kısmi kaydını doğrular. Bu fixture'da kullanılan `multiShots` karışık yapı testi mekanizmaya yöneliktir; Video Upscaler'ın gerçek formunda `multiShots` var iddiası değildir. Gerçek multi-shot keşfi Video Generator'da yapılmalıdır.

**Henüz fixture yok / eksik:** Modify Video adapter, gerçek LUT/flip davranışı (Adjust fixture'ında `currentImage` null), kaynak yüklenme yarışı, çoklu model seçimi, bütün tarayıcılar, sekmeler arası canlı değer senkronizasyonu.

## 11. Beta.9'da hazırlanan fakat henüz canlı doğrulanmayan değişiklikler

1. Video Upscaler'ın kapalı Advanced settings dahil kaynak değerleri. Topaz alt modelleri ayrı bağlam.
2. Modify Video ref bag ve gerçek parent form ID keşfi.
3. Katalog/transient/source metadata dışlamasının sıkılaştırılması; özellikle `presets`, `available*`, `*Options`, `*SliderConfig`, `creation`, video source metadata.
4. “Which model should I use?” yardım düğmesinin model bağlamına yanlışlıkla katılmasının önlenmesi. Beta.8 Video Upscaler'da bu sorun gözlendi.
5. LUT seçimini küçük bir kimlik/etiket nesnesi olarak kaydetme.
6. Flip x/y booleans; `api.flip('X'/'Y')` ve görsel ref yüklenince restore.
7. İçerik barındıran yapıların güvenli ayar yapraklarını ayrı yol anahtarlarında kaydetme.

Kaynak hazır diye beta.9'u tamamlanmış sürüm ilan etme. Özellikle restore sırasında doğrudan reaktif atamaların Magnific watcher'larının varsayılan sıfırlamalarıyla etkileşimini canlı kontrol et.

## 12. Devam planı: ne yapılacak, nasıl yapılacak?

### A. Devralma ve ilk doğrulama

1. Beta.9 kaynağını ve beta.8 kurulu dosyasının arşivini oku; depodaki dizin düzenini koru.
2. Kurulu script sürümünü DOM niteliğinden veya Tampermonkey'de kullanıcıya kontrol ettirerek doğrula. Tampermonkey ekranı erişimin yoksa açıkça söyle; kısıtı aşma.
3. Tek Magnific sekmesini kullan. Bir action timeout olursa önce sonucu gözlemle; işlem gerçekleşmiş olabilir.
4. Çalışma başlamadan orijinal ayarları not et. Kullanıcı içeriğini kayıt raporuna gereksiz yere kopyalama.
5. Beta.9 yerel test takımını tamamla; Modify/LUT/flip için anlamlı ek fixture yaz.

### B. Beta.9'u gerçek sitede doğrulama

1. Hazır değişiklikleri toplu olarak yükle; her küçük araştırma için ayrı güncelleme isteme.
2. Reload sonrası `data-magnific-memory-version` beta.9 mu kontrol et.
3. Video Upscaler'da native inventory doluyor mu? Form ID ve context doğru mu? Help metni context'e katılıyor mu?
4. Topaz'ın iki farklı alt modelinde birer ayar seç; A → B → A ve reload ile ayrı kaldığını kanıtla. Açılmamış Advanced settings değerlerini ayrıca kontrol et.
5. Creative/Precision/HDR ayrımını test et; modele ait olmayan ayarın diğer modele yanlış taşınmasını kontrol et.
6. Modify Video'da model/ref bag bağlantısı ve çözünürlük kaydını test et. Kaynak video gerektiren time range/speed ramp alanlarını açıp incele.
7. LUT seçimi ve intensity'yi, x/y flip'i; kapat/aç, reload, farklı görsel açma senaryolarında test et. Kaynak görseli kaydetme; sadece ayar hafızasını kontrol et.
8. Multi-shot'ta prompt ve ID değişmeden duration geri geliyor mu? Mevcut sahne sayısı/ordering nasıl davranıyor? Eksik sahne oluşturulması gerekiyorsa kullanıcı içeriğine müdahale etmeyen tasarım geliştir.

### C. Eksik araç keşfini tamamlama

Her araç/model için şu bilgileri bir JSON kayıtla tut:

```json
{
  "tool": "gerçek araç",
  "route": "gözlenen rota",
  "modelId": "gerçek kimlik veya default",
  "source": "generic ya da gerçek native kaynak",
  "controls": [
    {"identity":"sabit kimlik","type":"slider","min":0,"max":10,"step":1}
  ],
  "menus": [],
  "gatedOrMissing": [],
  "tested": {"save":false,"modelReturn":false,"reload":false}
}
```

Araç kataloğundan görülen bağlantıları kullan. Rota veya hash tahmin ederek bir dizi URL deneme. Seçenek menülerini keşif sırasında açmak gerekli olabilir; userscriptin restore sırasında menü açması ise istenmiyor. Bu iki durumu karıştırma.

Popover tararken `dialog[data-cy]` ile sınırlama. Bazı popover'larda `data-cy` yok. **Yalnızca görünür** `[role="dialog"]` içindeki seçenekleri ve range/number kontrollerini oku; gizli çerez tercih merkezi gibi başka dialog'ları kayda alma. AX ağacındaki checkbox rolü gerçek DOM'da button olarak çıkabilir; güncel DOM rolüne ve görülen `data-cy` değerine göre hedefle.

Kayıt biriktiren helper, her çağrıda mevcut JSON dosyasını okuyup birleştirip yazsın. Kalıcı REPL'deki dış array değişkenine güvenme. Önceki closure/binding problemi 47 Video panelinin sadece 19 ayrıntısının dosyada kalmasına yol açtı. Eski kayıtları yanlışlıkla sıfırlama.

Öncelikler: Voice boş menü kayıtları → Audio menüleri → Relight Light Transfer/preset/resolution → Upscaler bütün modeller → kalan image/3D/audio/video araçları → reference-gated Video/Modify → çoklu model modu.

Yeni kontrol türü bulduğunda model adına göre alan allowlist'i ekleme. Önce mevcut iki yönlü binding veya state taraması yakalıyor mu bak. Yakalamıyorsa ortak tanıma kuralını düzelt veya aracın gerçek form kaynağına adapter ekle. Adapter sadece güvenli ayar alanlarını kullanmalı.

### D. Eski kayıtları koruma ve uyumluluk

v2 migration `magnific-model-memory-v2:model:<tool>::<modelId>` kayıtlarını native restore içinde okuyabiliyor. v1.0.1 migration tamamlanmadı. `legacy/magnific-memory-1.0.1.user.js` ve yedek dosyadan gerçek anahtar/değer biçimini öğren; tahminle migration yazma.

Generic v3 kimliklerinin değişmesi veya beta.8'in yanlış help metinli context'i eski kayıtları kullanılmaz bırakabilir. Bu durumda eski anahtarları silmeden, kesin eşleşme varsa kontrollü migration düşün. Bütün eski tercihlerin otomatik taşındığını test etmeden söyleme.

Chrome ve Firefox ayrı Tampermonkey depolarına sahiptir. Script yüklemek kodu taşır, kayıtları otomatik taşımaz. Firefox'ta `@sandbox raw`, dynamic import ve application state erişimi gerçek kullanıcı kurulumunda denenmeli.

### E. Son teslim

1. Bütün kapsama dair dürüst bir checklist hazırla: gezildi/kaynak keşfedildi/kayıt test edildi/reload test edildi/gated.
2. Test değişikliklerini geri al; bekleyen eski değişiklikler aşağıdaki tabloda.
3. `src/magnific-memory.user.js` güncel kaynaktır; doğrulanan yeni sürümü `releases/` içinde ayrı dosya olarak arşivle. Eski `legacy/` dosyalarının üzerine yazma. Beta.9 geliştirme taslağını sessizce final diye sunma.
4. Sürüm numarasını tutarlı yükselt; isim/namespace değiştirerek ayrı bir script ve ayrı kayıt deposu oluşturma.
5. Kurulum ve bilinen sınırları güncelle. Yerel sunucunun kurulumdan sonra gerekmeyeceğini açıklayabilirsin.
6. Çalışan ve eksik kapsamı somut test kanıtlarıyla raporla. İş bitene kadar “bütün ayarlar eksiksiz destekleniyor” iddiası kullanma.

## 13. Geri alınması bekleyen test durumları

| Durum | Geri dönülecek / kontrol edilecek değer |
|---|---|
| GPT 2.5 | Eski değerler `16:9 / 2K / Medium`; testte `4:3 / 1K / High` bırakılmış olabilir |
| Seedream 5 Pro | Eski `4:3 / 2K / High`; testte `1:1 / 1.5K / Fast` bırakılmış olabilir |
| Voice v2 | Görünür Neutral/MP3 geri alındı; ilk ziyaret sırasında gizli streaming `true` taşıdı. Gerçek desteklenmeyen modelde etkisiz olabilir; varsayımla API müdahalesi yapma |
| Video Generator seçimi | Keşifte PixVerse 5.5 seçildi; başlangıçta Auto vardı |
| Editor model seçimi | Keşifte Nano Banana 2 seçili kaldı; başlangıçta MAI vardı; değerler geri alındı |
| Video Upscaler | Mevcut kaynak video geçici seçilmişti; Creative Magnific Animation & 3D geri alındı; Precision son Topaz alt modeli Themis, HDR Runway Ruby olabilir |
| Modify Video | Son seçilen Grok; başlangıç MiniMax H3; ayar değişikliğinden çok model keşfi durumu |

Bu tablo yeni oturumdaki kullanıcının sonradan yaptığı değişiklikleri ezmek için talimat değildir. Güncel kullanıcı tercihleri değişmişse önce karşılaştır; eski test cleanup'ı diye yeni tercihi körlemesine geri çevirme.

## 14. Kurulum için yerel dosya sunma

Önceki kurulum sunucuları durdurma sırasında kapatıldı. Eski process/session kimliklerini yeniden kullanmaya çalışma.

Mevcut `tools/serve-userscript.mjs`, `src/magnific-memory.user.js` dosyasını `127.0.0.1:43129` adresinden sunar. **Bu beta.9 geliştirme sürümüdür.** Beta.8 arşivinin üzerine kopyalama gerekmez:

```powershell
# Yalnızca test ve canlı kurulum için beta.9 hazır olduğunda:
npm run serve:dev
```

Tarayıcıda:

```text
http://127.0.0.1:43129/magnific-memory.user.js
```

Yüklemeden sonra kullanıcı eski scripti açık tutuyorsa onun üzerine güncelle; aynı işi yapan iki ayrı script aktif olmasın. Reload ve sürüm niteliğiyle doğrula. Portu kullanmıyorsan sadece bu iş için başlattığın sunucuyu kapat; ilgisiz süreçleri sonlandırma.

## 15. Tanılama ve kaynak dosya haritası

Sayfada scriptin yazdığı DOM nitelikleri:

```text
html[data-magnific-memory-version]
[data-magnific-memory-ready]
[data-magnific-memory-context]
[data-magnific-memory-controls]
[data-magnific-memory-inventory]
[data-magnific-memory-state-inventory]
[data-magnific-memory-error]
```

Generic inventory kontrol kimliği, prop, güvenli değer ve ready bilgisini verir. Native inventory kapalı alanların state snapshot'ını gösterir. Hata niteliği ana uygulama yükleme hatalarında kullanılır; native adapter bağlantı hataları sadece console warning olabilir. Inventory varlığını tek başına reload testinin yerine koyma.

Önemli dosyalar:

| Dosya / klasör | Kullanımı |
|---|---|
| `src/magnific-memory.user.js` | En güncel beta.9 kaynak |
| `releases/magnific-memory-beta.8.user.js` | Son kurulu beta.8 kaynak |
| `tests/test-generic-memory.mjs` | Genel/native/modeller/kimlik/prompt fixture |
| `tests/test-relight-memory.mjs` | Çoklu ışık fixture |
| `tests/test-adjust-memory.mjs` | Kapalı Adjust değerleri; LUT/flip genişletilmeli |
| `tests/test-video-upscale-memory.mjs` | Topaz model ayrımı + mixed structure fixture |
| `package.json`, `package-lock.json` | Bağımlılıklar ve lock |
| `work/magnific-audit/` | Keşif JSON'ları ve canlı state kanıtları |
| `work/*-live.js` | Son yayın için resmi CDN'den okunmuş kaynak modüller |
| `work/magnific-live-app.js`, `work/magnific-live-main.js` | Giriş ve ana bundle; site değişirse yeniden doğrula |
| `legacy/magnific-memory-1.0.1.user.js`, `work/magnific-1.0.1-backup.user.js` | v1 kayıt şeması/migration inceleme |
| `legacy/magnific-memory-2.0.1.user.js` | Eski v2 yaklaşımı |
| `work/RESUME.md` | Ham kronolojik notlar; eski bölümleri son durum diye okumama uyarısı |
| `outputs/magnific-*-test.png` | Canlı test ekran kanıtları |

`video-upscale-panels.json` dosya adı yanıltıcı biçimde sadece Video Upscaler'a ait değildir: son helper sabit dosyaya yazdığı için `Modify/...` ve `Speak/default` kayıtları da bu dosyada bulunur. Anahtar isimlerine bak. `voice-panels.json` içindeki boş menus listesi “seçenek yok” demek değildir. `tool-panels.json` eski kısmi kayıtları barındırır; rota doğrulamadan güvenme.

Son yayında incelenen önemli modül dosyaları:

```text
useImageGeneratorForm.BzsJL1jo.v2.js
useAudioGeneratorForm.C0yhzXiJ.v2.js
useMusicGeneratorForm.CfiT1sLJ.v2.js
useVoiceoverForm.DUVNIjjb.v2.js
useRelightToolForm.0-pwzGh2.v2.js
useGlobalCanvasRetouch.DeFRS4Eq.v2.js
SingleCanvasAdjustPanel.D_BC2BGq.v2.js
useVideoUpscaleForm.DlSoqnFS.v2.js
VideoUpscalerTool.DqImV_so.v2.js
VideoUpscalerToolForm.R1g3MeHH.v2.js
useVideoUpscaleTool.CC0LtZKy.v2.js
useVideoModifyForm.DIFmBjNq.v2.js
VideoModifyTool.DVT5XPFI.v2.js
useVideoModifyTimeRanges.BHbPlF6s.v2.js
useVideoSpeedRampForm.CuXrrxt5.v2.js
LutSelectorModal.BvNTPFLQ.v2.js
useLuts.CjUaE5es.v2.js
TalkingVideosForm.DPEcAv_d.v2.js
```

Bunlar `https://cdn.magnific.com/ait/assets/` altında gözlenen resmi kaynaklardır. Yeni sürümde isim değişebilir. Kaynak incelemesi read-only yapılabilir; scriptin kendisinin reaktif kaynağa yazması, kullanıcı tarafından istenen ayar geri yükleme davranışıdır. Otomasyon aracının read-only evaluate kısıtı varsa bu kısıtı sayfa içi script enjeksiyonuyla aşma.

## 16. Özellikle kaçınılacak yanlışlar

- Beta.8 kurulu ile beta.9 geliştirme kaynağını karıştırmak.
- Eski `2.0.1` ana çıktı dosyasını güncel final diye vermek.
- “47 modelin bütün ayrıntısı JSON'da var” demek; 19 ayrıntı korunmuş.
- CSS class, seçili dropdown metni veya tek bir sayısal DOM sırasını her yerde güvenilir kalıcı kimlik sanmak.
- Sadece Vue development DOM pointer'larına bağlanmak.
- Gerçek form kimliğini bulmadan varsayılan ID ile yeni ve boş form örneği oluşturmak.
- Native kayıt varken eski generic widget kaydını aynı anda uygulamak.
- Prompt/ref/source verisini ayar adı altında kaydetmek; null source metadata kaydıyla mevcut referansı temizlemek.
- LUT/flip/multi-shot desteğinin kodda bulunmasını canlı test yapılmış saymak.
- Model geçişindeki varsayılan resetleri kullanıcı değişikliği gibi kaydetmek.
- Yeni kontrol türünü desteklemek yerine model adı → sabit alan listesi eklemek.
- Görünmeyen/girdi isteyen alanı hiç yokmuş gibi raporlamak.
- Test uğruna Generate, Upscale, 12-frame preview, Generate speech, Preview voice, Save changes gibi üretim/kayıt işlemlerini başlatmak.
- Browser bağlantısı kopunca kullanıcıya script sayfayı dondurdu demek.
- Gereksiz sekmeleri açık bırakmak veya her küçük değişiklikte kullanıcıya yeniden kurulum yaptırmak.

## 17. İşin tamamlanma ölçütü

Tamamlanmış sayılması için yeni kontrol tanıma mekanizmasının farklı türlerde çalışması, her modelin değerlerinin ayrılması, kapalı alanların geri gelmesi, sayfa reload ve model dönüşlerinin doğrulanması, prompt/referansların korunması ve geri yüklemede sıfır görünür menü tıklaması gerekir. Bütün araç/model gezilerinin kapsamı da açık bir raporda yer almalı. Siteye bağlı kararlı API garantisi olmadığı için gelecekteki yayın kırılmaları dürüstçe açıklanmalı.

Bu belgeyi okuyup yalnızca “anladım” veya plan sunmakla yetinme. Kullanıcı devam etmeyi istediğinde önce beta.9'un eksik doğrulamalarını yap, sonra keşif kapsamını tamamla ve somut dosyayı teslim et.

## 18. DeepSeek ortamına aktarım ve araç gereksinimi

Bu belge ve ZIP, Codex'in açık Chrome bağlantısını, Tampermonkey kayıtlarını veya Magnific oturumunu yeni asistana otomatik aktarmaz. DeepSeek'i kullandığın istemcinin dosya ve tarayıcı araçları yoksa yeni asistan yerel klasörü okuyamaz ve hesabın açık sayfayı kendiliğinden kontrol edemez. O durumda belge/kod üzerinden analiz yapabilir; canlı keşif için araç erişimi sağlanması veya kullanıcının gözlem/test yapması gerekir. Canlı erişimi olmadan “bütün araçları gezdim” diye raporlamamalı.

Aktarım sırası:

1. DeepSeek'e bu deponun adresini veya bu MD'yi ver; önce README ve STATUS belgelerini okumasını iste.
2. Yerel kod araçları olan bir istemci kullanıyorsan mevcut checkout'u aç veya depoyu yeni klasöre clone et. Ham hesap kayıtları gerekiyorsa yalnızca yerel `private/` klasöründen yararlan.
3. Tarayıcı erişimi varsa mevcut, oturum açık Chrome/Magnific sekmesini gözlemleyerek seç. Kod dosyalarını yüklemek için ayrı Firefox profili açılması gerekmiyor.
4. Codex'in `cua_repl`, `chrome`, `auditTab` gibi API/binding isimleri yeni araçta bulunmayabilir. İşlem mantığını yeni aracın desteklenen API'sine taşı; bu isimleri varmış gibi kullanma.
5. Başlangıç kontrolünü bu belgeye ve gerçek dosyalara dayandır. Kod düzenleme/test için eksik araç erişimi varsa bunu somut belirt; tahmini sonuç üretme.

ZIP'teki eski sürümler ve ham `RESUME.md` yalnızca tarihçe/migration incelemesi içindir. Ham notlardaki “beta.8 henüz yüklenmedi” ve “sunucu açık” gibi önceki satırlar son durum değildir: beta.8 yüklendi ve bu işin iki yerel kurulum sunucusu durduruldu. Son doğrulanmış durum için bu belgenin 3, 9, 11 ve 12. bölümlerini kullan.
