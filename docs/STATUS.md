# Güncel durum

Başlangıç tarihi: 27 Eylül 2026. Proje DeepSeek'e devir için mevcut çalışmadan taşındı. Canlı Magnific keşfi bu taşıma sırasında sürdürülmedi.

## Sürümler

- `src/magnific-memory.user.js`: beta.9 geliştirme kaynağı.
- `releases/magnific-memory-beta.8.user.js`: son kurulu beta.8'in değiştirilmemiş arşivi.
- Yerel test ve kurulu script sürümü ayrı şeylerdir; kullanıcı tarayıcısındaki gerçek sürüm yeni oturumda kontrol edilmeli.

## Kanıtlanan canlı davranışlar

| Araç | Son başarılı test | Not |
|---|---|---|
| Image Upscaler | beta.2 dört slider + reload | Son native sürümün tüm modelleri yeniden test edilmeli |
| Image Generator | beta.4 GPT/Seedream bağımsız ayarlar; GPT reload | Bazı eski test değerlerinin geri alınması açık |
| Mockup | beta.6 count/resolution reload | Orijinal değerler geri alındı |
| Music | beta.6 v1/v2 ayrımı ve reload | Orijinal değerler geri alındı |
| Voice | beta.7 v2/v3 ayrımı ve v3 reload | Gizli streaming değeri kontrol edilmeli |
| Audio | beta.7 pitch/output reload | Orijinal değerler geri alındı |
| Editor model paneli | beta.7 count/resolution ayrımı ve reload | Orijinal değerler geri alındı |
| Editor Adjust | beta.8 preset/kapalı değerler reload | Reset yapıldı; yeni LUT/flip test edilmedi |
| Relight | beta.8 üç ışık reload | Reset yapıldı |

## Öncelikli yapılacaklar

- [ ] Beta.9 Modify adapter fixture; LUT/flip için gerçek görüntü ref'iyle fixture.
- [ ] Beta.9 Video Upscaler canlı form ID, kapalı Advanced settings, Topaz alt model A → B → A ve reload.
- [ ] Beta.9 Modify canlı kayıt; video gerektiren time range/speed ramp seçenekleri.
- [ ] LUT/intensity ve x/y flip canlı testleri; farklı görsel açma ve reload.
- [ ] Video Generator multi-shot güvenli duration kaydı; prompt/ID korunması, sıralama ve eksik sahne davranışı.
- [ ] Voice menü JSON'ları yeniden çıkarılmalı; eski boş menüler seçenek yok anlamına gelmiyor.
- [ ] Audio'nun bütün range/preset/output seçenekleri.
- [ ] Relight Light Transfer/preset/resolution menüleri.
- [ ] Image Upscaler bütün Creative/Precision modelleri ve bağlam ayrımı.
- [ ] Image Generator ilk modellerin eksik kapalı menüleri ve çoklu model modu.
- [ ] Kalan image/video/audio/3D/design araçlarının koşullu seçenekleri.
- [ ] Firefox gerçek kurulum uyumluluğu.
- [ ] v1 kayıt migration; beta.8 yanlış help-context kayıtları için güvenli geçiş değerlendirmesi.
- [ ] Eski GPT/Seedream test tercihlerini kullanıcı sonradan değiştirmediyse geri alma.
- [ ] Kapsam raporu, son sürüm/kurulum açıklamaları ve final dosya.

## Keşif kayıtlarının sınırları

- Image: yaklaşık 50 benzersiz model; model listesi 53 satır, panel dosyası 51 kayıt. Bu üç sayı aynı anlama gelmez.
- Editor: 32 model paneli.
- Video: 47 panel gezildi, fakat eski REPL closure problemi yüzünden ayrıntılı JSON sadece 19 modelde kaldı.
- Voice: 5 panel gezildi; menü kayıtları boş ve yeniden okunmalı.
- Music: 3; Modify: 6; Video Upscaler ana modeller ve 11 Precision Topaz alt modeli gezildi.
- Bazı eski tool kayıtları yanlış/eski rota olabilir. Her kayıt güncel sayfayla doğrulanmalı.

## Yerel kayıtlar

Önceki ham keşifler, CDN kaynakları ve ekran kanıtları `private/original-handoff/` içinde. Git deposunda yoktur. Eski ham notlar kronolojiktir; son durumu anlamak için bu belge ve `HANDOFF.md` esas alınmalı.

## Taşıma doğrulaması

- Node.js 24.14.0 ile `npm ci` ve `npm test`: 13 senaryonun tamamı geçti.
- Userscript beta.9 davranış kodu orijinal geliştirme kaynağıyla aynı; sadece dosya sonu boşlukları düzenlendi. Ham kopya `private/` altında korunuyor.
- Test dosyalarının import/kaynak yolları yeni klasörlere uyarlandı. Voice/Audio/Music fixture'larının eski Vue slot uyarıları sürüyor; testleri başarısız kılmıyor.
- Native Modify, LUT/flip ve gerçek çoklu model/sahne senaryolarının eksik canlı testleri devam ediyor.
- `private/` ve `node_modules/` Git dışında; hesap kanıtları GitHub'a gönderilmiyor.
- CI, push ve pull request üzerinde aynı yerel test takımını çalıştıracak şekilde eklendi.
- İlk Linux CI çalışması generic fixture'ın sabit süreli beklemesinde erken assertion yaptı. Test, gerçek binding `ready` durumunu sınırlı süre içinde bekleyecek şekilde düzeltildi; userscript davranışı değiştirilmedi.
