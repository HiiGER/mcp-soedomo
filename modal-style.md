# Kaidah & Standardisasi Pembuatan Modal Form SIMRS RSUD Soedomo

Dokumen ini berisi standar pengembangan antarmuka (UI), arsitektur modal bertingkat (*multi-level modal stacking*), serta konvensi penulisan file View dan JavaScript pada modal SIMRS RSUD Soedomo berbasis [itm.js](file:///home/geri/ITM/SOEDOMO/simrs/dist/js/itm.js).

> [!CAUTION]
> **STANDAR TUNGGAL BENCHMARK SIKLUS ERM (TRACKED BASE CODE)**:
> Seluruh pembuatan Modal Form & List ERM **WAJIB KONSISTEN 100%** mengacu pada berkas referensi resmi terkomit di repositori:
> - Form Modal: `form_informed_consent_tonsilektomy_modal.php` & `form_surat_pernyataan_menolak_resusitasi_modal.php`
> - List Modal: `list_informed_consent_tonsilektomy_modal.php` & `list_pernyataan_penjaminan_biaya_modal.php`
> 
> **LARANGAN KETAT & ATURAN EFISIENSI TTD**:
> 1. **DILARANG** menggunakan wrapper `<div class="modal">` atau `<div class="card">` tambahan di dalam file view.
> 2. **DILARANG** menggunakan background warna kustom/aneh (seperti `bg-secondary`, `bg-light`, `bg-info`, dll.) untuk header seksi.
> 3. **DILARANG MENGUBAH FILE HELPER UTAMA** (`itm.canvas.js`, `itm.js`, `db_helper.php`). Seluruh pengolahan wajib berada pada file `_js_form_..._modal.php`.
> 4. **ATURAN SINGLE ENTRY TTD & NAMA**:
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

---

## 3. Template Code View Form Modal Level 2 (Full Source Code Reference)

```html
<?php include '_js_form_modul_modal.php' ?>

<form id="form-modul-modal" action="" method="post" autocomplete="on" enctype="multipart/form-data">
  <input type="hidden" name="modul_id" value="<?= @$main['modul_id'] ?>">
  <input type="hidden" name="pelayanan_id" value="<?= @$pelayanan['pelayanan_id'] ?>">
  <input type="hidden" name="registrasi_id" value="<?= @$pelayanan['registrasi_id'] ?>">
  <input type="hidden" name="pasien_id" value="<?= @$pelayanan['pasien_id'] ?>">
  <input type="hidden" name="lokasi_id" value="<?= @$pelayanan['lokasi_id'] ?>">
  <input type="hidden" name="erekammedis_id">

  <div class="row">
    <div class="col-lg-12 col-md-12">

      <h5 class="card-title mt-2 mb-1">A. IDENTITAS & INFORMASI FORMULIR</h5>
      
      <div class="mb-1 row">
        <label class="col-lg-3 col-md-4 col-form-label required">Nama Pasien / Pihak</label>
        <div class="col-lg-9 col-md-8">
          <input type="text" name="nama" class="form-control text-uppercase fw-bold" value="<?= (@$main['nama'] != '') ? @$main['nama'] : @$pelayanan['pasien_nm'] ?>" required>
        </div>
      </div>

      <div class="mb-1 row">
        <label class="col-lg-3 col-md-4 col-form-label required">Tanggal Pelayanan</label>
        <div class="col-lg-5 col-md-6">
          <div class="input-group">
            <span class="input-group-text"><i class="fas fa-calendar-alt"></i></span>
            <input type="text" name="tgl_pelayanan" class="form-control datetimepicker" value="<?= (@$main['tgl_pelayanan'] != '') ? to_date(@$main['tgl_pelayanan'], '', 'full_date') : date('d-m-Y H:i:s') ?>" required>
          </div>
        </div>
      </div>

      <!-- TTD Pihak Non-Pegawai / Penerima Resmi via _modalTtd (Single Entry Efficient Pattern) -->
      <h5 class="card-title mt-3 mb-1">B. PENGESAHAN & TANDA TANGAN</h5>

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

      <div class="mb-1 row">
        <label class="col-lg-3 col-md-4 col-form-label required">Dokter DPJP / PPA</label>
        <div class="col-lg-9 col-md-8">
          <?= _frm_select('dokter_id', [], 'dokter_id', '', @$main['dokter_id'], '- Pilih Dokter -', 'class="form-select select2-ajax me-2" data-url="ajax_statement/all_pegawai_select2" required') ?>
        </div>
      </div>

      <!-- Footer Action Buttons Standard RSUD Soedomo -->
      <div class="col-lg-12 col-md-12 mt-2">
        <div class="border-dotted"></div>
        <div class="row mt-2">
          <div class="text-end">
            <button type="submit" class="btn btn-primary"><?= _icon('save') ?> Simpan</button>
            <button type="button" class="btn btn-default" data-bs-dismiss="modal"><?= _icon('cancel') ?> Batal</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</form>
```

---

## 4. Template Code View List Modal Level 1 (Full Source Code Reference)

```html
<?php include '_js_list_modul_modal.php' ?>

<div class="row">
  <div class="col-lg-12 col-md-12">
    <div class="mb-2 text-end">
      <a href="javascript:void(0)" onclick="_modal(event, {uri: '<?= site_url($this->template . 'form_modul_modal/' . $pelayanan_id . '/' . $registrasi_id) ?>', size: 'modal-xl', title: 'Tambah Data ERM'}, 2)" class="btn btn-primary">
        <i class="fas fa-plus me-1"></i> Tambah Data
      </a>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-striped table-hover w-100" id="datatable-modul-main">
        <thead class="table-light text-center">
          <tr>
            <th width="5%">No</th>
            <th width="15%">Tanggal</th>
            <th>Nama Pihak / Pasien</th>
            <th>Dokter DPJP</th>
            <th width="15%">Aksi</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</div>
```

---

## 5. Pilihan Ukuran Modal (*Modal Sizes*)

| Value Properti `size` | Class CSS Output | Penggunaan Ideal |
| :--- | :--- | :--- |
| `'modal-sm'` | `.modal-sm` | Dialog konfirmasi kecil. |
| `'modal-md'` | `.modal-md` | Form isian singkat / Modal pencarian pasien / `ttd_general_modal`. |
| `'modal-lg'` | `.modal-lg` | Form isian sedang. |
| `'modal-xl'` | `.modal-xl` | **Standar Form ERM**, tabel DataTables riwayat, form asesmen medis/keperawatan. |
