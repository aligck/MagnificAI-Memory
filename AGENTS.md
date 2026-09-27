# Magnific Memory üzerinde çalışma

Önce `docs/STATUS.md`, ardından `docs/HANDOFF.md` okuyun. Kullanıcı çalışma kapsamını genişletmedikçe mevcut eksikleri tamamlayın; projeye yeni üretim özellikleri eklemeyin.

- Güncel kaynak `src/magnific-memory.user.js`, son kurulu sürüm arşivi `releases/magnific-memory-beta.8.user.js`.
- Beta.9 henüz canlı doğrulanmış final değildir. Yerel testlerin geçmesi canlı kapsamın tamamlandığı anlamına gelmez.
- Ortak alan tanıma, model başına ayrı değerler. Model adına bağlı alan allowlist'i eklemeyin.
- Prompt, negative prompt, talimat, script/metin içeriği, referanslar, dosyalar ve oturum bilgilerini depolamayın.
- Geri yüklemede menü açıp seçeneklere tıklamayın; gerçek Vue bağını veya güvenli reaktif form kaynağını kullanın.
- Magnific'in form kimliği ve asset hash'lerini tahmin etmeyin; gerçek bileşen/source üzerinden doğrulayın.
- Native kayıt yolu varken eski generic widget kayıtlarını aynı anda uygulamayın.
- Yeni test/değişiklikten sonra `npm test` çalıştırın. Canlı testleri ayrıca durum belgesine yazın.
- Kullanıcı üretim/kredi harcamayı ayrıca istemedikçe Generate/Upscale/Preview/Save Changes işlemlerini test amacıyla başlatmayın.
- Tek keşif sekmesini kullanın; gereksiz kurulum sekmelerini kapatın. Araç bağlantısı hatasını userscript arızası olarak raporlamayın.
- Gerçek hesap ekranları, ham state/DOM kayıtları ve üçüncü taraf bundle'lar yalnızca Git tarafından dışlanan `private/` altında tutulmalı. Kimlik bilgileri ve referans URL'lerini commit etmeyin.
- Eski test ayarlarını geri alırken kullanıcının sonradan değiştirdiği tercihleri körlemesine ezmeyin.
- Scriptin `@name` ve `@namespace` değerlerini sırf proje adı değişti diye değiştirmeyin; Tampermonkey kayıtları kaybolabilir veya ikinci script oluşabilir.
- Değişiklik yapınca `docs/STATUS.md` ve gerekiyorsa `CHANGELOG.md` güncelleyin. İlerlemeyi, doğrulanmış kapsamı ve eksikleri ayırın.
