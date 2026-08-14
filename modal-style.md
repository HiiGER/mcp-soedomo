# Kaidah & Standardisasi Pembuatan Modal Form SIMRS RSUD Soedomo

Dokumen ini berisi standar pengembangan antarmuka (UI), arsitektur modal bertingkat (*multi-level modal stacking*), serta konvensi penulisan file View dan JavaScript pada modal SIMRS RSUD Soedomo berbasis [itm.js](file:///home/geri/ITM/SOEDOMO/simrs/dist/js/itm.js).

---

## 1. Arsitektur Dynamic Modal Container (`itm.js`)

Sistem SIMRS RSUD Soedomo **tidak memerlukan** penulisan boilerplate HTML `<div class="modal">` di setiap file view. Library JS `itm.js` secara otomatis mengelola penciptaan dan injeksi DOM kontainer modal di `body` halaman dengan ID:
- `#my-modal-1` (Kontainer Modal Level 1)
- `#my-modal-2` (Kontainer Modal Level 2)
- `#modal-body-1` & `#modal-body-2` (Area kontainer tempat HTML View di-render via AJAX)
- `#modal-size-1` & `#modal-size-2` (Pengatur ukuran modal Bootstrap)

```
+-----------------------------------------------------------------------------------+
| [#my-modal-1] Level 1 Modal: List Modal (Data History / DataTables)              |
| Injected automatically into DOM by itm.js                                         |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [+ Tambah Data] ---> Triggers _modal(event, {uri: '...'}, 2)                 |  |
|  +-----------------------------------------------------------------------------+  |
|  | [ DataTables Server-Side List: #datatable-fitur-main ]                       |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | [#my-modal-2] Level 2 Modal: Form Input / Edit Modal                         |  |
|  | Injected dynamically over Level 1                                           |  |
|  |                                                                             |  |
|  | [ Form Inputs & Controls SIMRS ]                                            |  |
|  |                                                                             |  |
|  | [ Simpan ] ---> AJAX Submit -> _modalHide(2) + tabel.draw()                 |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Pilihan Ukuran Modal (*Modal Sizes*)

Properti `size` pada argumen `_modal()` atau `_modalNoEvent()` mendukung class Bootstrap & Tabler berikut:

| Value Properti `size` | Class CSS Output | Penggunaan Ideal |
| :--- | :--- | :--- |
| `'modal-sm'` | `.modal-sm` | Dialog konfirmasi kecil, verifikasi PIN/fingerprint. |
| `'modal-md'` | `.modal-md` | Form isian singkat, modal cari pasien/ERM, form upload file. |
| `'modal-lg'` | `.modal-lg` | Form isian sedang (asesmen singkat, resep sederhana). |
| `'modal-xl'` | `.modal-xl` | **Standar Form ERM**, tabel DataTables riwayat, form asesmen medis/keperawatan. |
| `'modal-full-width'` | `.modal-full-width` | Form kompleks layar penuh (monitoring ICU/HCU, CPPT terintegrasi). |

---

## 3. Fungsi Utility JavaScript Modal Launcher

### 3.1 `_modal(event, arg, idx = 1)`
Fungsi utama meluncurkan modal dari tombol / link yang diklik.
- **Param `e`**: `event` DOM klik.
- **Param `arg`**: Object konfigurasi:
  - `uri`: Endpoint URL yang mengembalikan respon HTML view.
  - `size`: Class ukuran modal (`modal-sm` s/d `modal-xl`).
  - `position`: `'normal'` atau `'center'` (modal dialog di tengah).
  - `title`: Judul modal (jika kosong, mengambil `innerText` tombol).
  - `loading`: `true`/`false` (tampilkan animasi spinner loading).
- **Param `idx`**: Tingkat modal (`1` untuk modal utama, `2` untuk modal bertingkat/popup di atas modal 1).

```javascript
// Membuka List Modal (Level 1)
_modal(event, {
    uri: '<?= $this->uri_pelayanan . "/list_tih_modal/" . $pelayanan_id . "/" . $registrasi_id ?>',
    size: 'modal-xl',
    position: 'normal',
    title: 'RIWAYAT TRANSFER INTRA HOSPITAL'
}, 1);

// Membuka Form Input Modal (Level 2 dari dalam Level 1)
_modal(event, {
    uri: '<?= $this->uri_pelayanan . "/form_tih_modal/" . $pelayanan_id . "/" . $registrasi_id ?>',
    size: 'modal-xl',
    position: 'normal',
    title: 'FORM ISIAN TRANSFER INTRA HOSPITAL'
}, 2);
```

---

### 3.2 `_modalNoEvent(arg, idx = 1)`
Sama seperti `_modal`, namun digunakan jika pemanggilan dilakukan secara berantai dari script JavaScript tanpa event klik langsung.

```javascript
_modalNoEvent({
    uri: _base_url + 'pelayanan/form_tih_modal/123/456',
    size: 'modal-xl',
    title: 'Edit Transfer Intra Hospital'
}, 2);
```

---

### 3.3 `_modalHide(idx = 1)`
Menutup modal berdasarkan tingkatan index `idx`.
- `_modalHide(1)`: Menutup Modal Level 1.
- `_modalHide(2)`: Menutup Modal Level 2.

---

## 4. 4 Aturan Emas Penulisan View Modal (*View Rules*)

1. **DILARANG BUNGKUS MODAL DENGAN `<div class="modal">` ATAU `<div class="card">`**:
   View modal **langsung berisi elemen UI** (tabel, form, row, col). Membungkus view dengan elemen modal/card buatan sendiri akan merusak layout backdrop Bootstrap dan menyebabkan modal tidak dapat diklik (*backdrop glitch*).
2. **ISOLASI JAVASCRIPT HANYA PADA BARIS PERTAMA**:
   File view utama (`list_..._modal.php` / `form_..._modal.php`) hanya merender struktur HTML. Seluruh event handler, inisialisasi plugin, dan logika JS **WAJIB** dipisahkan ke file `_js_..._modal.php` dan di-include pada baris paling atas view:
   ```html
   <?php include '_js_form_tih_modal.php'; ?>
   ```
3. **ALUR PENUTUPAN & REDRAW DATATABLES**:
   Setelah form pada Modal Level 2 berhasil disimpan via AJAX, **JANGAN RE-LOAD HALAMAN**. Tutup Modal Level 2 via `_modalHide(2)` dan perbarui tabel DataTables di Modal Level 1 via `tabel.draw()`:
   ```javascript
   if (resp.status == '01' || resp.status == '02') {
       _modalHide(2); // Tutup modal form level 2
       tabel_tih.draw(); // Refresh tabel level 1
       _alert(resp.message, 'success');
   }
   ```
4. **ELEMEN FORM & ACTION ATTRIBUTE**:
   Setiap form wajib menggunakan class standar SIMRS (`form-horizontal`, `form-control-sm`) dan tombol aksi standar (`btn-primary` untuk Simpan, `btn-secondary` untuk Batal).

---

## 5. Template Lengkap View & Script Modal

### 5.1 View List Modal Level 1 (`list_tih_modal.php`)

```html
<?php include '_js_list_tih_modal.php'; ?>

<div class="mb-2">
  <a href="javascript:void(0)"
     onclick="_modal(event, {uri: '<?= $this->uri_pelayanan . '/form_tih_modal/' . @$pelayanan_id . '/' . @$registrasi_id ?>', size: 'modal-xl', position: 'normal', title: 'TAMBAH TRANSFER INTRA HOSPITAL'}, 2)"
     class="btn btn-primary btn-sm">
    <?= _icon('add') ?> Tambah TIH Baru
  </a>
</div>

<div class="table-responsive">
  <table class="table table-vcenter card-table table-striped table-sm display nowrap" id="datatable-tih-main" style="width:100%">
    <thead>
      <tr>
        <th width="5%">No</th>
        <th width="10%">Aksi</th>
        <th width="15%">Tgl. Transfer</th>
        <th>Ruang Asal</th>
        <th>Ruang Tujuan</th>
        <th>Dokter Pengirim</th>
        <th width="10%">Cetak</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
```

---

### 5.2 Script JS List Modal (`_js_list_tih_modal.php`)

```html
<script>
  var tabel_tih;
  $(document).ready(function() {
    tabel_tih = $('#datatable-tih-main').DataTable({
      "processing": true,
      "serverSide": true,
      "order": [],
      "ajax": {
        "url": "<?= site_url($this->template . 'ajax_datatables/tih') ?>",
        "type": "POST",
        "data": function(d) {
          d.registrasi_id = '<?= @$registrasi_id ?>';
          d._token = _token;
        }
      },
      "columnDefs": [
        { "targets": [0, 1, 6], "orderable": false }
      ]
    });
  });

  function delete_tih(id) {
    _confirm('Apakah Anda yakin ingin menghapus data ini?', function() {
      $.post("<?= site_url($this->template . 'delete_tih/') ?>" + id, { _token: _token }, function(res) {
        if (res.status == '03') {
          _alert('Data berhasil dihapus', 'success');
          tabel_tih.draw();
        }
      }, 'json');
    });
  }
</script>
```

---

### 5.3 View Form Modal Level 2 (`form_tih_modal.php`)

```html
<?php include '_js_form_tih_modal.php'; ?>

<form id="form-tih-input" action="<?= @$form_act ?>" method="POST">
  <input type="hidden" name="tih_id" value="<?= @$main['tih_id'] ?>">
  <input type="hidden" name="pelayanan_id" value="<?= @$pelayanan_id ?>">
  <input type="hidden" name="registrasi_id" value="<?= @$registrasi_id ?>">
  <input type="hidden" name="erekammedis_id" value="01.0001">

  <div class="row">
    <div class="col-md-6 mb-3">
      <label class="form-label required">Tanggal Transfer</label>
      <input type="text" name="tgl_transfer" class="form-control form-control-sm flatpickr-datetime" value="<?= @$main['tgl_transfer'] ?>" required>
    </div>

    <div class="col-md-6 mb-3">
      <label class="form-label required">Dokter DPJP</label>
      <select name="dokter_id" class="form-select form-select-sm select2-modal" required>
        <option value="">-- Pilih Dokter --</option>
        <?php foreach ($all_dokter as $d) : ?>
          <option value="<?= $d['pegawai_id'] ?>" <?= @$main['dokter_id'] == $d['pegawai_id'] ? 'selected' : '' ?>><?= $d['pegawai_nm'] ?></option>
        <?php endforeach; ?>
      </select>
    </div>

    <div class="col-md-12 mb-3">
      <label class="form-label">Catatan PPA / Transfer</label>
      <textarea name="catatan_transfer" class="form-control form-control-sm" rows="3"><?= @$main['catatan_transfer'] ?></textarea>
    </div>
  </div>

  <div class="text-end mt-3">
    <button type="button" class="btn btn-secondary btn-sm" onclick="_modalHide(2)">
      <?= _icon('cancel') ?> Batal
    </button>
    <button type="submit" class="btn btn-primary btn-sm" id="btn-simpan-tih">
      <?= _icon('save') ?> Simpan Data
    </button>
  </div>
</form>
```

---

### 5.4 Script JS Form Modal (`_js_form_tih_modal.php`)

```html
<script>
  $(document).ready(function() {
    // Inisialisasi plugin UI Bootstrap & Select2 di dalam modal
    $('.select2-modal').select2({
      dropdownParent: $('#my-modal-2')
    });

    $('#form-tih-input').submit(function(e) {
      e.preventDefault();
      var btn = $('#btn-simpan-tih');
      btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...');

      $.ajax({
        url: $(this).attr('action'),
        type: 'POST',
        data: $(this).serialize() + '&_token=' + _token,
        dataType: 'json',
        success: function(resp) {
          btn.prop('disabled', false).html('<?= _icon('save') ?> Simpan Data');
          if (resp.status == '01' || resp.status == '02') {
            _modalHide(2);
            if (typeof tabel_tih !== 'undefined') {
              tabel_tih.draw();
            }
            _alert('Data berhasil disimpan', 'success');
          } else {
            _alert(resp.message || 'Gagal menyimpan data', 'danger');
          }
        },
        error: function() {
          btn.prop('disabled', false).html('<?= _icon('save') ?> Simpan Data');
          _alert('Terjadi kesalahan koneksi server', 'danger');
        }
      });
    });
  });
</script>
```
