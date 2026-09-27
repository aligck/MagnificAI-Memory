# Geliştirme akışı

1. `docs/STATUS.md` içinde somut bir açık seçin.
2. `src/magnific-memory.user.js` üzerinde ortak mekanizmayı düzeltin; yeni model başına alan listesi oluşturmayın.
3. İlgili gerçek Vue fixture'ını ekleyin veya genişletin. Mevcut davranışı aynalayan gereksiz testler yerine hatayı yakalayan senaryoyu kullanın.
4. `npm ci` ve `npm test` ile doğrulayın.
5. Gereken canlı testleri oturum açık Magnific sekmesinde gerçekleştirin. Kaydetme, A → B → A, reload ve içerik korunmasını ayrı gözlemleyin.
6. Sonucu `docs/STATUS.md` içine kanıt düzeyiyle yazın. Hesap içerikli kanıtlar yalnızca `private/` içinde kalsın.
7. İncelemeye uygun commit veya PR oluşturun.

Yeni ortamda sadece sohbet modeli varsa yerel klasör ve tarayıcı oturumuna otomatik erişim olmaz. Canlı araca erişmeden bütün menüler gezilmiş gibi raporlamayın.

`npm run serve:dev` güncel `src/` dosyasını loopback adresinden sunar; kurulum için kullanılır. Kurulumdan sonra bu sunucu scriptin çalışması için gerekli değildir. Her sürüm Tampermonkey'nin kendi onay ekranından kurulur.

Kurallar:
- Kayıt dışlama kuralları değişirse `cleanup()` içindeki `revisionOfRules` değerini artırın; eski kayıtlar bir kez temizlenir.
- Bağlam anahtarı rota + model + alan kimliğidir. Rota, uygulama router'ındaki dinamik parçalar (`:creationId` vb.) atılarak oluşturulur; açık olan varlık kimliği anahtara girmemelidir.
- Yeni testin, düzelttiği kusura sahip önceki sürümde başarısız olduğunu doğrulayın.
