# Magnific Memory

Magnific araçlarının ayarlarını model başına hatırlayan Tampermonkey userscript'i. Ayarlar değiştiğinde kaydedilir; modele dönüldüğünde veya sayfa açıldığında uygulamanın gerçek ayar bağları üzerinden geri yüklenir. Prompt, negative prompt ve kullanıcı içeriği kaydedilmez.

**Geliştirme devam ediyor. Bütün araçlar ve seçenekler henüz doğrulanmadı.**

| Dosya | Durum |
|---|---|
| [src/magnific-memory.user.js](src/magnific-memory.user.js) | `3.0.0-beta.17` geliştirme kaynağı; Video Upscaler, Modify Video (Clip Editor dahil), Editor Adjust, Music, Voice, Audio, Image Editor, Relight, Image Upscaler, Image/Video Generator (çoklu model, multi-shot), Cinematic Shot, Sound FX, Voice Changer, Skin Enhancer canlı doğrulandı; kalan araçlar için `docs/STATUS.md` |
| [releases/magnific-memory-beta.17.user.js](releases/magnific-memory-beta.17.user.js) | 27 Eylül 2026'da Chrome'a yüklü beta.17'nin arşivi |
| [releases/magnific-memory-beta.16.user.js](releases/magnific-memory-beta.16.user.js) | beta.16 arşivi |
| [releases/magnific-memory-beta.12.user.js](releases/magnific-memory-beta.12.user.js) | beta.12 arşivi |
| [releases/magnific-memory-beta.11.user.js](releases/magnific-memory-beta.11.user.js) | beta.11 arşivi |
| [releases/magnific-memory-beta.8.user.js](releases/magnific-memory-beta.8.user.js) | Öncesinde yüklü beta.8'in değiştirilmemiş arşivi |

## Takip ve devir

- [Durum ve yapılacak işler](docs/STATUS.md)
- [Ayrıntılı DeepSeek devir belgesi](docs/HANDOFF.md)
- [Sürüm geçmişi](CHANGELOG.md)
- [Katkı ve test akışı](CONTRIBUTING.md)
- [Asistan çalışma kuralları](AGENTS.md)

Her modelin değerleri ayrı tutulur; alan tanıma mekanizması ortaktır. Destek, model adlarına bağlı alan listelerinden oluşmaz. Site Vue kontrol bağları ve araç formunun reaktif kaynakları kullanılır. Magnific'in dahili modülleri değişebileceği için yeni site yayınlarında uyumluluk kontrolü gerekir.

## Yerel geliştirme

Node.js 24 LTS ile doğrulanmıştır.

```sh
npm ci
npm test
```

Testler gerçek Vue + jsdom ile çalışır; canlı Magnific testlerinin yerini tutmaz. Geliştirme kaynağını Tampermonkey kurulum ekranına sunmak için:

```sh
npm run serve:dev
```

Ardından `http://127.0.0.1:43129/magnific-memory.user.js` adresini açın. Bu adres **güncel geliştirme dosyasını** (şu an beta.17) sunar. Kurulumdan sonra sunucunun sürekli çalışması gerekmez. Yükleme, mevcut Magnific hafıza betiğinin üzerine güncelleme olarak yapılmalı; iki sürüm aynı anda etkin olmamalı. Zaten kurulu sürümü güncellemek için Tampermonkey panosundaki "Güncellemeleri denetle" eylemi de bu adresi yeniden okur.

## Klasörler

```text
src/          Güncel userscript
tests/        Yerel testler
tools/        Test ve kurulum yardımcıları
docs/         Devir, durum ve teknik keşif kayıtları
releases/     Kurulu sürüm arşivleri
legacy/       Eski kaynaklar; migration incelemesi için
private/      Yalnızca yerel ham kayıtlar; Git dışında
```

Gerçek hesap ekran görüntüleri, ham sayfa kayıtları ve indirilen Magnific bundle dosyaları `private/` altında yerel olarak tutulur; bu depoya yayımlanmaz. Kullanıcı tercihleri Tampermonkey'nin depolamasındadır; Git deposu bu tercihleri veya oturum bilgilerini taşımaz.

Bu proje bağımsızdır; Magnific'in resmi bir entegrasyonu değildir.
