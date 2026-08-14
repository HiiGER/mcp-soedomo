# Repositori Dokumentasi SIMRS RSUD Soedomo

Repositori ini berisi seluruh dokumentasi teknis, standar arsitektur, panduan basis data, kaidah UI modal form, serta cetak biru (*blueprint*) E-Rekam Medis (ERM) resmi untuk **SIMRS RSUD Soedomo**.

---

## 🗺️ Kamus Urutan Tahapan Eksekusi ERM (Step-by-Step)

Dalam membangun atau memodifikasi modul ERM, pengembang dan AI **WAJIB MEMAHAMI DAN MENGIKUTI TAHAPAN BERURUTAN**:

1. **[Tahap 1: Database & Advisory Lock ID](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-style.md)**: Buat DDL PostgreSQL (8 kolom audit log wajib) + Registrasi `mst_erekam_medis`.
2. **[Tahap 2: Model & Status Log ERM](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/erm.md)**: Buat DataTables Server-Side query `SELECT * FROM (...) a` & panggil `log_erm()` di method simpan.
3. **[Tahap 3: Controller HMVC](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/erm.md)**: Susun route Level 1 List Modal, Level 2 Form Modal, AJAX submit, & Print PDF.
4. **[Tahap 4: UI Level 1 List Modal](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/modal-style.md)**: Mengacu paten `list_informed_consent_tonsilektomy_modal.php`.
5. **[Tahap 5: UI Level 2 Form Modal & TTD](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/modal-style.md)**: Mengacu paten `form_informed_consent_tonsilektomy_modal.php` + Efisiensi Single-Entry TTD `_modalTtd`.
6. **[Tahap 6: PDF Cetak Dompdf](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/list-cetak.md)**: Mengacu paten `cetak_informed_consent_tonsilektomy.php` + Kop Surat 3-Kolom Murni & Simetris (`height: 105px;`).
7. **[Tahap 7: Audit Solusi Error](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/solve-eror.md)**: Konsultasi 12 poin inventarisasi error jika terjadi kendala runtime.

---

## 📖 Daftar Isi Dokumentasi

1. **[Index Utama Dokumentasi](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/index.md)** (`index.md`)
2. **[Kaidah Pembuatan Database](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-style.md)** (`database-style.md`)
3. **[Referensi Fungsi DB Helper](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-helper.md)** (`database-helper.md`)
4. **[Blueprint E-Rekam Medis (ERM)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/erm.md)** (`erm.md`)
5. **[Kaidah UI Modal Form](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/modal-style.md)** (`modal-style.md`)
6. **[Kaidah Modal Print & PDF Cetak](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/list-cetak.md)** (`list-cetak.md`)
7. **[Panduan Solusi & Penanganan Error](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/solve-eror.md)** (`solve-eror.md`)