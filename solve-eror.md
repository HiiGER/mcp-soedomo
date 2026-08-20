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

---

## 20. Toast Warning Gagal Simpan Padahal Data Masuk DB & Duplikasi Transaksi (*Multiple Submit Prevention*)
* **Gejala**: Saat menekan tombol Simpan pada modal form level 2, tampil Toast Warning "Gagal menyimpan data", padahal data fisik terbukti berhasil masuk ke database PostgreSQL. Karena pesan warning muncul, user mengklik tombol Simpan berkali-kali sehingga terjadi duplikasi data transaksi di database.
* **Penyebab Utama**:
  1. Helper `_json(_response($res['res'], ''))` mengembalikan objek JSON `{ status: true, message: "Data berhasil disimpan." }`. Objek ini tidak memiliki atribut `res.res`. Pengecekan JS `if (res.res == '01')` bernilai `false`, sehingga JS menganggap gagal dan menampilkan toast warning.
  2. Tombol Simpan (`btn-primary`) tidak di-disable saat AJAX POST berlangsung, sehingga pengguna dapat mengklik tombol Simpan berulang kali (*double-click / rapid-click*).
* **Solusi**:
  1. Pada `_js_form_..._modal.php`, periksa `res.status === true` (atau `res.res === '01' || res.res === '02'`):
     ```javascript
     var isSuccess = (res.status === true || res.res === '01' || res.res === '02');
     var msg = res.message ? res.message : "Data Berhasil Disimpan";
     if (isSuccess) {
       _toast("success", msg);
       _modalHide(2);
       tabel_main.draw();
     } else {
       _toast("warning", msg);
     }
     ```
  2. Selalu kunci tombol simpan saat proses AJAX berjalan:
     ```javascript
     $("button[type='submit'].btn-primary, button[type='button'].btn-primary").attr("disabled", true);
     ```
     dan buka kembali kunci pada callback `.done()` dan `.fail()`.

---

## 21. DataTables List Modal Tidak Ter-update Setelah Form Modal Disimpan (*DataTables Variable Mismatch*)
* **Gejala**: Saat menekan tombol Simpan pada modal form level 2, modal form berhasil menutup (`_modalHide(2)`), namun tabel riwayat di Modal Level 1 tidak ter-update/ter-redraw otomatis (data baru seakan-akan tidak tercatat).
* **Penyebab**: Mismatch nama variabel objek DataTables antara `_js_list_..._modal.php` (misal `var tabel = ...`) dengan `_js_form_..._modal.php` (misal `tabel_intervensi_terapi_wicara.draw()`). Karena variabel `tabel_intervensi_terapi_wicara` bernilai `undefined`, pemanggilan `.draw()` diabaikan secara silent.
* **Solusi**:
  1. Samakan nama variabel instance DataTables secara konsisten mengikuti standar `tabel_[nama_fitur]` (misal: `var tabel_intervensi_terapi_wicara = $('#datatable-intervensi_terapi_wicara-main').DataTable(...)`).
  2. Di `_js_form_..._modal.php`, lakukan fallback redraw terhadap kedua kemungkinan nama variabel:
     ```javascript
     if (typeof tabel_intervensi_terapi_wicara !== 'undefined' && tabel_intervensi_terapi_wicara !== null) {
       tabel_intervensi_terapi_wicara.draw();
     }
     if (typeof tabel !== 'undefined' && tabel !== null) {
       tabel.draw();
     }
     ```

---

## 22. Loading DataTables Sangat Lambat Padahal Status Request HTTP 200 (*Heavy Base64 TTD Columns in List Query & Double Slash URL*)
* **Gejala**: Saat modal list dibuka, DataTables membutuhkan waktu yang sangat lama untuk memuat data padahal HTTP status code bernilai 200 OK.
* **Penyebab Utama**:
  1. Method `load_datatables_...()` di Model melakukan `SELECT b.ttd AS perawat_ttd, c.ttd AS dokter_ttd`. Kolom TTD pada `mst_pegawai` berisi string Base64 gambar tanda tangan yang sangat besar (100KB–300KB per baris). Memuat string TTD ke dalam respon JSON DataTables membuat ukuran payload HTTP membengkak.
  2. Adanya double slash `//` pada URL AJAX DataTables (`pelayanan//ajax_datatables/...`) yang memicu overhead internal routing di CodeIgniter.
* **Solusi**:
  1. Hapus penarikan kolom `b.ttd` / `c.ttd` dari query `load_datatables_...()` di Model. Cukup tarik `b.pegawai_nm AS perawat_nm` (kolom TTD cukup ditarik pada method `get_...()` untuk cetak PDF).
  2. Gunakan `rtrim($this->uri_pelayanan, '/') . '/ajax_datatables/...'` pada `_js_list_..._modal.php` untuk mencegah double slash URL.

---

## 24. Hardcode Nomor Berkas RM (`berkas_no`) pada Lembar Cetak PDF (*Standardisasi Dynamic Berkas No*)
* **Gejala**: Nomor Berkas RM (seperti `RM 13.8.1`, `RM 13.9`) di-hardcode secara statis di HTML cetak PDF, atau tidak tampil saat `$berkas_no` dikirim dari controller.
* **Penyebab**: Belum adanya aturan seragam cara penarikan dan penulisan variabel `$berkas_no` di lembar cetak PDF.
* **Solusi**:
  1. Pada Controller (`cetak_...` & `cetak_..._all`), wajib jalankan alur **3-Tier Fallback Retrieval**:
     ```php
     $berkas_no = !empty($berkas_no) ? $berkas_no : _get('berkas_no');
     if (empty($berkas_no)) {
       $get_erm = DB::raw('row_array', "SELECT berkas_no FROM mst_erekam_medis WHERE function_controller LIKE '%list_[fitur]_modal%' AND deleted_st = 0 AND active_st = 1 LIMIT 1");
       $berkas_no = !empty($get_erm['berkas_no']) ? $get_erm['berkas_no'] : '[DEFAULT_RM_KODE]';
     }
     $data['berkas_no'] = rawurldecode(@$berkas_no);
     ```
  2. Pada View Cetak PDF (`cetak_...php`), wajib gunakan penulisan dinamis resmi **Pola B**:
     ```html
     <div class="header-title">
       [NAMA FORMULIR KAPITAL] 
       <span class="header-number"> (<?= !empty($berkas_no) ? $berkas_no : '[DEFAULT_RM_KODE]' ?>)</span>
     </div>
     ```


