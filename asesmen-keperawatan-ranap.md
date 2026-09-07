# 📑 Dokumentasi Standard & Panduan Asesmen Keperawatan Rawat Inap (RM 13.1)

Dokumentasi ini berisi acuan resmi alur kerja, standar pembuatan, prosedur maintenance, mapping database, serta mekanisme auto-fill data pada modul **Asesmen Keperawatan Rawat Inap (Ranap Umum / RM 13.1)** di SIMRS RSUD Soedomo.

---

## 🗺️ 1. STRUKTUR ARSITEKTUR & BEBAN WORKFLOW

```
+-----------------------------------------------------------------------------------+
| CONTROLLER (Pelayanan.php)                                                         |
| • Retrieve Master Pasien (LEFT JOIN mst_agama, mst_pendidikan, mst_bahasa, dll)  |
| • Auto-Fetch Diagnosa Medis & ICD-10 (dat_diagnosis / dat_anamnesis)            |
| • Auto-Fetch PPA Pegawai & Session Pegawai (username_perawat / ttd_nama_terang)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| VIEW WRAPPER & TAB MODAL (asesmen_keperawatan_ranap_umum_modal.php)               |
| [ Tab 1: Pengkajian Fisik & Anamnesa ] -> hal1_pengkajian_fisik.php               |
| [ Tab 2: Riwayat & Skala Nyeri ]     -> hal2_riwayat_nyeri.php                  |
| [ Tab 3: Aktivitas & Risiko Jatuh ]  -> hal3_aktivitas_jatuh.php                  |
| [ Tab 4: Eliminasi & Edukasi ]       -> hal4_eliminasi_edukasi.php                |
| [ Tab 5: Gizi & Diagnosa ]           -> hal5_gizi_diagnosa.php                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| FRONTEND ENGINE (_js_asesmen_keperawatan_ranap_umum_modal.php)                    |
| • Auto-populate Checkboxes/Radios via split('#')                                  |
| • Element-by-element Select2 initialization (dropdownParent: $el.parent())        |
| • Real-time Scoring JS Listeners (Morse, Humpty Dumpty, Braden, MST, Strong Kids)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| MODEL & SAVE ENGINE (M_pelayanan.php)                                             |
| • Date Formatting to YYYY-MM-DD HH:ii:ss via to_date()                            |
| • Array Serializer to Delimited String via implode('#', $val)                     |
| • Safety Truncation untuk Kolom Legacy VARCHAR Tight-Limits                       |
| • Filter strict Data POST via array_intersect_key(..., list_fields())             |
| • E-RM Audit Log via log_erm($erekammedis_id, ...)                                |
+-----------------------------------------------------------------------------------+
```

---

## 📁 2. DIRECTORY & FILE MAPPING

| Layer | Absolute / Relative Path | Deskripsi & Responsibilitas |
| :--- | :--- | :--- |
| **Controller** | `application/modules/pelayanan/controllers/Pelayanan.php` | Handling route modal `form_asesmen_keperawatan_ranap_umum_modal`, submit handler `save_asesmen_keperawatan_ranap_umum`, dan AJAX select2 `all_pegawai_select2`. |
| **Model** | `application/modules/pelayanan/models/M_pelayanan.php` | Method `save_asesmen_keperawatan_ranap_umum` untuk penyimpanan data, sanitasi, array serialization, dan logging. |
| **View Modal** | `application/modules/pelayanan/views/pelayanan/asesmen/asesmen_keperawatan_ranap_umum_modal.php` | Wrapper modal utama 5 Tab (Halaman 1 - 5). |
| **Tab 1 View** | `.../asesmen_keperawatan_ranap_umum/hal1_pengkajian_fisik.php` | Anamnesa (Auto), TTV, Pengkajian Fisik Sistem Organ, & Skala Braden. |
| **Tab 2 View** | `.../asesmen_keperawatan_ranap_umum/hal2_riwayat_nyeri.php` | Skala Nyeri (NPRS/VAS, BPS, & COMFORT Scale). |
| **Tab 3 View** | `.../asesmen_keperawatan_ranap_umum/hal3_aktivitas_jatuh.php` | Aktivitas, Morse Fall Scale (Dewasa) & Humpty Dumpty (Anak). |
| **Tab 4 View** | `.../asesmen_keperawatan_ranap_umum/hal4_eliminasi_edukasi.php` | Eliminasi BAB/BAK, Seksual/Reproduksi, Hambatan & Kebutuhan Edukasi. |
| **Tab 5 View** | `.../asesmen_keperawatan_ranap_umum/hal5_gizi_diagnosa.php` | MST Dewasa, Strong Kids (Anak), Resume Keperawatan, Diagnosa Keperawatan, Discharge Planning, & Select2 PPA. |
| **JS Engine** | `.../asesmen/_js_asesmen_keperawatan_ranap_umum_modal.php` | Auto-population, scoring listeners, & Select2 parent handler. |
| **DB Script** | `database/ALTER_TABLE_dat_asesmen_keperawatan_ranap_RM13_1.sql` | File DDL penambahan & pembaruan struktur kolom PostgreSQL/MySQL RM 13.1. |
| **Neonatus Controller**| `application/modules/pelayanan/controllers/Pelayanan.php` | Route `form_asesmen_keperawatan_ranap_neonatus_modal` & `save_asesmen_keperawatan_ranap_neonatus`. |
| **Neonatus Model** | `application/modules/pelayanan/models/M_pelayanan.php` | Method `save_asesmen_keperawatan_ranap_neonatus` (`jenis_asesmen = 'NEONATUS'`). |
| **Neonatus View** | `application/modules/pelayanan/views/pelayanan/asesmen/asesmen_keperawatan_ranap_neonatus_modal.php` | Wrapper Modal 4 Tab Asesmen Neonatal (RM 13.5.1). |
| **Neonatus DDL** | `database/ALTER_TABLE_dat_asesmen_keperawatan_ranap_Neonatus_RM13_5_1.sql` | File DDL migration penambahan kolom khusus neonatal. |

---

## 🔄 3. HELPER & MEKANISME AUTO-FILL DATA

Untuk mengurangi beban ketik manual oleh perawat/PPJA, modul ini menerapkan **4 Mekanisme Auto-Fill Mandatori**:

### A. Auto-Fill Data Master Pasien (Halaman 4 - Edukasi & Demografi)
Di Controller `Pelayanan.php`, data pasien di-query lengkap dengan `LEFT JOIN` master:
```php
$pasien_id = @$d['pelayanan']['pasien_id'];
$d['pasien'] = $pasien_id ? (DB::raw('row_array', "
  SELECT a.*, b.pendidikan_nm, c.agama_nm, d.pekerjaan_nm, e.bahasa_nm, f.suku_nm, g.golongandarah_nm
  FROM mst_pasien a
  LEFT JOIN mst_pendidikan b ON a.pendidikan_id = b.pendidikan_id
  LEFT JOIN mst_agama c ON a.agama_id = c.agama_id
  LEFT JOIN mst_pekerjaan d ON a.pekerjaan_id = d.pekerjaan_id
  LEFT JOIN mst_bahasa e ON a.bahasa_id = e.bahasa_id
  LEFT JOIN mst_suku f ON a.suku_id = f.suku_id
  LEFT JOIN mst_golongan_darah g ON a.golongandarah_id = g.golongandarah_id
  WHERE a.pasien_id = ?
", $pasien_id) ?: []) : [];
```
*Fallback di View (`hal4_eliminasi_edukasi.php`)*:
```php
$val_bahasa     = @$main['edukasi_bahasa'] ?: (@$pasien['bahasa_nm'] ?: 'Indonesia');
$val_pendidikan = @$main['edukasi_pendidikan'] ?: (@$pasien['pendidikan_nm'] ?: @$pelayanan['pendidikan_nm']);
$val_agama      = @$main['edukasi_agama'] ?: (@$pasien['agama_nm'] ?: @$pelayanan['agama_nm']);
```

### B. Auto-Fetch Diagnosa Medis Dokter & ICD-10 (Halaman 1 - Anamnesa)
Sistem secara otomatis menarik diagnosis medis yang sudah diinput oleh dokter pemeriksa sebelumnya dari `dat_diagnosis` dan `dat_anamnesis`:
```php
$get_dx = DB::raw('result_array', "
  SELECT a.diagnosis_klinis, a.icd10_id, b.icd10_nm 
  FROM dat_diagnosis a 
  LEFT JOIN mst_icd10 b ON a.icd10_id = b.icd10_id 
  WHERE a.pelayanan_id = '$pel_id' OR a.registrasi_id = '$reg_id' 
  ORDER BY a.diagnosis_id DESC
");
```
Data ini dikirim ke view sebagai `$diagnosa_auto` dan `$anamnesis_auto` untuk mengisi keluhan utama/diagnosa medis secara otomatis jika data asesmen baru dibuat.

### C. Auto-Fill Perawat PPJA & Perawat Pengkaji (Halaman 5 - PPA)
Sistem mengenali pegawai yang sedang login melalui session (`_ses_get('pegawai_id')`). Jika data asesmen belum pernah disimpan sebelumnya, ID perawat login otomatis terisi di pilihan dropdown:
```php
$user_pegawai_id = _ses_get('pegawai_id');
if ($user_pegawai_id) {
  if (empty($d['main']['username_perawat'])) $d['main']['username_perawat'] = $user_pegawai_id;
  if (empty($d['main']['ttd_nama_terang']))  $d['main']['ttd_nama_terang']  = $user_pegawai_id;
}
```

### D. Auto-Scoring Engine (Javascript Real-Time)
Setiap pengubahan radio button atau checkbox pada parameter berikut akan memicu kalkulasi skor & kategori risiko secara instan tanpa perlu reload:
- **Morse Fall Scale (Dewasa)**: `_calcMorseScore()`
- **Humpty Dumpty (Anak)**: `_calcHumptyDumptyScore()`
- **Braden Scale (Dekubitus)**: `_calcBradenScore()`
- **MST Dewasa (Gizi)**: `_calcMstDewasaScore()`
- **STRONG KIDS (Gizi Anak)**: `_calcStrongKidsScore()`

---

## 🗄️ 4. STRUKTUR TABEL & KETERSEDIAAN KOLOM (DATABASE MAPPING)

Tabel Utama: `dat_asesmen_keperawatan_ranap`

> [!IMPORTANT]
> **ATURAN MULTI-CHECKBOX**:
> Semua input bermodel multi-checkbox (seperti `masalah_keperawatan[]`, `resume_konsul[]`, `gizi_diagnosa_khusus[]`, `gizi_anak_penyakit_list[]`, `faktor_fisik[]`, dll.) disimpan dalam satu kolom database menggunakan pemisah tanda pagar (`#`). 
> 
> Contoh simpan: `Diabetes Melitus#Kanker#Stroke`  
> Contoh parse di JS: `data.split('#')`

### Ringkasan Penambahan/Modifikasi Kolom Terbaru (Script: `ALTER_TABLE_dat_asesmen_keperawatan_ranap_RM13_1.sql`)

```sql
-- Penyesuaian Kolom Discriminator Jenis Asesmen (Mandatori)
ALTER TABLE dat_asesmen_keperawatan_ranap 
  ALTER COLUMN jenis_asesmen TYPE varchar(50);

-- Penyesuaian Kolom Resume & Perencanaan (Halaman 5)
ALTER TABLE dat_asesmen_keperawatan_ranap 
  ADD COLUMN IF NOT EXISTS resume_konsul varchar(250),
  ADD COLUMN IF NOT EXISTS resume_konsul_ket varchar(250),
  ALTER COLUMN perencanaan_tindakan TYPE varchar(250);

-- Penyesuaian Kolom Skrining Gizi Dewasa & Anak (MST & Strong Kids)
ALTER TABLE dat_asesmen_keperawatan_ranap 
  ADD COLUMN IF NOT EXISTS gizi_diagnosa_khusus text,
  ADD COLUMN IF NOT EXISTS gizi_diagnosa_khusus_ket varchar(250),
  ADD COLUMN IF NOT EXISTS gizi_anak_kurus varchar(50),
  ADD COLUMN IF NOT EXISTS gizi_anak_penurunan_bb varchar(50),
  ADD COLUMN IF NOT EXISTS gizi_anak_asupan_makanan varchar(50),
  ADD COLUMN IF NOT EXISTS gizi_anak_penyakit varchar(50),
  ADD COLUMN IF NOT EXISTS gizi_anak_penyakit_list text,
  ADD COLUMN IF NOT EXISTS gizi_anak_skor_total varchar(20),
  ADD COLUMN IF NOT EXISTS gizi_anak_status varchar(100);

-- Penyesuaian Kolom Eliminasi, Kateter, & Seksual (Halaman 4)
ALTER TABLE dat_asesmen_keperawatan_ranap 
  ADD COLUMN IF NOT EXISTS elim_colostomy_ket varchar(250),
  ADD COLUMN IF NOT EXISTS elim_kateter_tipe varchar(100),
  ADD COLUMN IF NOT EXISTS elim_kateter_ukuran varchar(100),
  ADD COLUMN IF NOT EXISTS repro_pria_masalah varchar(250),
  ADD COLUMN IF NOT EXISTS repro_pria_ket varchar(250),
  ADD COLUMN IF NOT EXISTS edukasi_budaya varchar(250);
```

### 🏷️ Penerapan & Konsep Discriminator `jenis_asesmen` & Multi-Record Strategy

Tabel `dat_asesmen_keperawatan_ranap` merupakan **Shared Table** (satu tabel yang digunakan bersama oleh berbagai varian formulir asesmen keperawatan rawat inap). Untuk membedakan data antar-formulir tanpa perlu membuat tabel baru:

1. **Prinsip Record Terpisah per `jenis_asesmen` (Bukan Overwrite)**:
   Setiap jenis asesmen (misal: `UMUM` vs `NEONATUS` vs `KEBIDANAN`) pada satu nomor pelayanan yang sama (`pelayanan_id`) akan **membuat record (baris) tersendiri di database**, bukan menimpa (overwrite) record jenis asesmen lainnya.
   - Pengecekan saat simpan (`save_...`):
     ```php
     // Pengecekan spesifik untuk NEONATUS
     $cek = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap WHERE pelayanan_id = ? AND jenis_asesmen = 'NEONATUS' ORDER BY asesmenkeperawatanranap_id DESC LIMIT 1", [$pelayanan_id]);
     ```
     Jika record `NEONATUS` sudah ada, maka dilakukan `UPDATE` pada record `NEONATUS` tersebut.  
     Jika belum ada, maka dilakukan `INSERT` record baru dengan `jenis_asesmen = 'NEONATUS'`.

2. **Mekanisme Auto-Fill Data (Pinjam Data untuk Inisialisasi)**:
   Ketika formulir jenis asesmen baru (misal: Neonatus) pertama kali dibuka dan record `NEONATUS` belum ada:
   - System dapat meminjam data dasar (seperti `keluhan_utama`, `pemeriksaan_rr`, `pemeriksaan_suhu`, perawat, dll.) dari record asesmen lain yang sudah ada pada `pelayanan_id` tersebut atau dari `dat_anamnesis`.
   - **PENTING**: Saat meminjam data awal tersebut, `asesmenkeperawatanranap_id` dan `jenis_asesmen` pada variabel data di-`unset()` di Controller agar saat tombol simpan diklik, sistem mengeksekusi `INSERT` record baru khusus untuk `NEONATUS`, bukan menimpa record lama.

3. **Skema & Alter Size (`VARCHAR(50)`)**:
   Tipe kolom `jenis_asesmen` diset menjadi `VARCHAR(50)` untuk keamanan identifier:
   ```sql
   ALTER TABLE dat_asesmen_keperawatan_ranap ALTER COLUMN jenis_asesmen TYPE varchar(50);
   ```

4. **Standardisasi Nilai `jenis_asesmen`**:
   | Modul Formulir Asesmen | Value `jenis_asesmen` di Model | File Controller & Model Handler |
   | :--- | :--- | :--- |
   | **Asesmen Keperawatan Ranap Umum (RM 13.1)** | `'UMUM'` | `save_asesmen_keperawatan_ranap_umum` |
   | **Asesmen Keperawatan Kebidanan** | `'KEBIDANAN'` | `save_asesmen_keperawatan_ranap_kebidanan` |
   | **Asesmen Keperawatan Neonatus / Perinatal** | `'NEONATUS'` | `save_asesmen_keperawatan_ranap_neonatus` |
   | **Asesmen Keperawatan Anak / Pediatrik** | `'PEDIATRIK'` | `save_asesmen_keperawatan_ranap_pediatrik` |
   | **Asesmen Keperawatan Intensif (ICU/HCU)** | `'INTENSIF'` | `save_asesmen_keperawatan_ranap_intensif` |

---

## 🛠️ 5. PANDUAN CARA BUAT (CREATE NEW ASESMEN FORM)

Jika Anda ingin membuat modul asesmen keperawatan rawat inap baru (misal: *Asesmen Keperawatan Kebidanan / Neonatus / Intensif*), ikuti urutan langkah berikut:

### Langkah 1: Siapkan Script SQL DDL
Buat script SQL penambahan tabel/kolom baru di folder `database/` tanpa menggunakan fungsi *auto-migration* pada PHP.

### Langkah 2: Tambahkan Route di Controller (`Pelayanan.php`)
```php
public function form_asesmen_keperawatan_ranap_kebidanan_modal($pelayanan_id = null, $registrasi_id = null)
{
  // 1. Fetch Pelayanan & Main Data
  $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
  $d['main']      = $this->m_penunjang->get_asesmen_keperawatan_ranap(...);
  
  // 2. Fetch Master Pasien & PPA
  $d['pasien']   = ...;
  $d['all_ppa']  = DB::raw('result_array', "SELECT pegawai_id, pegawai_nm FROM mst_pegawai ORDER BY pegawai_nm ASC");

  // 3. Render Modal Wrapper
  $d['form_act'] = $this->uri . '/save_asesmen_keperawatan_ranap_kebidanan/' . $pelayanan_id . '/' . $registrasi_id;
  $this->render($this->template . '/asesmen/asesmen_keperawatan_ranap_kebidanan_modal', $d);
}
```

### Langkah 3: Tambahkan Handler di Model (`M_pelayanan.php`)
```php
public function save_asesmen_keperawatan_ranap_kebidanan($pelayanan_id = null, $registrasi_id = null)
{
  $d = _post();
  $erekammedis_id = @$d['erekammedis_id'];
  unset($d['erekammedis_id']);

  // Format Datetime
  foreach (['asesmen_tgl', 'tgl_selesai'] as $f) {
    if (!empty($d[$f])) $d[$f] = to_date($d[$f], '-', 'full_date');
  }

  // Array to Hash Delimited String
  foreach ($d as $k => $v) {
    if (is_array($v)) $d[$k] = implode('#', $v);
  }

  // Strict Field Filtering
  $fields    = $this->db->list_fields('dat_asesmen_keperawatan_ranap');
  $data_save = array_intersect_key($d, array_flip($fields));

  // Save / Update logic
  ...

  // ERM Log Audit Mandatori
  if ($res['status']) {
    log_erm($erekammedis_id, $pelayanan_id, $registrasi_id, $lokasi_id, $pasien_id);
    return ['res' => '01'];
  }
  return ['res' => '11'];
}
```

### Langkah 4: Terapkan Isolasi JS dan Select2 di View Modal
Gunakan sintaks berikut pada JS Modal untuk menginisialisasi Select2 secara aman tanpa membuat dropdown melayang:
```javascript
if ($.fn.select2) {
  $('#form-asesmen-id select.select2-ppa').each(function() {
    var $el = $(this);
    if ($el.hasClass('select2-hidden-accessible')) return;
    $el.select2({
      theme: "bootstrap-5",
      dropdownParent: $el.parent(), // CRITICAL: Menempel langsung pada parent container
      width: "100%"
    });
  });
}
```

---

## 🔧 6. PANDUAN CARA MAINTENANCE & TROUBLESHOOTING

### Case 1: Menambahkan Field Input Baru pada Form
1. **Cek Ketersediaan Kolom**: Periksa file `database/dat_asesmen_keperawatan_ranap.txt` atau struktur tabel DB. 
2. **Jika Kolom Belum Ada**: Buat query `ALTER TABLE` di script `.sql` dan jalankan query di database.
3. **Tambahkan Input di View Tab**:
   - Berikan atribut `name="nama_kolom"` untuk single input/radio.
   - Berikan atribut `name="nama_kolom[]"` untuk multi-checkbox.
4. **Update JS Populate di `_js_..._modal.php`** (khusus checkbox/radio):
   ```javascript
   var saved_val = '<?= @$main['nama_kolom'] ?>';
   if (saved_val) {
     $.each(saved_val.split('#'), function(key, item) {
       $('input[name="nama_kolom[]"][value="' + item + '"]:checkbox').prop('checked', true);
     });
   }
   ```
5. **Model Auto-Save**: Model `save_asesmen_keperawatan_ranap_umum` akan otomatis menangkap dan menyimpan data POST tanpa perlu mengubah query `INSERT`/`UPDATE` secara manual!

---

### Case 2: Dropdown Select2 Melayang / Mispositioned saat Modal Di-scroll
- **Penyebab**: Class `chosen-select` bentrok dengan plugin Select2 atau `dropdownParent` menunjuk ke `.modal` root.
- **Solusi**:
  1. Ganti class pada select dari `chosen-select` menjadi `select2-ppa`.
  2. Pastikan di JS modal menggunakan `dropdownParent: $el.parent()`.

---

### Case 3: Data Input Terpotong (Data Truncated / Out of Range SQL Error)
- **Penyebab**: Input berupa string panjang diinput ke kolom legacy yang berukuran `VARCHAR(20)` atau `VARCHAR(50)`.
- **Solusi**: Tambahkan field tersebut ke array `$truncations` pada method `save_asesmen_keperawatan_ranap_umum` di `M_pelayanan.php`:
  ```php
  $truncations = [
    'nama_kolom_bermasalah' => 50,
  ];
  ```

---

### Case 4: Status Indikator Menu ERM Tidak Berubah Hijau Setelah Simpan
- **Penyebab**: Helper `log_erm(...)` tidak dipanggil atau parameter `erekammedis_id` bernilai `null`.
- **Solusi**: Pastikan `<input type="hidden" name="erekammedis_id" value="...">` berada di dalam form HTML modal dan dipanggil di Model:
  ```php
  log_erm($erekammedis_id, $pelayanan_id, $registrasi_id, $lokasi_id, $pasien_id);
  ```

---

## 💡 7. KESIMPULAN & CHECKLIST CLEAN CODE

- [x] **Strict DDL Separation**: DDL SQL terisolasi di script `.sql`, bukan di runtime PHP.
- [x] **Clean Array Serialization**: Checkbox dikonversi aman dengan `#`.
- [x] **No Hardcoded Options**: Master pasien (Agama, Pendidikan, Bahasa) terhubung ke tabel master.
- [x] **Ergonomic Layout**: Layout 2-kolom seimbang dengan Bootstrap Card.
- [x] **Interactive Scoring**: Skor Braden, Morse, Humpty Dumpty, MST, dan Strong Kids dihitung otomatis di browser.
