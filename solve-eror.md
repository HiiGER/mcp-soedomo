# Panduan Solusi & Penanganan Error SIMRS RSUD Soedomo

Dokumen ini berisi daftar inventarisasi error umum, *exception*, *bug*, serta langkah-langkah solutif dan pencegahan yang telah divalidasi pada sistem SIMRS RSUD Soedomo.

---

## 1. DataTables Warning: Invalid JSON Response
* **Gejala**: Tampil alert Bootstrap/DataTables: `DataTables warning: table id=... - Invalid JSON response`.
* **Penyebab**: Controller mengembalikan output non-JSON (HTML error PHP, Notice, Deprecated warning, atau pembungkusan JSON ganda).
* **Solusi**:
  1. Pastikan controller mengakhiri eksekusi DataTables dengan:
     ```php
     echo json_encode($output);
     exit;
     ```
  2. Pastikan subquery DataTables pada Model dibungkus `SELECT * FROM (...) a` via `DB::datatables_query()`.

---

## 2. Lock Concurrency Advisory (`pg_advisory_xact_lock`)
* **Gejala**: Error PostgreSQL lock / ID duplikat saat *concurrent insert*.
* **Penyebab**: Penggunaan `MAX(id) + 1` secara langsung tanpa *advisory lock*.
* **Solusi**: Wajib menggunakan `DB::get_id($table)` -> `DB::insert($table, $data)` -> `DB::update_id($table, $id)` sesuai standar [database-helper.md](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-helper.md).

---

## 3. Indikator Hijau Menu ERM Tidak Berubah (*Status Check Log ERM*)
* **Gejala**: Form ERM berhasil disimpan tetapi warna teks di menu ERM tetap biasa (tidak berubah hijau tebal).
* **Penyebab**: Lupa memanggil fungsi `log_erm()` di method model `save_...()`.
* **Solusi**: Pastikan di akhir method simpan model dipanggil:
  ```php
  log_erm($erekammedis_id, $pelayanan_id, $user_id);
  ```

---

## 4. Modal Backdrop Glitch / Modal Level 2 Menutup Modal Level 1
* **Gejala**: Saat menutup modal form (Level 2), layar menjadi hitam pekat (*backdrop stuck*) atau Modal Level 1 ikut tertutup.
* **Penyebab**: Penggunaan selector modal generik `$('#my-modal')` atau menutup modal dengan `.modal('hide')` bawaan bootstrap tanpa indeks.
* **Solusi**: Wajib memanggil `_modalHide(2)` dari `itm.js` untuk menutup Modal Level 2 tanpa mengganggu Modal Level 1.

---

## 5. Memory Limit Exceeded Saat Cetak Dompdf
* **Gejala**: `Fatal error: Allowed memory size of X bytes exhausted` saat membuka pratinjau cetak PDF.
* **Penyebab**: Rendering grafik/DOMPDF membutuhkan memori besar melebihi default limit PHP.
* **Solusi**: Tambahkan `ini_set("memory_limit", "-1");` pada awal method controller cetak.

---

## 6. PostgreSQL Invalid Regular Expression / Encoding String
* **Gejala**: `ERROR: invalid regular expression: quantifier operand invalid` pada pencarian DataTables.
* **Penyebab**: Karakter khusus regex (`(`, `)`, `[`, `]`, `*`, `+`, `?`) pada inputan *global search*.
* **Solusi**: Gunakan `pg_escape_string()` atau replace karakter khusus regex pada string pencarian DataTables.

---

## 7. HMVC Router Missing / Controller Not Found (404)
* **Gejala**: Request AJAX modal mengembalikan HTTP 404 Not Found.
* **Penyebab**: Nama file controller, class controller, atau method tidak *case-sensitive* sesuai standar Linux (misal: `Pelayanan.php` vs `pelayanan.php`).
* **Solusi**: Nama file controller wajib diawali huruf kapital `Pelayanan.php` dan nama class `class Pelayanan extends MX_Controller`.

---

## 8. Datetime Out of Range / Timezone Mismatch
* **Gejala**: `ERROR: date/time field value out of range` pada PostgreSQL.
* **Penyebab**: Format tanggal dikirim `dd-mm-yyyy` dari frontend datepicker tanpa diconvert ke format SQL `YYYY-MM-DD` atau `YYYY-MM-DD HH:mm:ss`.
* **Solusi**: Wajib membungkus inputan tanggal dengan helper `to_date($tgl_input, '', 'full_date')` atau `to_date($tgl_input, '', 'date')` sebelum dipassing ke `DB::insert()` / `DB::update()`.

---

## 9. Fatal Error: Class 'Pelayanan' not found
* **Gejala**: `Fatal error: Class 'Pelayanan' not found in /var/www/html/SOEDOMO/simrs/system/core/CodeIgniter.php`.
* **Penyebab**: File controller utama `Pelayanan.php` terpotong (0 bytes) akibat replace file tidak lengkap.
* **Solusi**: Pulihkan file `Pelayanan.php` menggunakan `git checkout application/modules/pelayanan/controllers/Pelayanan.php` dan lakukan penggabungan method baru secara presisi di akhir class.

---

## 10. Fatal Error: Class 'M_pelayanan' not found
* **Gejala**: `Fatal error: Class 'M_pelayanan' not found in /var/www/html/SOEDOMO/simrs/system/core/Loader.php`.
* **Penyebab**: File model utama `M_pelayanan.php` terpotong (0 bytes) akibat replace file tidak lengkap.
* **Solusi**: Pulihkan file `M_pelayanan.php` menggunakan `git checkout application/modules/pelayanan/models/M_pelayanan.php` dan lakukan penggabungan method baru secara presisi di akhir class.

---

## 11. Modal Status HTTP 200 OK Tapi Modal Tidak Terbuka (Tampilan Kosong)
* **Gejala**: Status HTTP 200 OK pada request POST modal, tetapi modal tidak muncul di layar.
* **Penyebab**: File view modal (`..._modal.php`) terpotong (0 bytes) sehingga server mengembalikan response string kosong (`""`).
* **Solusi**: Isi kembali file view modal dengan template paten `form_pengkajian_geriatri_rajal_modal.php` atau `list_pengkajian_geriatri_rajal_modal.php`.

---

## 12. Parse Error / Syntax Error: Unexpected 'return' (T_RETURN) di `db_helper.php`
* **Gejala**: `Exception: syntax error, unexpected 'return' (T_RETURN), expecting function (T_FUNCTION) or const (T_CONST) in application/helpers/db_helper.php on line 304`.
* **Penyebab**: Adanya sintaks duplikat `return $result; }` di luar blok fungsi `DB::raw()`.
* **Solusi**: Pulihkan file `db_helper.php` via `git checkout application/helpers/db_helper.php`.

---

## 13. Redirect Otomatis ke Dashboard / eror 300 Saat Mengakses Route / Modal / AJAX
* **Gejala**: Tampilan browser atau modal tiba-tiba ter-redirect ke URL `app/dashboard?n=...` saat mengeksekusi request atau mengklik link/modal.
* **Penyebab**: Lupa mengikutsertakan parameter navigasi `?n=` pada pembentukan URL request (AJAX, form submit, modal trigger, atau PDF print). `MY_Controller.php` gagal memverifikasi `nav_id` (`$this->nav == null`).
* **Solusi**: Pastikan URL request selalu menambahkan `?n=<?= _get('n') ?>` atau `?n=' . $this->nav_id`.

---

## 14. DataTables Missing FROM-Clause Entry (`missing FROM-clause entry for table "b"`)
* **Gejala**: Error PostgreSQL `missing FROM-clause entry for table "b"` saat melakukan pencarian global (*global search*) pada tabel DataTables.
* **Penyebab**: Subquery DataTables dibungkus sebagai `SELECT * FROM (...) a`. Ketika mendaftarkan kolom pencarian di array `$search`, kolom dari tabel JOIN yang di-subquery dipanggil menggunakan alias tabel asal (misal `'b.pegawai_nm'`). Karena outer query ber-alias `'a'`, alias `'b'` tidak dikenali di luar subquery.
* **Solusi**: Gunakan alias dari outer subquery `'a'` pada array `$search` di Model, contoh: `$search = ['a.pengkajiangeriatri_id', 'a.perawat_nm', 'a.kategori_hasil'];`.

---

## 15. Form Modal Reload Halaman Utama Saat Disimpan (*Full-Page Reload Glitch*)
* **Gejala**: Saat menekan tombol **Simpan** pada modal form level 2, seluruh halaman aplikasi SIMRS ter-reload / ter-refresh kembali ke halaman utama alih-alih hanya menutup modal form.
* **Penyebab Utama**:
  1. Helper `_response($res['res'], $uri)` di controller mengembalikan URL redirect `$uri` (misal `$this->uri_pelayanan . '/form/...'`). Script `itm.js` mendeteksi properti `res.uri` lalu mengeksekusi `_page(res.uri)` yang me-reload seluruh kontainer halaman utama.
  2. Mismatch antara ID form HTML dengan selector JavaScript jQuery Validate (misal `id="form-pengkajian-geriatri-modal"` di HTML, tapi `$("#form-pengkajian_geriatri-modal")` di JS). jQuery Validate gagal meng-bind form sehingga browser mengeksekusi *native browser form submission*.
* **Solusi**:
  1. Di Controller, kembalikan URI kosong `''` pada `_response`: `_json(_response($res['res'], ''));`.
  2. Pastikan ID form HTML dan selector JS 100% identik (`#form-pengkajian-geriatri-modal`).
  3. Atur atribut tag form `<form action="javascript:void(0)" onsubmit="return save_action(event)">` untuk mengunci native reload.

---

## 16. Event JavaScript Tidak Ter-Trigger pada Dynamic AJAX Modal Load
* **Gejala**: Kode JavaScript di file `_js_..._modal.php` tidak berjalan saat modal dibuka via AJAX, sehingga event click, change, datepicker, atau validasi form tidak ter-bind.
* **Penyebab**:
  1. Penggunaan `$(document).ready(function() { ... })` di dalam view modal. Karena halaman utama SIMRS sudah *ready*, callback `ready()` tidak ter-trigger ulang saat HTML modal diinjeksi via AJAX.
  2. File `_js_..._modal.php` di-include di baris pertama file view sebelum tag `<form>` di-parse oleh DOM browser.
* **Solusi**:
  1. Pindahkan `<?php include '_js_..._modal.php' ?>` ke bagian **paling bawah** file view modal (setelah tag `</form>`).
  2. Gunakan IIFE (*Immediately Invoked Function Expression*) `(function() { ... })()` atau *Event Delegation* `$(document).off('click change', '.q-radio').on('click change', '.q-radio', ...)` untuk memastikan script langsung berjalan begitu DOM siap.

---

## 17. Kegagalan Perhitungan / Pengecekan Kondisional Akibat Strict Equality (`===`) pada PHP & JS
* **Gejala**: Hasil perhitungan skor/ringkasan bernilai 0, atau pilihan radio button `checked` tidak muncul saat membuka mode ubah (edit).
* **Penyebab**: Penggunaan operator pembanding ketat `$val === '1'` atau `($q_val === '1')`. Nilai dari database PostgreSQL atau input POST dapat bertipe `integer` `1` atau string `'1'`. Pengecekan `1 === '1'` pada PHP/JS bernilai `false`.
* **Solusi**: Gunakan *loose equality comparison* `$val == '1'` dan `($q_val == '1')` serta casting `(string)$val` pada PHP dan JavaScript.

---

## 18. PHP Warning: `Illegal string offset` pada Helper `_frm_select()`
* **Gejala**: Tampil PHP Warning: `Illegal string offset 'perawat_id'` di log atau tampilan view saat menggunakan `_frm_select`.
* **Penyebab**: Fungsi helper `_frm_select($field, $data, $val_key, $val_str, ...)` mengekspektasi parameter `$data` sebagai array 2 Dimensi (*array of rows/arrays*). Jika dikirimkan array 1 Dimensi `['00001' => 'Nama']`, helper mencoba mengakses `$r['perawat_id']` pada string.
* **Solusi**: Tanpa merubah file helper `itm_helper.php`, kirimkan array 2 Dimensi pada parameter kedua:
  ```php
  _frm_select(
    'perawat_id', 
    (!empty($main['perawat_id']) ? [ ['perawat_id' => $main['perawat_id'], 'perawat_nm' => $main['perawat_nm']] ] : []), 
    'perawat_id', 
    'perawat_nm', 
    @$main['perawat_id'], 
    '- Pilih Perawat -', 
    'class="form-select select2-ajax me-2" data-url="ajax_statement/all_pegawai_select2" required'
  )
  ```

---

## 19. Dropdown Select2 Perawat/PPA Kosong Saat Mode Edit (*Select2 Pre-Population*)
* **Gejala**: Saat membuka modal form dalam mode edit, dropdown Select2 Perawat menampilkan `- Pilih -` padahal data `perawat_id` ada di tabel database.
* **Penyebab**: Pembentukan objek `new Option(text, id, false, false)` menggunakan parameter `defaultSelected = false` dan `selected = false`, atau opsi belum di-append sebelum Select2 AJAX di-inisialisasi.
* **Solusi**:
  1. Pre-populate opsi secara native di HTML via `_frm_select` dengan memberikan array 2D `[ ['perawat_id' => $id, 'perawat_nm' => $nm] ]`.
  2. Pada JavaScript, gunakan `new Option(perawatData.text, perawatData.id, true, true)` dengan `defaultSelected = true` dan `selected = true`, lalu panggil `.trigger('change')`.
