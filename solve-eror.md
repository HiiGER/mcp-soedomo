# Panduan Solusi & Penanganan Error (*Troubleshooting & Error Prevention*) SIMRS RSUD Soedomo

Dokumen ini mencatat masalah-masalah teknis (*bugs*) yang sering ditemui saat pengembangan modul SIMRS RSUD Soedomo beserta langkah penanganan (*solusi*) dan panduan pencegahannya.

---

## 1. DataTables Server-Side AJAX Error

### Gejala (*Symptom*)
Muncul alert DataTables: `"DataTables warning: table id=datatable-main - Invalid JSON response"` atau data tidak muncul di tabel.

### Penyebab Utama
1. Method di Model tidak menggunakan struktur Subquery `SELECT * FROM (...) a` sehingga terjadi konflik penamaan kolom saat klausa `WHERE` atau `ORDER BY` dieksekusi.
2. Output PHP mengandung error/notice (seperti `Undefined variable`) yang merusak format JSON respon.

### Solusi & Code Correcting
Bungkus SQL query utama dalam subquery bertipe `SELECT * FROM (...) a` di method DataTables model:

```php
// SALAH (Dapat menyebabkan error klausa WHERE)
$query = "SELECT a.*, b.pegawai_nm FROM dat_tih a LEFT JOIN mst_pegawai b ON a.dokter_id = b.pegawai_id";

// BENAR (Standar RSUD Soedomo)
$query = "SELECT * FROM (
    SELECT 
        a.*,
        b.pegawai_nm AS dokter_nm
    FROM dat_tih a
    LEFT JOIN mst_pegawai b ON a.dokter_id = b.pegawai_id
    WHERE a.registrasi_id = '" . @$this->input->post('registrasi_id') . "'
      AND a.deleted_st = '0'
    ORDER BY a.tih_id DESC
) a";

DB::datatables_query($query, $search, $where, $is_where);
```

---

## 2. Kegagalan Generator ID & Concurrency Lock (`DB::get_id`)

### Gejala (*Symptom*)
Muncul Exception: `[get_id] Primary key tidak ditemukan untuk tabel: dat_nama_fitur` atau terjadi duplikasi Primary Key saat concurrent insert.

### Penyebab Utama
1. Nama modul yang dipassing ke `DB::get_id($modul)` tidak sesuai dengan nama fisik tabel di database PostgreSQL.
2. Penambahan data baru menggunakan `INSERT` mentah tanpa melalui `DB::get_id()` sehingga counter di `tmp_id` tertinggal.

### Solusi & Code Correcting
1. Pastikan string `$modul` persis sama dengan nama tabel:
   ```php
   // Wajib gunakan nama tabel resmi
   $tih_id = DB::get_id('dat_tih');
   ```
2. Pastikan pemanggilan `DB::update_id()` dilakukan tepat setelah `DB::insert()` berhasil:
   ```php
   $res = DB::insert('dat_tih', $data);
   if ($res['status']) {
       DB::update_id('dat_tih', $tih_id);
   }
   ```

---

## 3. Indikator Status Menu ERM Tidak Berubah Hijau

### Gejala (*Symptom*)
Pengisian formulir ERM berhasil disimpan ke database, namun menu item di Offcanvas, Navbar Search, atau Tab ERM tidak berubah menjadi hijau tebal (`fw-bold text-success`).

### Penyebab Utama
Model save procedure tidak memanggil fungsi `log_erm()` di [itm_helper.php](file:///home/geri/ITM/SOEDOMO/simrs/application/helpers/itm_helper.php) sehingga tabel `log_erekam_medis` tidak mencatat pengisian form tersebut.

### Solusi & Code Correcting
1. Pastikan input hidden `erekammedis_id` dikirimkan dari Form Modal View:
   ```html
   <input type="hidden" name="erekammedis_id" value="01.0001">
   ```
2. Panggil `log_erm()` pada method model setelah `DB::insert()` / `DB::update()`:
   ```php
   $erekammedis_id = @$d['erekammedis_id'];
   unset($d['erekammedis_id']);

   // ... proses insert / update ...

   if ($res['status']) {
       log_erm($erekammedis_id, $d['pelayanan_id'], $registrasi_id, @$d['lokasi_id'], @$d['pasien_id']);
       return ['res' => '01'];
   }
   ```

---

## 4. Modal Backdrop Glitch / Layar Gelap Tidak Bisa Diklik

### Gejala (*Symptom*)
Saat membuka Modal Level 1 atau Level 2, layar berubah menjadi gelap penuh (*dark backdrop overlay*) dan pengguna tidak dapat mengklik tombol apapun di layar.

### Penyebab Utama
Developer membungkus konten file view (`list_..._modal.php` / `form_..._modal.php`) dengan kontainer HTML modal buatan sendiri seperti `<div class="modal">` atau `<div class="modal-dialog">`.

### Solusi & Code Correcting
Hapus seluruh wrapper modal buatan dari file view. Biarkan library `itm.js` yang mengontrol kontainer `#my-modal-1` dan `#my-modal-2`:

```html
<!-- SALAH (Merusak backdrop Bootstrap) -->
<div class="modal fade">
  <div class="modal-dialog">
    <div class="modal-content">
      <form>...</form>
    </div>
  </div>
</div>

<!-- BENAR (Langsung isi elemen Form/Tabel) -->
<?php include '_js_form_tih_modal.php'; ?>
<form id="form-tih-input">
  <div class="row">
    ...
  </div>
</form>
```

---

## 5. Fatal Error Out of Memory pada Cetak PDF (`PdfDom`)

### Gejala (*Symptom*)
Layar preview cetak menampilkan error PHP: `Fatal error: Allowed memory size of X bytes exhausted (tried to allocate Y bytes)`.

### Penyebab Utama
Proses konversi HTML ke PDF via **Dompdf** memakan alokasi memori melebihi batas default PHP (`memory_limit`), terutama jika dokumen memiliki banyak baris atau menyertakan gambar/logo resolusi tinggi.

### Solusi & Code Correcting
Wajib tambahkan `ini_set("memory_limit", "-1");` pada baris pertama di setiap method cetak controller:

```php
public function cetak_tih($pelayanan_id = null, $tih_id = null)
{
    // WAJIB: Bypass limit memori untuk alokasi Dompdf
    ini_set("memory_limit", "-1");

    $file_pdf = 'cetak_tih_' . $pelayanan_id;
    // ...
}
```

---

## 6. Syntax Error Filtering Regex PostgreSQL (`SIMILAR TO`)

### Gejala (*Symptom*)
Database error saat menampilkan daftar menu ERM: `ERROR: syntax error at or near "REGEXP"`.

### Penyebab Utama
Penggunaan syntax MySQL `REGEXP` pada query database PostgreSQL.

### Solusi & Code Correcting
Database PostgreSQL di RSUD Soedomo menggunakan klausa `SIMILAR TO`:

```sql
-- SALAH (Syntax MySQL)
SELECT * FROM mst_erekam_medis WHERE lokasi_map REGEXP 'POLI|IGD';

-- BENAR (Syntax PostgreSQL RSUD Soedomo)
SELECT * FROM mst_erekam_medis WHERE lokasi_map SIMILAR TO '%(POLI|IGD|BANGSAL)%';
```

---

## 7. DataTables AJAX Error: "Invalid JSON response" akibat Router Controller Belum Didaftarkan

### Gejala (*Symptom*)
Saat membuka Modal Level 1 (List Data History ERM), muncul pop-up warning DataTables:
`DataTables warning: table id=datatable-...-main - Invalid JSON response. For more information about this error, please see http://datatables.net/tn/1`

### Penyebab Utama
View DataTables di-inisialisasi ke endpoint URL `ajax_datatables/modul_name`, namun pada method central router `Pelayanan::ajax_datatables($type)` di `Pelayanan.php` belum didaftarkan pengkondisian `if ($type == 'modul_name')`.
Akibatnya, controller mengembalikan respon berupa string kosong (`""`) bukan JSON valid, sehingga parser JSON DataTables mengalami error.

### Solusi & Code Correcting
1. **Daftarkan Rute `$type` di `Pelayanan.php`**:
   Wajib daftarkan rute modul baru pada method `ajax_datatables()` di [Pelayanan.php](file:///home/geri/ITM/SOEDOMO/simrs/application/modules/pelayanan/controllers/Pelayanan.php):

   ```php
   public function ajax_datatables($type = null, $params = null)
   {
       // ...
       if ($type == 'pengkajian_geriatri_rajal') {
           $this->m_pelayanan->load_datatables_pengkajian_geriatri_rajal();
       }
       // ...
   }
   ```

2. **Standardisasi Model `load_datatables`**:
   Pastikan method `load_datatables_...()` di `M_pelayanan.php` memanggil `DB::datatables_query()` tanpa callback array jika JS DataTables menggunakan pemetaan kolom `"columns": [ { "data": "column_name" } ]`:

   ```php
   public function load_datatables_pengkajian_geriatri_rajal()
   {
       $query = "SELECT * FROM (
           SELECT 
               a.*,
               b.pegawai_nm AS dokter_nm,
               c.pegawai_nm AS perawat_nm
           FROM dat_pengkajian_geriatri_rajal a
           LEFT JOIN mst_pegawai b ON a.dokter_id = b.pegawai_id
           LEFT JOIN mst_pegawai c ON a.perawat_id = c.pegawai_id
           WHERE a.registrasi_id = '" . @$this->input->post('registrasi_id') . "'
             AND a.deleted_st = '0'
       ) a";
       $search   = null;
       $where    = null;
       $is_where = null;
       DB::datatables_query($query, $search, $where, $is_where);
   }
   ```

---

## 8. PostgreSQL Datetime Out of Range Error (`date/time field value out of range`)

### Gejala (*Symptom*)
Saat menyimpan form transaksi/ERM baru, transaksi gagal dan log sistem mencatat query error:
`ERROR: date/time field value out of range: "14-08-2026 10:18:29"`

### Penyebab Utama
Nilai tanggal yang dikirimkan dari form UI (datetimepicker) berada dalam format tanggal Indonesia `DD-MM-YYYY HH:MI:SS` (contoh: `"14-08-2026 10:18:29"`). Kolom PostgreSQL bertipe `TIMESTAMP` membaca angka awal (`14`) sebagai posisi bulan (range 1-12), sehingga melemparkan exception `date/time field value out of range`.

### Solusi & Code Correcting
Sebelum memanggil helper `DB::insert()` atau `DB::update()`, **WAJIB** mengonversi seluruh field bertipe tanggal/jam pada array data `$d` menggunakan helper `to_date($date, '', 'full_date')` agar terformat menjadi `YYYY-MM-DD HH:MI:SS` yang dikenali oleh PostgreSQL:

```php
public function save_pengkajian_geriatri_rajal($registrasi_id = null)
{
    $d = _post();
    $erekammedis_id = @$d['erekammedis_id'];
    unset($d['erekammedis_id']);

    // WAJIB: Konversi tanggal UI (DD-MM-YYYY HH:MI:SS) ke format PostgreSQL TIMESTAMP (YYYY-MM-DD HH:MI:SS)
    if (!empty($d['tgl_pengkajian'])) {
        $d['tgl_pengkajian'] = to_date($d['tgl_pengkajian'], '', 'full_date');
    }
    if (!empty($d['perawat_tgl_jam'])) {
        $d['perawat_tgl_jam'] = to_date($d['perawat_tgl_jam'], '', 'full_date');
    }
    if (!empty($d['dokter_tgl_jam'])) {
        $d['dokter_tgl_jam'] = to_date($d['dokter_tgl_jam'], '', 'full_date');
    }

    if (empty($d['pengkajiangeriatri_id'])) {
        $d['pengkajiangeriatri_id'] = DB::get_id('dat_pengkajian_geriatri_rajal');
        $res = DB::insert('dat_pengkajian_geriatri_rajal', $d);
        DB::update_id('dat_pengkajian_geriatri_rajal', $d['pengkajiangeriatri_id']);
        // ...
    }
}
```
