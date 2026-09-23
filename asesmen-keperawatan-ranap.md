# 📑 Dokumentasi Standard & Panduan Asesmen Keperawatan Rawat Inap

Dokumentasi ini berisi acuan resmi alur kerja, arsitektur pemisahan tabel terpisah (*dedicated tables*), standar pembuatan form asesmen baru, prosedur maintenance, serta mekanisme auto-fill data pada modul **Asesmen Keperawatan Rawat Inap (Ranap Umum / RM 13.1, Ranap Anak / RM 13.5, & Ranap Neonatus / RM 13.5.1)** di SIMRS RSUD Soedomo.

---

## 🗺️ 1. STRUKTUR ARSITEKTUR & BEBAN WORKFLOW

```
+-----------------------------------------------------------------------------------+
| CONTROLLER (Pelayanan.php)                                                         |
| • Route modal form_asesmen_keperawatan_ranap_[umum|anak|neonatus]_modal           |
| • Retrieve Master Pasien (LEFT JOIN mst_agama, mst_pendidikan, mst_bahasa, dll)  |
| • Auto-Fetch Diagnosa Medis & ICD-10 (dat_diagnosis / dat_anamnesis)            |
| • Auto-Fetch PPA Pegawai & Session Pegawai (username_perawat / ttd_nama_terang)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| VIEW WRAPPER & TAB MODAL                                                          |
| [ UMUM ]     -> asesmen_keperawatan_ranap_umum_modal.php (5 Tab)                |
| [ ANAK ]     -> asesmen_keperawatan_ranap_anak_modal.php (4 Tab)                |
| [ NEONATUS ] -> asesmen_keperawatan_ranap_neonatus_modal.php (4 Tab)            |
| • Render radio/checkbox via Helper Closure DRY ($rad_fn & $chk_fn)                |
| • HTML Entity Escaping untuk nilai berkarakter khusus (< 24 jam -> &lt; 24 jam)  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| FRONTEND ENGINE (_js_asesmen_keperawatan_ranap_[umum|anak|neonatus]_modal.php)    |
| • Auto-populate Checkboxes/Radios via split('#')                                  |
| • Element-by-element Select2 initialization (dropdownParent: $el.parent())        |
| • Real-time Scoring JS Listeners (Morse, Humpty Dumpty, Braden, CRIES, MST)       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| MODEL & SAVE ENGINE (M_pelayanan.php)                                             |
| • Route submit to save_asesmen_keperawatan_ranap_[umum|anak|neonatus]             |
| • Date Formatting to YYYY-MM-DD HH:ii:ss via to_date()                            |
| • Array Serializer to Delimited String via implode('#', $val)                     |
| • Auto-Column Creation & Auto-Expansion VARCHAR to TEXT via _ensure_table_columns |
| • Strict Field Filtering via array_intersect_key(..., list_fields($target_table))|
| • Concurrency-Safe ID: DB::get_id($table) -> DB::insert() -> DB::update_id()      |
| • E-RM Audit Log via log_erm($erekammedis_id, ...)                                |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| DEDICATED DATABASE TABLES (PostgreSQL)                                            |
| • UMUM (RM 13.1)     : dat_asesmen_keperawatan_ranap (asesmenkeperawatanranap_id) |
| • ANAK (RM 13.5)     : dat_asesmen_keperawatan_ranap_anak (asesmenanak_id)       |
| • NEONATUS (RM 13.5.1): dat_asesmen_keperawatan_ranap_neonatus (asesmenneonatus_id)|
+-----------------------------------------------------------------------------------+
```

---

## 🏛️ 2. PRINSIP PEMISAHAN TABEL TERPISAH (DEDICATED TABLES)

Guna menghindari bloating skema database 300+ kolom pada 1 tabel raksasa dan mencegah bentrokan field antar-spesialisasi, arsitektur modul asesmen keperawatan ranap dibagi menjadi **Tabel Terpisah Khusus (Dedicated Tables)**:

| Varian Form Asesmen | Nomor RM | Nama Tabel Dedicated | Primary Key Sequence |
| :--- | :--- | :--- | :--- |
| **Ranap Umum** | RM 13.1 | `dat_asesmen_keperawatan_ranap` | `asesmenkeperawatanranap_id` |
| **Ranap Anak / Pediatrik** | RM 13.5 | `dat_asesmen_keperawatan_ranap_anak` | `asesmenanak_id` |
| **Ranap Neonatus / Perinatal** | RM 13.5.1 | `dat_asesmen_keperawatan_ranap_neonatus` | `asesmenneonatus_id` |
| **Ranap Kebidanan (Maternity)** | RM 13.x | `dat_asesmen_keperawatan_ranap_kebidanan` *(Design Pattern)* | `asesmenkebidanan_id` |
| **Ranap Intensif (ICU/HCU)** | RM 13.x | `dat_asesmen_keperawatan_ranap_intensif` *(Design Pattern)* | `asesmenintensif_id` |

### 🔑 Aturan Transisi & Legacy Fallback Data

1. **Dedicated Query**: Controller & Model selalu menginisialisasi dan menyimpan data ke dedicated table spesifiknya menggunakan Primary Key masing-masing.
2. **Backward Compatibility / Legacy Fallback**: Saat pertama kali form spesifik (misal Neonatus/Anak) dibuka dan record di dedicated table belum ada, sistem secara otomatis melakukan fallback query ke `dat_asesmen_keperawatan_ranap` untuk mengimpor record historis lama tanpa merusak data lawas.

---

## 📁 3. DIRECTORY & FILE MAPPING

### A. Modul Asesmen Keperawatan Ranap Umum (RM 13.1)
- **Controller**: `application/modules/pelayanan/controllers/Pelayanan.php` (`form_asesmen_keperawatan_ranap_umum_modal`, `save_asesmen_keperawatan_ranap_umum`)
- **Model**: `application/modules/pelayanan/models/M_pelayanan.php` (`save_asesmen_keperawatan_ranap_umum`)
- **View Modal**: `application/modules/pelayanan/views/pelayanan/asesmen/asesmen_keperawatan_ranap_umum_modal.php` (5 Tab Wrapper)
- **Views Tab**: `.../asesmen_keperawatan_ranap_umum/hal1_pengkajian_fisik.php` s/d `hal5_gizi_diagnosa.php`
- **JS Engine**: `.../asesmen/_js_asesmen_keperawatan_ranap_umum_modal.php`
- **DDL Schema**: `database/CREATE_TABLE_dat_asesmen_keperawatan_ranap_umum.sql` & `database/DROP_UNUSED_COLUMNS_dat_asesmen_keperawatan_ranap.sql`

### B. Modul Asesmen Keperawatan Ranap Anak (RM 13.5)
- **Controller**: `application/modules/pelayanan/controllers/Pelayanan.php` (`form_asesmen_keperawatan_ranap_anak_modal`, `save_asesmen_keperawatan_ranap_anak`)
- **Model**: `application/modules/pelayanan/models/M_pelayanan.php` (`save_asesmen_keperawatan_ranap_anak`)
- **View Modal**: `application/modules/pelayanan/views/pelayanan/asesmen/asesmen_keperawatan_ranap_anak_modal.php` (4 Tab Wrapper)
- **Views Tab**: `.../asesmen_keperawatan_ranap_anak/hal1_riwayat_fisik.php` s/d `hal4_gizi_nyeri_jatuh_ppa.php`
- **JS Engine**: `.../asesmen/_js_asesmen_keperawatan_ranap_anak_modal.php`
- **DDL Schema**: `database/CREATE_TABLE_dat_asesmen_keperawatan_ranap_anak.sql`

### C. Modul Asesmen Keperawatan Ranap Neonatus (RM 13.5.1)
- **Controller**: `application/modules/pelayanan/controllers/Pelayanan.php` (`form_asesmen_keperawatan_ranap_neonatus_modal`, `save_asesmen_keperawatan_ranap_neonatus`)
- **Model**: `application/modules/pelayanan/models/M_pelayanan.php` (`save_asesmen_keperawatan_ranap_neonatus`)
- **View Modal**: `application/modules/pelayanan/views/pelayanan/asesmen/asesmen_keperawatan_ranap_neonatus_modal.php` (4 Tab Wrapper)
- **Views Tab**: `.../asesmen_keperawatan_ranap_neonatus/hal1_riwayat_fisik.php` s/d `hal4_cries_humpty_ppa.php`
- **JS Engine**: `.../asesmen/_js_asesmen_keperawatan_ranap_neonatus_modal.php`
- **DDL Schema**: `database/CREATE_TABLE_dat_asesmen_keperawatan_ranap_neonatus.sql`

---

## 🔄 4. HELPER & MEKANISME AUTO-FILL DATA

1. **Auto-Fill Master Pasien**: `LEFT JOIN mst_pasien` dengan `mst_agama`, `mst_pendidikan`, `mst_pekerjaan`, `mst_bahasa`, `mst_suku`, `mst_golongan_darah`.
2. **Auto-Fetch Diagnosa Medis & Anamnesa**: Menarik `dat_diagnosis` (ICD-10) & `dat_anamnesis` terkini dari pelayanan/registrasi terkait.
3. **Auto-Fill Perawat & PPA**: Membaca session `_ses_get('pegawai_id')` untuk mengisikan perawat pengkaji / PPJA secara default pada data asesmen baru.
4. **Real-time Scoring Javascript Engine**:
   - **Morse Fall Scale (Dewasa)**: `_calcMorseScore()`
   - **Humpty Dumpty Scale (Anak)**: `_calcHumptyDumptyScore()`
   - **CRIES Pain Scale (Neonatus)**: `_calcCriesScore()`
   - **Braden Scale (Dekubitus)**: `_calcBradenScore()`
   - **MST Dewasa / Strong Kids**: Real-time Nutrition Risk Calculation.

---

## 🛠️ 5. PANDUAN LANGKAH UTAMA PEMBUATAN MODUL ASESMEN BARU (STEP-BY-STEP)

Jika Anda ingin menambah varian asesmen keperawatan ranap baru (contoh: *Asesmen Keperawatan Kebidanan* atau *Asesmen Keperawatan Intensif*), ikuti **Urutan Tahapan Pembuatan Resmi** berikut:

```
[Tahap 1: DDL SQL Table] -> [Tahap 2: Model Handler] -> [Tahap 3: Controller Route] -> [Tahap 4: Views & DRY Helpers] -> [Tahap 5: JS Engine & Select2]
```

### 📌 Tahap 1: Buat DDL Tabel Dedicated (`database/CREATE_TABLE_...sql`)
Buat file SQL DDL tersendiri di folder `database/`. Jangan pernah menggabungkan kolom baru ke tabel lama!
```sql
CREATE TABLE IF NOT EXISTS dat_asesmen_keperawatan_ranap_kebidanan (
  asesmenkebidanan_id varchar(50) NOT NULL PRIMARY KEY,
  pelayanan_id varchar(50) NOT NULL,
  registrasi_id varchar(50),
  lokasi_id varchar(50),
  pasien_id varchar(50),
  dokter_id varchar(50),
  ppa_id varchar(50),
  username_perawat varchar(50),
  username_dokter varchar(50),
  ttd_nama_terang varchar(50),
  asesmenkeperawatanranap_tgl timestamp NULL,
  jenis_asesmen varchar(50) DEFAULT 'KEBIDANAN',
  
  -- Kolom Spesifik Kebidanan
  obg_hpht timestamp NULL,
  obg_tp timestamp NULL,
  obg_gpa varchar(100),
  -- ... tambahkan kolom spesifik lainnya (tipe TEXT / VARCHAR)

  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL,
  created_by varchar(50),
  updated_by varchar(50)
);

CREATE INDEX IF NOT EXISTS idx_asesmen_kebidanan_pelayanan ON dat_asesmen_keperawatan_ranap_kebidanan(pelayanan_id);
```

---

### 📌 Tahap 2: Buat Method Handler di Model (`M_pelayanan.php`)
Tambahkan method simpan di model yang menggunakan **`_ensure_table_columns`** untuk penanganan otomatis kolom dinamis dan ekspansi batas `VARCHAR` ke `TEXT`:

```php
public function save_asesmen_keperawatan_ranap_kebidanan($pelayanan_id = null, $registrasi_id = null)
{
  $d = _post();
  $erekammedis_id = @$d['erekammedis_id'];
  unset($d['erekammedis_id']);

  $pelayanan = DB::get('dat_pelayanan', ['pelayanan_id' => $pelayanan_id]);
  
  // 1. Query Dedicated Table Primary Key
  $target_table = 'dat_asesmen_keperawatan_ranap_kebidanan';
  $pk_name      = 'asesmenkebidanan_id';
  
  $cek = DB::raw('row_array', "SELECT * FROM {$target_table} WHERE pelayanan_id = ? ORDER BY {$pk_name} DESC LIMIT 1", [$pelayanan_id]);

  $d['pelayanan_id']  = $pelayanan_id;
  $d['registrasi_id'] = @$pelayanan['registrasi_id'];
  $d['dokter_id']     = @$pelayanan['dokter_id'];
  $d['lokasi_id']     = @$pelayanan['lokasi_id'];
  $d['pasien_id']     = @$pelayanan['pasien_id'];
  $d['jenis_asesmen'] = 'KEBIDANAN';

  // 2. Format Datetime Fields
  $datetime_fields = ['asesmenkeperawatanranap_tgl', 'obg_hpht', 'obg_tp'];
  foreach ($datetime_fields as $field) {
    if (!empty($d[$field])) {
      $d[$field] = to_date($d[$field], '-', 'full_date');
    }
  }

  // 3. Array Serializer to Delimited String (#)
  foreach ($d as $key => $val) {
    if (is_array($val)) {
      $d[$key] = implode('#', $val);
    }
  }

  // 4. Mandatori Auto-Column Creation & Auto-Expansion VARCHAR to TEXT
  $this->_ensure_table_columns($d, $target_table);

  // 5. Strict Data Filtering
  $fields    = $this->db->list_fields($target_table);
  $data_save = array_intersect_key($d, array_flip($fields));

  // 6. Concurrency-Safe Save Logic
  if (!empty($cek[$pk_name])) {
    $res = DB::update($target_table, $data_save, [$pk_name => $cek[$pk_name]]);
  } else {
    $data_save[$pk_name] = DB::get_id($target_table);
    $res = DB::insert($target_table, $data_save);
    DB::update_id($target_table, $data_save[$pk_name]);
  }

  // 7. Audit Log ERM Mandatori
  if ($res['status']) {
    log_erm($erekammedis_id, @$pelayanan['pelayanan_id'], @$pelayanan['registrasi_id'], @$pelayanan['lokasi_id'], @$pelayanan['pasien_id']);
    return ['res' => '01'];
  }
  return ['res' => '11'];
}
```

---

### 📌 Tahap 3: Tambahkan Route Modal di Controller (`Pelayanan.php`)
```php
public function form_asesmen_keperawatan_ranap_kebidanan_modal($pelayanan_id = null, $registrasi_id = null)
{
  $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
  
  // Query ke dedicated table
  $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_kebidanan WHERE pelayanan_id = ? ORDER BY asesmenkebidanan_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
  
  // Master Pasien & PPA
  $d['pasien']  = $this->get_master_pasien_lengkap(@$d['pelayanan']['pasien_id']);
  $d['all_ppa'] = DB::raw('result_array', "SELECT pegawai_id, pegawai_nm FROM mst_pegawai ORDER BY pegawai_nm ASC");

  $d['form_act'] = $this->uri . '/save_asesmen_keperawatan_ranap_kebidanan/' . $pelayanan_id . '/' . $registrasi_id;
  $this->render($this->template . '/asesmen/asesmen_keperawatan_ranap_kebidanan_modal', $d);
}
```

---

### 📌 Tahap 4: Susun View Tab Menggunakan DRY PHP Helpers & Escaped Entities
Pada setiap view tab (halaman), definisikan helper closure `$chk_fn` dan `$rad_fn` untuk pencocokan elemen form yang bersih, presisi, dan aman dari bug reload:

```php
<?php
// DRY Helper Closures
$chk_fn = function($field, $val) use ($main) {
  if (empty($main[$field])) return '';
  $arr = is_array($main[$field]) ? $main[$field] : explode('#', $main[$field]);
  return in_array($val, $arr) ? 'checked' : '';
};

$rad_fn = function($field, $val, $default = false) use ($main) {
  if (!isset($main[$field]) || $main[$field] === '') return $default ? 'checked' : '';
  return ($main[$field] == $val || strpos($main[$field], $val) !== false) ? 'checked' : '';
};
?>

<!-- Contoh Radio Button dengan HTML Entity Escaped (Aman dari Bug Parser HTML DOM) -->
<div class="form-check mb-1">
  <input class="form-check-input" type="radio" name="resiko_respon_operasi" id="ro1" value="&lt; 24 jam" <?= $rad_fn('resiko_respon_operasi', '24') ?>>
  <label class="form-check-label small" for="ro1">&lt; 24 jam</label>
</div>

<!-- Contoh Multi-Checkbox -->
<div class="form-check form-check-inline">
  <input class="form-check-input" type="checkbox" name="faktor_fisik[]" id="ff_jalan" value="Jalan" <?= $chk_fn('faktor_fisik', 'Jalan') ?>>
  <label class="form-check-label small" for="ff_jalan">Jalan</label>
</div>
```

---

### 📌 Tahap 5: JS Engine Modal & Select2 Placement
Gunakan sintaks berikut pada JS Modal untuk menginisialisasi Select2 secara aman tanpa membuat dropdown melayang saat modal di-scroll:

```javascript
if ($.fn.select2) {
  $('#form-asesmen-kebidanan-id select.select2-ppa').each(function() {
    var $el = $(this);
    if ($el.hasClass('select2-hidden-accessible')) return;
    $el.select2({
      theme: "bootstrap-5",
      dropdownParent: $el.parent(), // MANDATORI: Menempel langsung pada parent container
      width: "100%"
    });
  });
}
```

---

## 🔧 6. PANDUAN MAINTENANCE & TROUBLESHOOTING

### Case 1: Menambahkan Field Input Baru pada Form
- **Solusi**: Cukup tambahkan elemen `<input name="kolom_baru">` pada View Tab. Method `_ensure_table_columns` di Model akan secara otomatis membuatkan kolom `kolom_baru TEXT NULL` di PostgreSQL tanpa perlu `ALTER TABLE` manual.

### Case 2: Error `SQL Error [42703]: ERROR: column "nama_kolom" does not exist`
- **Penyebab**: Model tidak memanggil `_ensure_table_columns($d, $target_table)` sebelum `list_fields()`.
- **Solusi**: Pastikan `$this->_ensure_table_columns($d, $target_table);` terpanggil di awal method simpan.

### Case 3: Error `SQL Error: ERROR: value too long for type character varying(50)`
- **Penyebab**: Perawat memilih banyak multi-checkbox sehingga string terhubung `#` melebihi ukuran `VARCHAR(50)` legacy.
- **Solusi**: `_ensure_table_columns()` secara otomatis mendeteksi batas `character_maximum_length` dan mengubah tipe kolom PostgreSQL menjadi `TEXT` secara non-blocking (`ALTER TABLE ... ALTER COLUMN ... TYPE TEXT`).

### Case 4: Pilihan Radio Berkarakter `< 24 jam` / `> 48 jam` Tidak Ter-check Saat Form Dibuka Kembali
- **Penyebab**: Karakter `<` atau `>` tanpa entity escaping merusak parsing atribut HTML browser DOM (`value="< 24 jam"`).
- **Solusi**: Gunakan entity escaping pada atribut HTML (`value="&lt; 24 jam"` atau `value="&gt; 48 jam"`).

---

## 💡 7. CHECKLIST CLEAN CODE & MIGRATION COMPLIANCE

- [x] **Dedicated Tables Architecture**: Setiap varian asesmen keperawatan (Umum, Anak, Neonatus) memiliki tabel khusus tersendiri.
- [x] **Dynamic Auto-Column Engine**: Model menangani auto-create missing column dan auto-upgrade `VARCHAR` ke `TEXT`.
- [x] **DRY View Helpers**: Radio button dan multi-checkbox di-render dengan helper closure `$rad_fn` & `$chk_fn`.
- [x] **HTML Entity Safety**: Semua atribut nilai radio/checkbox berkarakter khusus ter-escape dengan aman (`&lt;`, `&gt;`).
- [x] **Non-Blocking Select2**: Menggunakan `dropdownParent: $el.parent()` agar dropdown tetap presisi di dalam modal.
- [x] **ERM Audit Log Verified**: Pemanggilan `log_erm(...)` mandatori memastikan indikator menu ERM otomatis berwarna hijau.
