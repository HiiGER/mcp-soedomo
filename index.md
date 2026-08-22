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
| [ modal-style.md & panduan-erm-mulus.md ]                                         |
| BENCHMARK MUTLAK: list_pengkajian_geriatri_rajal_modal.php (RM 13.8.1)            |
| 1. Isolasi line 1: <?php include '_js_list_..._modal.php' ?>                      |
| 2. Tombol "+ Tambah Data" -> _modal(event, {uri: '.../form_...'}, 2)              |
| 3. Tombol "Cetak" -> _modalPrint(event, {uri: '.../cetak_...'}, 5)                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 5: UI MODAL LEVEL 2 - FORM INPUT                                            |
| [ modal-style.md & panduan-erm-mulus.md ]                                         |
| BENCHMARK MUTLAK: form_pengkajian_geriatri_rajal_modal.php (RM 13.8.1)            |
| 1. Isolasi line 1: <?php include '_js_form_..._modal.php' ?>                      |
| 2. Multi-trigger Live JS: onchange/onclick inline + $(document).on('change click')|
| 3. Footer Action Buttons: Simpan (btn-primary) & Batal (btn-default).             |
| 4. Auto-populate Diagnosis & Dokter DPJP dari dat_anamnesis & dat_registrasi      |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| TAHAP 6: LEMBAR CETAK PDF DOMPDF                                                  |
| [ list-cetak.md & panduan-erm-mulus.md ]                                          |
| BENCHMARK MUTLAK: cetak_pengkajian_geriatri_rajal.php (RM 13.8.1)                |
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

## 🔑 KAIDAH MANDATORI PARAMETER NAVIGASI (`?n=...` / `nav_id`)

Pada sistem SIMRS RSUD Soedomo, parameter URL `n` (`?n=...`) merepresentasikan **Navigation ID (`nav_id`)**, yaitu hash/identifier unik dari menu/navigasi yang sedang diakses.

> [!IMPORTANT]
> Parameter `n` adalah **MANDATORI** pada setiap pembentukan URL (Routing Controller, Form Action, AJAX Request, DataTables Endpoint, dan Link Cetak PDF).

### 1. Mengapa Parameter `n` Wajib?
1. **Validasi Otorisasi & Hak Akses (`MY_Controller.php`)**:
   Core Controller secara otomatis memeriksa `$this->nav_id = _get('n')`. Jika `n` tidak disertakan atau tidak valid di database master navigasi, sistem akan **menolak request dan melakukan redirect paksa ke Dashboard** (`app/dashboard?n=...`).
2. **Isolasi State Session per Menu (`nav_sess`)**:
   Setiap menu menggunakan hash `n` sebagai *key* untuk mengisolasi session variabel (seperti pencarian, filter, dan temporary data) agar tidak bentrok antar menu yang dibuka bersamaan.
3. **Pagination & Limit State (`itm_helper.php`)**:
   Helper pagination (`_pg_sess`, `_pg_info`, `_pg_limit`) membaca `_get('n')` untuk menghitung limit, offset, dan total record per-halaman.

### 2. Standar Penulisan Sintaks Parameter `n`

| Konteks | Contoh Sintaks Baku (PHP / JS) |
| :--- | :--- |
| **Offcanvas / Modal Trigger (JS)** | `uri: '<?= $this->uri . "/erm/" . $pelayanan_id . "?n=" . _get("n") ?>'` |
| **AJAX Request URL** | `url: '<?= $this->uri . "/ajax_save?n=" . _get("n") ?>'` |
| **DataTables Server-Side URL** | `"url": "<?= $this->uri . "/ajax_datatables?n=" . _get("n") ?>"` |
| **Link Cetak PDF / Window Open** | `href="<?= $this->uri_pelayanan . '/cetak_label/' . $id . '?n=' . _get('n') ?>"` |
| **Form Action Submit** | `$d['form_act'] = site_url($this->template) . 'save/' . $id . '?n=' . _get('n');` |

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
   - Inventarisasi 24 poin solusi penanganan error sistem.
7. **[Panduan Pengerjaan ERM Mulus & Presisi](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/panduan-erm-mulus.md)** (`panduan-erm-mulus.md`)
   - Breakdown 7 langkah alur pengerjaan ERM terbukti mulus, kalkulasi JS real-time, auto-populate data klinis & DPJP, serta Kop Cetak 3-Kolom.
8. **[Panduan Penggunaan GridTable Dinamis](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/grid-table.md)** (`grid-table.md`)
   - Kaidah pemetaan data array terurut, auto-fill dinamis dari pengkajian, penanganan unset POST array, dan rendering cetak Dompdf.
