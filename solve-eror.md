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
