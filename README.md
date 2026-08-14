# Repositori Dokumentasi SIMRS RSUD Soedomo

Repositori ini berisi seluruh dokumentasi teknis, standar arsitektur, panduan basis data, kaidah UI modal form, serta cetak biru (*blueprint*) E-Rekam Medis (ERM) resmi untuk **SIMRS RSUD Soedomo**.

## 📖 Daftar Isi Dokumentasi

Untuk membaca dokumentasi lengkap, silakan buka file-file berikut:

1. **[Index Utama Dokumentasi](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/index.md)** (`index.md`)
2. **[Kaidah Pembuatan Database](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-style.md)** (`database-style.md`)
3. **[Referensi Fungsi DB Helper](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-helper.md)** (`database-helper.md`)
4. **[Blueprint E-Rekam Medis (ERM)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/erm.md)** (`erm.md`)
5. **[Kaidah UI Modal Form](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/modal-style.md)** (`modal-style.md`)
6. **[Kaidah Modal Print & PDF Cetak](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/list-cetak.md)** (`list-cetak.md`)
7. **[Panduan Solusi & Penanganan Error](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/solve-eror.md)** (`solve-eror.md`)

## 🛠️ Standar Pengolahan SIMRS

- **Database**: PostgreSQL 12+ (`postgre`)
- **Key Generator**: `DB::get_id($modul)` dengan PostgreSQL Transaction-Level Advisory Lock (`pg_advisory_xact_lock`) untuk mencegah race condition & ID duplikat.
- **Audit Metadata**: Setiap tabel transaksi wajib memiliki 8 kolom metadata audit log.
- **ERM Access**: 3 Jalur Akses (Offcanvas Static Full Right, Topbar Search ERM Modal, dan In-Page Nav Tab `#erm`).
- **Modal UI**: Dikontrol via `itm.js` (`#my-modal-1` dan `#my-modal-2`).
- **Cetak PDF**: Dikontrol via `_modalPrint()` / `_modalPrintTTE()` dan di-stream oleh library `PdfDom`.