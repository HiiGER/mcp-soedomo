# Kaidah & Standardisasi Pembuatan Modal Form SIMRS RSUD Soedomo

Dokumen ini berisi standar pengembangan antarmuka (UI), arsitektur modal bertingkat (*multi-level modal stacking*), serta konvensi penulisan file View dan JavaScript pada modal SIMRS RSUD Soedomo berbasis [itm.js](file:///home/geri/ITM/SOEDOMO/simrs/dist/js/itm.js).

> [!CAUTION]
> **STANDAR TUNGGAL BENCHMARK (NON-NEGOTIABLE RULE)**:
> Seluruh pembuatan Modal Form & List ERM **WAJIB KONSISTEN 100%** mengikuti acuan paten **Pengkajian Geriatri Rawat Jalan** (`form_pengkajian_geriatri_rajal_modal.php` & `list_pengkajian_geriatri_rajal_modal.php`).
> 
> **LARANGAN KETAT & ATURAN EFISIENSI TTD**:
> 1. **DILARANG** menggunakan wrapper `<div class="modal">` atau `<div class="card">` tambahan di dalam file view.
> 2. **DILARANG** menggunakan background warna kustom/aneh (seperti `bg-secondary`, `bg-light`, `bg-info`, dll.) untuk header seksi.
> 3. **DILARANG MENGUBAH FILE HELPER UTAMA** (`itm.canvas.js`, `itm.js`, `db_helper.php`). Seluruh pengolahan wajib berada pada file `_js_form_..._modal.php`.
> 4. **DILARANG MEMBUAT INPUT TEXT TERPISAH UNTUK NAMA PENERIMA / SAKSI (ATURAN SINGLE ENTRY TTD)**:
>    Karena modal canvas `_modalTtd(callback, 'nama', label, name)` sudah menyediakan form input nama (`#name-ttd-modal`), maka di dalam form view **DILARANG** membuat input text terpisah. Cukup sediakan `<input type="hidden" name="[nama_field]">` dan label indikator `<b>Nama : <span id="label_[nama_field]">-</span></b>`.
> 5. **Wajib** menggunakan tombol aksi footer standar SIMRS RSUD Soedomo:
>    - Simpan: `<button type="submit" class="btn btn-primary"><?= _icon('save') ?> Simpan</button>`
>    - Batal: `<button type="button" class="btn btn-default" data-bs-dismiss="modal"><?= _icon('cancel') ?> Batal</button>`

---

## 1. Arsitektur Dynamic Modal Container (`itm.js`)

Library JS `itm.js` secara otomatis mengelola penciptaan dan injeksi DOM kontainer modal di `body` halaman dengan ID:
- `#my-modal-1` (Kontainer Modal Level 1 - List History / DataTables)
- `#my-modal-2` (Kontainer Modal Level 2 - Form Input / Edit)
- `#modal-body-1` & `#modal-body-2` (Area kontainer tempat HTML View di-render via AJAX)
- `#modal-size-1` & `#modal-size-2` (Pengatur ukuran modal Bootstrap)

---

## 2. Standar Efisiensi Tanda Tangan Pasien / Pihak Luar (`_modalTtd`)

Setiap kali terdapat inputan Tanda Tangan untuk Pasien, Saksi, atau Pihak Luar (Keluarga/Wali/Penerima), **WAJIB** menggunakan helper canvas resmi `_modalTtd(callback, type, label, name)` dan `ttd_general_modal` dengan pola *Single-Entry Efficient Pattern*.

> [!IMPORTANT]
> **GARANSI RETRIEVAL DATA BASE64 (`this.result` + DOM FALLBACK)**:
> Agar asset tanda tangan terjamin 100% tersimpan tanpa menyentuh/mengubah file helper `itm.canvas.js`, fungsi callback `ttdPenerimaSave` wajib dilengkapi dengan *direct canvas fallback*:
> ```javascript
> var ttdPenerimaSave = function() {
>   var ttd_base64 = (this && this.result) ? this.result : "";
>   var c0 = document.getElementById("canvas_0");
>   if ((!ttd_base64 || ttd_base64 === "") && c0) {
>     ttd_base64 = c0.toDataURL("image/png");
>   }
>   if (!ttd_base64 || ttd_base64 === "") {
>     ttd_base64 = $("#canvas_image_0").val();
>   }
>   var ttd_nama = (this && this.nama) ? this.nama : $("#name-ttd-modal").val();
>   ...
> };
> ```

### 2.1 View Component Standard (Efficient Single-Entry Pattern)
```html
<div class="mb-1 row">
  <label class="col-lg-3 col-md-4 col-form-label">Pihak yang Menerima (Keluarga/Wali)</label>
  <div class="col-lg-9 col-md-8 pt-1">
    <div>
      <a href="javascript:void(0)" class="btn btn-warning btn-ttd-penerima-belum <?= (!empty($main['pihak_menerima_ttd'])) ? 'd-none' : '' ?>" onclick="_modalTtd(ttdPenerimaSave, 'nama', 'Nama Pihak yang Menerima', 'pihak_menerima_nm')"><i class="fas fa-signature me-1"></i> Ambil TTD Penerima</a>
      <a href="javascript:void(0)" class="btn btn-success btn-ttd-penerima-sudah <?= (empty($main['pihak_menerima_ttd'])) ? 'd-none' : '' ?>" onclick="_lihatTtdPenerima()"><i class="fas fa-eye me-1"></i> SUDAH TTD</a>
      <a href="javascript:void(0)" class="btn btn-danger btn-ttd-penerima-sudah <?= (empty($main['pihak_menerima_ttd'])) ? 'd-none' : '' ?>" onclick="_deleteTtdPenerima()"><i class="fas fa-trash-alt me-1"></i> HAPUS TTD</a>
    </div>
    <input type="hidden" name="pihak_menerima_nm" id="pihak_menerima_nm" value="<?= @$main['pihak_menerima_nm'] ?>">
    <input type="hidden" name="pihak_menerima_ttd" id="pihak_menerima_ttd" value="<?= @$main['pihak_menerima_ttd'] ?>">
    <div class="mt-1 text-black"><b>Nama Penerima : <span id="label_pihak_menerima_nm"><?= @$main['pihak_menerima_nm'] ? @$main['pihak_menerima_nm'] : '-' ?></span></b></div>
  </div>
</div>
```

### 2.2 JavaScript Handler Standard (`_js_form_..._modal.php`)
```javascript
var ttdPenerimaSave = function() {
  var ttd_base64 = (this && this.result) ? this.result : "";
  var c0 = document.getElementById("canvas_0");
  if ((!ttd_base64 || ttd_base64 === "") && c0) {
    ttd_base64 = c0.toDataURL("image/png");
  }
  if (!ttd_base64 || ttd_base64 === "") {
    ttd_base64 = $("#canvas_image_0").val();
  }

  var ttd_nama = (this && this.nama) ? this.nama : $("#name-ttd-modal").val();

  if (ttd_base64 && ttd_base64 !== "") {
    $("#pihak_menerima_ttd").val(ttd_base64);
    if (ttd_nama && ttd_nama !== "") {
      $("#pihak_menerima_nm").val(ttd_nama);
      $("#label_pihak_menerima_nm").html(ttd_nama);
    }
    $(".btn-ttd-penerima-belum").addClass("d-none");
    $(".btn-ttd-penerima-sudah").removeClass("d-none");
  }
};

function _lihatTtdPenerima() {
  var id = $('input[name="sertifikatmedispenyebabkematian_id"]').val();
  var url = "";
  if (id && id != "") {
    url = "<?= $this->uri_pelayanan . '/ttd_general_modal/db/dat_sertifikat_medis_penyebab_kematian/pihak_menerima_ttd/sertifikatmedispenyebabkematian_id/' ?>" + id;
  } else {
    url = "<?= $this->uri_pelayanan . '/ttd_general_modal/form/dat_sertifikat_medis_penyebab_kematian/pihak_menerima_ttd' ?>";
  }
  _modal(event, { uri: url, size: 'modal-md', title: 'Tanda Tangan Pihak yang Menerima' }, 3);
}

function _deleteTtdPenerima() {
  $("#pihak_menerima_ttd").val("");
  $("#pihak_menerima_nm").val("");
  $("#label_pihak_menerima_nm").html("-");
  $(".btn-ttd-penerima-belum").removeClass("d-none");
  $(".btn-ttd-penerima-sudah").addClass("d-none");
}
```

---

## 3. Pilihan Ukuran Modal (*Modal Sizes*)

| Value Properti `size` | Class CSS Output | Penggunaan Ideal |
| :--- | :--- | :--- |
| `'modal-sm'` | `.modal-sm` | Dialog konfirmasi kecil. |
| `'modal-md'` | `.modal-md` | Form isian singkat / Modal pencarian pasien / `ttd_general_modal`. |
| `'modal-lg'` | `.modal-lg` | Form isian sedang. |
| `'modal-xl'` | `.modal-xl` | **Standar Form ERM**, tabel DataTables riwayat, form asesmen medis/keperawatan. |

---

## 4. Standard Struktur HTML & CSS Form Modal

### 4.1 Section Title Standard
```html
<h5 class="card-title mt-2 mb-1">A. JUDUL SEKSI FORM</h5>
<h6 class="card-title mt-1 mb-1">1. Sub Judul Seksi Form</h6>
```

### 4.2 Grid Row Input Form Standard
```html
<div class="mb-1 row">
  <label class="col-lg-3 col-md-4 col-form-label required">Nama Field</label>
  <div class="col-lg-9 col-md-8">
    <input type="text" name="field_name" class="form-control" required>
  </div>
</div>
```

### 4.3 Input Tanggal / Jam Standard
```html
<div class="input-group">
  <span class="input-group-text"><i class="fas fa-calendar-alt"></i></span>
  <input type="text" class="form-control text-black datetimepicker" name="tgl_field" value="<?= date('d-m-Y H:i:s') ?>">
</div>
```

### 4.4 Footer Action Buttons Paten SIMRS RSUD Soedomo
```html
<div class="col-lg-12 col-md-12 mt-2">
  <div class="border-dotted"></div>
  <div class="row mt-2">
    <div class="text-end">
      <button type="submit" class="btn btn-primary"><?= _icon('save') ?> Simpan</button>
      <button type="button" class="btn btn-default" data-bs-dismiss="modal"><?= _icon('cancel') ?> Batal</button>
    </div>
  </div>
</div>
```
