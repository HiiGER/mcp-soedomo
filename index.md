# Dokumen Utama Standar SIMRS RSUD Soedomo

Selamat datang di repositori dokumentasi resmi pengembangan **SIMRS RSUD Soedomo**. Dokumentasi ini dirancang sebagai acuan mutlak bagi pengembang dan agen kecerdasan buatan (AI) untuk menghasilkan sistem E-Rekam Medis (ERM) yang 100% konsisten, presisi, dan aman.

---

## 🗺️ KAMUS TAHAPAN EKSEKUSI ERM (ALUR MANDATORI STEP-BY-STEP)

Untuk memastikan konsistensi mutlak 100%, setiap pembuatan atau refactoring modul ERM **WAJIB MENGIKUTI URUTAN TAHAPAN EKSEKUSI BERIKUT**:

```
+-----------------------------------------------------------------------------------+
| TAHAP 1: DATABASE SCHEMA & AUDIT LOGS                                             |
| [ database-style.md & database-helper.md ]                                        |
| 1. DDL Tabel PostgreSQL (dat_... / mst_...) + 8 Kolom Audit Log Mandatori.        |
| 2. Kolom TTD Non-Pegawai (jika ada): [nama]_nm VARCHAR(150), [nama]_ttd TEXT.     |
| 3. Concurrency-safe ID: DB::get_id($table) -> DB::insert() -> DB::update_id().    |
| 4. DML Registrasi Menu ERM ke mst_erekam_medis.                                   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 2: MODEL & DATATABLES SERVER-SIDE                                           |
| [ database-helper.md & erm.md ]                                                   |
| 1. Method DataTables Server-Side: DB::datatables_query('SELECT * FROM (...) a').  |
| 2. Method get_modul() & save_modul().                                             |
| 3. MANDATORI LOG ERM: Wajib memanggil log_erm(...) agar menu ERM berubah hijau.  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 3: CONTROLLER HMVC                                                          |
| [ erm.md & list-cetak.md ]                                                        |
| 1. Route List Modal Level 1: list_..._modal($pelayanan_id)                        |
| 2. Route Form Modal Level 2: form_..._modal($pelayanan_id, $id)                   |
| 3. Route AJAX Submit & Route Cetak PDF (dengan ini_set("memory_limit", "-1")).    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 4: UI MODAL LEVEL 1 - LIST HISTORY DATA                                     |
| [ modal-style.md ]                                                                |
| BENCHMARK MUTLAK (TRACKED): list_informed_consent_tonsilektomy_modal.php          |
| 1. Isolasi line 1: <?php include '_js_list_..._modal.php' ?>                      |
| 2. Tombol "+ Tambah Data" -> _modal(event, {uri: '.../form_...'}, 2)              |
| 3. Tombol "Cetak" -> _modalPrint(event, {uri: '.../cetak_...'}, 5)                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 5: UI MODAL LEVEL 2 - FORM INPUT                                            |
| [ modal-style.md ]                                                                |
| BENCHMARK MUTLAK (TRACKED): form_informed_consent_tonsilektomy_modal.php          |
| 1. Isolasi line 1: <?php include '_js_form_..._modal.php' ?>                      |
| 2. DILARANG wrapper <div class="modal"> & <div class="card">, DILARANG bg-color.  |
| 3. Footer Action Buttons: Simpan (btn-primary) & Batal (btn-default).             |
| 4. Single-Entry TTD Pihak Non-Pegawai: _modalTtd(callback, 'nama', label, name)  |
|    dengan triple fallback (this.result -> canvas_0.toDataURL() -> #canvas_image_0)|
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 6: LEMBAR CETAK PDF DOMPDF                                                  |
| [ list-cetak.md ]                                                                 |
| BENCHMARK MUTLAK (TRACKED): cetak_informed_consent_tonsilektomy.php               |
| 1. Kop Surat 3-Kolom Murni (Box Profil & Box Registrasi height: 105px simetris).  |
| 2. Title Dokumen di bawah Kop Surat, Digit Box / metadata khusus di body.         |
| 3. CSS Style: font 9.5px, .page-wrapper (border: 1.5px solid #000).               |
| 4. Centang DejaVu Sans (&#9745; / &#9744;), TTD Rendering via format_ttd_src().   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 7: VERIFIKASI & HANDLING ERROR                                              |
| [ solve-eror.md ]                                                                 |
| 1. Uji AJAX Save, DataTables Redraw, & Status Indikator Hijau ERM.                |
| 2. Konsultasi 12 Poin Solusi Error di solve-eror.md jika terjadi kendala.         |
+-----------------------------------------------------------------------------------+
```

---

## 📚 Daftar Berkas Dokumentasi

1. **[Kaidah Pembuatan Database](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-style.md)** (`database-style.md`)
   - Standar DDL, penamaan tabel, 8 kolom audit log mandatori, dan DML registrasi menu ERM.
2. **[Referensi Fungsi DB Helper](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-helper.md)** (`database-helper.md`)
   - `DB::get_id($table)` dengan PostgreSQL Transaction Advisory Lock, `DB::insert()`, `DB::update()`, dan subquery DataTables.
3. **[Blueprint E-Rekam Medis (ERM)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/erm.md)** (`erm.md`)
   - Pintu akses ERM, integrasi `log_erm()` untuk warna status indikator hijau tebal.
4. **[Kaidah UI Modal Form](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/modal-style.md)** (`modal-style.md`)
   - Acuan paten `form_informed_consent_tonsilektomy_modal.php`, aturan multi-level modal (`_modal`), dan efisiensi TTD `_modalTtd`.
5. **[Kaidah Modal Print & PDF Cetak](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/list-cetak.md)** (`list-cetak.md`)
   - Acuan paten `cetak_informed_consent_tonsilektomy.php`, Kop Surat 3-Kolom Murni & Simetris (`height: 105px;`), dan styling Dompdf.
6. **[Panduan Solusi & Penanganan Error](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/solve-eror.md)** (`solve-eror.md`)
   - Inventarisasi 12 poin solusi penanganan error sistem.
