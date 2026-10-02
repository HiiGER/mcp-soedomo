# 📋 SOP & ANGKET VERIFIKASI KUALITAS KODE (SYSTEM ANALYST QUALITY GATE)
**Standar Evaluasi, Optimalisasi Performa, Efisiensi Query, dan Integritas Data SIMRS RSUD Soedomo**

Dokumen ini merupakan **Quality Gate Mandatori** bagi Developer dan AI Assistant setelah melakukan perubahan kode, perbaikan bug, atau penambahan fitur baru pada modul SIMRS RSUD Soedomo. Format penilaian dirancang layaknya **System Analyst / Technical Lead** untuk memastikan kode yang masuk ke sistem bersifat **optimal, ringan, konsisten, aman, dan bebas dari kode sampah**.

---

## 🎯 1. Filosofi & Fleksibilitas Scope Penilaian

Penilaian bersifat **fleksibel dan kontekstual** menyesuaikan jenis pekerjaan yang dilakukan developer:

```
+-----------------------------------------------------------------------------------+
|                        KLASIFIKASI SCOPE PERUBAHAN                                |
+-----------------------------------------------------------------------------------+
| [ Tipe A ] : Backend & Database Query  -> Fokus: Efisiensi SQL, Index, N+1 Query  |
| [ Tipe B ] : UI, Form Modal & AJAX     -> Fokus: Payload Ringan, Response, Validasi|
| [ Tipe C ] : Template Cetak & PDF      -> Fokus: Ukuran Kertas, Layout, Font UTF-8|
| [ Tipe D ] : Refactoring & Optimasi    -> Fokus: Dead Code, Memory, Clean Code    |
+-----------------------------------------------------------------------------------+
```

Developer/AI cukup memverifikasi poin checklist yang relevan dengan scope yang disentuh, namun **seluruh aturan wajib (Pilar 1–5)** tetap berlaku sebagai standar acuan.

---

## 🏛️ 2. Lima Pilar Standar Kualitas (Mandatory Technical Rules)

```
                       LIMA PILAR KUALITAS KODE
    ┌─────────────────────────────────────────────────────────────┐
    │ 1. Optimalisasi & Efisiensi Query (No N+1, Index, JSONB)   │
    ├─────────────────────────────────────────────────────────────┤
    │ 2. Arsitektur Ringan & Performa (Memory Safe, Fast Load)   │
    ├─────────────────────────────────────────────────────────────┤
    │ 3. Integritas & Konsistensi Data (Single Source of Truth)  │
    ├─────────────────────────────────────────────────────────────┤
    │ 4. Clean Code & Dead Code Elimination (Bebas Sampah/Logs)  │
    ├─────────────────────────────────────────────────────────────┤
    │ 5. Standar Ekosistem RSUD Soedomo (Param `?n=`, QR, DejaVu)│
    └─────────────────────────────────────────────────────────────┘
```

---

### 🔹 PILAR 1: Optimalisasi & Efisiensi Query Database

1. **Eliminasi Anti-Pattern N+1 Query**:
   - DILARANG mengeksekusi query database di dalam perulangan (`foreach`, `for`, `while`).
   - Gunakan `WHERE IN (...)`, `JOIN`, atau `jsonb_array_elements` untuk mengambil relasi data secara *batch*.
2. **Proyeksi Kolom Selektif**:
   - Hindari penggunaan `SELECT *` tanpa batas pada transaksi berukuran besar atau laporan data tinggi.
   - Cantumkan kolom-kolom yang spesifik dibutuhkan view/controller.
3. **Pemanfaatan Fitur PostgreSQL (JSONB & LATERAL JOIN)**:
   - Jika data tersimpan dalam format JSON/JSONB (seperti `icd10_dokter`, form dinamis), gunakan operator PostgreSQL seperti `jsonb_array_elements(COALESCE(NULLIF(col, ''), '[]')::jsonb)` dan `->>` langsung pada layer database daripada memparsing string panjang di memori PHP.
4. **Strategi Fallback Query yang Efisien**:
   - Saat mencari data yang mungkin belum terisi di kunjungan berjalan, buat urutan fallback yang terindeks dan cepat (misal: `registrasi_id` -> `pelayanan_id` -> `dat_asesmen_keperawatan_ranap` -> riwayat `pasien_id`), selalu sertakan `LIMIT 1` dan kondisi `WHERE col IS NOT NULL AND TRIM(col::TEXT) != ''`.
5. **Kepatuhan Indeks Database**:
   - Pastikan setiap klausa `WHERE` dan `JOIN` menggunakan kolom berindeks primer/sekunder (`registrasi_id`, `pelayanan_id`, `pasien_id`, `deleted_st = '0'`).

---

### 🔹 PILAR 2: Peningkatan Performa & Arsitektur Ringan (Lightweight System)

1. **Efisiensi Alokasi Memori**:
   - Penggunaan `ini_set("memory_limit", "-1")` HANYA diizinkan pada method rendering dokumen PDF/Excel berkapasitas besar, TIDAK BOLEH digunakan secara global pada AJAX/Controller rutin.
   - Hancurkan (*unset*) objek besar yang tidak lagi dipakai dalam lifecycle proses jika memproses ribuan baris data.
2. **Payload AJAX & Network Optimization**:
   - Endpoint AJAX wajib mengembalikan format JSON murni (`_json(['status' => true, ...])`).
   - Hindari me-render HTML besar yang tidak perlu jika data cukup dikirim via JSON untuk dirender di sisi client.
3. **Optimalisasi Ukuran Dokumen Cetak (PDF)**:
   - Pastikan ukuran kertas PDF sesuai instruksi modul (contoh: **A5 Portrait** `148mm × 210mm` / `$paper = 'a5'`, **A4 Portrait** `210mm × 297mm`, atau **F4/Folio** `8.4 × 11 inci`).
   - Set margin `@page` proporsional (contoh A5: `margin: 0.3cm 0.4cm`) agar seluruh tabel, kop, info klinis, telaah, dan QR code muat dalam satu halaman tanpa *blank-page overflow*.

---

### 🔹 PILAR 3: Integritas Data & Single Source of Truth

1. **Anti-Hardcoded Data Master**:
   - Seluruh data indikator (seperti Indikator Telaah Resep, Edukasi Pasien, Daftar Risiko Jatuh, dsb.) WAJIB diambil secara dinamis dari tabel master (`mst_...`) atau tabel relasi transaksi (`dat_...`), BUKAN teks hardcode di view.
2. **Pemisahan Otoritas Asesmen & Profesi**:
   - Hormati tipe asesmen pada `dat_anamnesis`: Perawat/Bidan (`KEPERAWATAN`/`KEBIDANAN`) vs Dokter DPJP (`MEDIS`).
   - Pengambilan tanda-tanda vital (TTV) dan berat badan wajib memprioritaskan input fisik perawat, sedangkan diagnosa memprioritaskan input dokter (`icd10_dokter`).
3. **Null-Safety & Type-Casting**:
   - Setiap variabel array/objek dari database yang dipanggil pada view wajib menggunakan safe accessor (contoh: `@$main['pasien_nm']`, `!empty(...) ? ... : '-'`).
   - Casting eksplisit pada query PostgreSQL (contoh: `TRIM(berat_badan::TEXT) != ''`) untuk menghindari error tipe data heterogen.

---

### 🔹 PILAR 4: Clean Code & Bebas Kode Sampah (Zero Dead Code)

1. **Pembersihan Log Debugging**:
   - Pastikan TIDAK ADA sisa debugging seperti `console.log()`, `alert()`, `var_dump()`, `print_r()`, `dd()`, atau `die()` pada file produksi.
2. **Penghapusan Komentar Usang & Blok Kode Mati**:
   - Hapus blok kode lama yang di-comment out jika fungsionalitasnya sudah digantikan secara permanen oleh arsitektur baru.
   - Pertahankan komentar yang mendokumentasikan alasan desain teknis (*design rationale*).
3. **Struktur File & Modularitas HMVC**:
   - Pisahkan JavaScript kompleks ke file parsial terisolasi (misal: `_js_index.php`, `_js_form_..._modal.php`).

---

### 🔹 PILAR 5: Standar Ekosistem SIMRS RSUD Soedomo

1. **Mandatori Parameter Navigasi `?n=...`**:
   - Setiap URL routing, form submit, modal URI, DataTables AJAX URL, dan link cetak PDF WAJIB menyertakan `?n=<?= _get('n') ?>`.
2. **Standar TTE & Tanda Tangan Barcode QR**:
   - Tanda tangan dokter/petugas WAJIB berbentuk QR Code 2D yang memuat identitas dan timestamp (`generate_qr_code_base64()` / `generate_ttd()`).
   - Tanda tangan pasien/keluarga bersumber dari Base64 canvas atau file gambar `mst_pasien.ttd`.
3. **Rendering Simbol Unicode & Font DejaVu Sans**:
   - Header HTML view cetak WAJIB menggunakan `<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />`.
   - Simbol checklist (`✓` / `&#10003;`) atau checkbox (`☑` / `&#9745;`) WAJIB dibungkus dengan font **DejaVu Sans** (`<span style="font-family: DejaVu Sans, sans-serif;">&#10003;</span>`) agar tidak hilang pada render DomPDF.

---

## 📝 3. Angket & Checklist Verifikasi Pengembang (Verification Rubric)

Gunakan tabel angket berikut untuk memverifikasi pekerjaan sebelum diserahkan:

| No | Poin Evaluasi System Analyst | Kategori | Status (✅/❌/NA) | Keterangan Verifikasi |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Query Efisiensi**: Tidak ada N+1 query loop, query telah di-filter indeks (`registrasi_id`, `pelayanan_id`). | Database | `[   ]` | |
| **2** | **JSONB Optimization**: Data JSONB (misal: `icd10_dokter`) diproses via query LATERAL/JSONB bawaan database. | Database | `[   ]` | |
| **3** | **Data Dinamis**: Tidak ada indikator/daftar klinis yang di-hardcode di view (mengambil dari `mst_...` / `dat_...`). | Data | `[   ]` | |
| **4** | **Null-Safe Display**: Seluruh output variabel menggunakan fallback default (contoh: `!empty(...) ? ... : '-'`). | Data | `[   ]` | |
| **5** | **Proporsi Kertas PDF**: Ukuran kertas (A4 / A5 / F4) dan `@page` margin presisi tanpa ada halaman kosong ekstra. | Cetak PDF | `[   ]` | |
| **6** | **Simbol & Font PDF**: Simbol centang menggunakan charset `utf-8` dan font `DejaVu Sans` (`&#10003;`). | Cetak PDF | `[   ]` | |
| **7** | **QR & TTE Standar**: QR Code Apoteker, Kasir, DPJP, dan TTD Pasien terisi sesuai standar validasi. | Cetak PDF | `[   ]` | |
| **8** | **Parameter `?n=...`**: Parameter navigasi `?n=...` terpasang pada route/AJAX/Link cetak terkait. | Routing | `[   ]` | |
| **9** | **Zero Debug Code**: Tidak ada sisa `console.log`, `var_dump`, `print_r`, atau `die` liar di dalam kode. | Clean Code| `[   ]` | |
| **10**| **Dead Code Eliminated**: Blok kode usang yang sudah tidak terpakai telah dibersihkan secara rapi. | Clean Code| `[   ]` | |

---

## 🚀 4. Alur Persetujuan Perubahan (Definition of Done)

Perubahan dinyatakan **SELESAI (DONE)** jika:
1. Seluruh poin checklist yang relevan berstatus **Lolos (✅)** atau **Not Applicable (NA)**.
2. Tidak ada error syntax atau exception pada log server.
3. Tampilan UI responsif, ringan, dan output cetak PDF presisi 1 lembar (atau sesuai kebutuhan halaman dokumen).
4. **Mandatori**: Memberikan saran pesan commit (*Conventional Commits*) yang terstruktur rapi.

---

## 💬 5. Standar Saran Pesan Commit (Conventional Commits)

Setelah seluruh langkah verifikasi dan pengujian selesai serta dinyatakan lolos (*All Passed*), AI Assistant / Pengembang **WAJIB** menyertakan rekomendasi pesan commit git dengan standar berikut:

### 📌 Format Header Commit:
```text
<type>(<scope>): <ringkasan singkat dalam bahasa Indonesia / Inggris>
```

### 🏷️ Tipe Commit (`type`):
- `feat`: Penambahan fitur, form baru, atau fungsionalitas baru.
- `fix`: Perbaikan bug, query error, visual glitch, atau perbaikan data hilang.
- `refactor`: Restrukturisasi kode tanpa mengubah fungsionalitas (pemisahan logika, anti-hardcode).
- `perf`: Peningkatan performa, optimasi query, eliminasi N+1, atau pemangkasan memory.
- `docs`: Penambahan atau pembaruan dokumentasi/SOP markdown.
- `style`: Perapian format CSS, tata letak print, atau formatting kode.

### 📝 Contoh Format Saran Commit Lengkap:
```text
feat(farmasi): implementasi dynamic telaah resep A5 & optimasi query diagnosa JSONB

- View: sesuaikan template cetak resep menjadi A5 portrait 1 halaman tanpa overflow
- View: ubah tabel Telaah Resep & Edukasi Pasien menjadi dinamis dari master/transaksi
- Controller: optimasi query diagnosa menggunakan JSONB array dat_anamnesis.icd10_dokter
- Controller: tambahkan multi-tier fallback pencarian Berat Badan (BB) & riwayat alergi
- Cetak: dukung rendering centang DejaVu Sans UTF-8 pada Dompdf
- Quality: lolos uji verifikasi 10 poin System Analyst Quality Gate
```
