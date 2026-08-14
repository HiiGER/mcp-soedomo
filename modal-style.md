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

### 5.1 View List Modal Level 1 (`list_modul_modal.php`)

```html
<?php include '_js_list_modul_modal.php' ?>

<div class="mb-2">
  <a href="javascript:void(0)" onclick="_modal(event, {uri: '<?= $this->uri_pelayanan . '/form_modul_modal/' . @$pelayanan_id . '/' . @$registrasi_id ?>', size: 'modal-xl', position: 'normal', title: 'Form Fitur Baru'}, 2)" class="btn btn-primary"><i class="fas fa-plus-circle me-1"></i> Tambah Data</a>
</div>
<div class="table-responsive">
  <table class="table table-vcenter card-table table-striped table-sm display nowrap" id="datatable-modul-main">
    <thead>
      <tr>
        <th width="5%">No</th>
        <th width="7%">Aksi</th>
        <th width="10%">Tgl</th>
        <th>Nama Pembuat / Detail</th>
        <th width="5%">Cetak</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>
```

---

### 5.2 Script JS List Modal (`_js_list_modul_modal.php`)

```html
<script type="text/javascript">
  var tabel = null;
  $(document).ready(function() {
    tabel = $('#datatable-modul-main').DataTable({
      "language": {
        url: '<?= base_url() ?>dist/libs/DataTables/id.json',
      },
      "autoWidth": false,
      "processing": true,
      "responsive": true,
      "serverSide": true,
      "ordering": true,
      "order": [
        [0, 'asc']
      ],
      "ajax": {
        "url": "<?= $this->uri_pelayanan . '/ajax_datatables/modul_name?n=' . _get('n') ?>",
        "type": "POST",
        "data": {
          "pelayanan_id": "<?= @$pelayanan_id ?>",
          "registrasi_id": "<?= @$registrasi_id ?>",
        }
      },
      "deferRender": true,
      "aLengthMenu": _datatableLengthMenu,
      "columns": [{
          "data": "modul_id",
          "sortable": false,
          "render": function(data, type, row, meta) {
            return meta.row + meta.settings._iDisplayStart + 1;
          }
        },
        {
          "data": "modul_id",
          "className": "text-left",
          "render": function(data, type, row, meta) {
            var uri_edit = '<?= $this->uri_pelayanan . '/form_modul_modal/' . @$pelayanan_id . '/' . @$registrasi_id . '/' ?>' + data;
            var registrasi_id = ifNull(row.registrasi_id);
            return '' +
              '<div class="btn-list btn-sm flex-nowrap">' +
              '  <div class="dropdown"> ' +
              '     <button class="btn btn-outline-primary btn-sm dropdown-toggle align-text-top" data-bs-toggle="dropdown">' +
              '          Aksi' +
              '     </button>' +
              '     <div class="dropdown-menu">' +
              '      <a class="dropdown-item p-1" href="javascript:void(0)" onclick="_modal(event, {uri: \'' + uri_edit + '\', size: \'modal-xl\', position: \'normal\', title: \'Ubah\'}, 2)">' +
              '          <?= _icon('edit') ?> Ubah' +
              '      </a>' +
              '      <a class="dropdown-item p-1" href="javascript:void(0)" onclick=_delete_modul("' + data + '","' + registrasi_id + '")>' +
              '          <?= _icon('trash') ?> Hapus' +
              '      </a>' +
              '   </div>' +
              ' </div>' +
              '</div>';
          }
        },
        {
          "data": "created_at",
          "className": "text-left",
          "render": function(data, type, row, meta) {
            return toDate(data, '', 'full_date');
          }
        },
        {
          "data": "pembuat_nm",
          "className": "text-left",
        },
        {
          "data": "modul_id",
          "className": "text-left",
          "render": function(data, type, row, meta) {
            var uri_print = '<?= $this->uri_pelayanan . '/cetak_modul/' ?>';
            return '<a href="javascript:void(0)" onclick="_modalPrint(event, {uri: \'' + uri_print + row.pelayanan_id + '/' + data + '\', size: \'modal-xl\', position: \'normal\', title: \'Cetak Dokumen\'}, 5)" class="btn btn-sm btn-primary"><i class="fas fa-print me-1"></i> Cetak</a>';
          }
        },
      ],
    });
  });

  function _delete_modul(id, registrasi_id = '') {
    Swal.fire({
      title: 'Perhatian!',
      text: 'Apakah Anda yakin ingin menghapus data ini?',
      icon: 'warning',
      customClass: "swal-wide",
      showCancelButton: true,
      cancelButtonColor: "#858F9B",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3376B8",
      confirmButtonText: "Hapus",
    }).then((result) => {
      if (result.isConfirmed) {
        $.post("<?= site_url($this->template . 'delete_modul/') ?>" + id, { _token: _token }, function(res) {
          if (res.status == '03') {
            _alert('Data berhasil dihapus', 'success');
            if (tabel) tabel.draw();
          } else {
            _alert(res.message || 'Gagal menghapus data', 'danger');
          }
        }, 'json');
      }
    });
  }
</script>
```

---

### 5.3 View Form Modal Level 2 (`form_tih_modal.php` - Referensi Paten Standard)

```html
<?php include '_js_form_tih_modal.php' ?>

<form id="form-tih-modal" action="" method="post" autocomplete="on" enctype="multipart/form-data">
  <input type="hidden" name="tih_id" value="<?= @$main['tih_id'] ?>">
  <input type="hidden" name="pelayanan_id" value="<?= @$pelayanan['pelayanan_id'] ?>">
  <input type="hidden" name="registrasi_id" value="<?= @$pelayanan['registrasi_id'] ?>">
  <input type="hidden" name="pasien_id" value="<?= @$pelayanan['pasien_id'] ?>">
  <input type="hidden" name="lokasi_id" value="<?= @$pelayanan['lokasi_id'] ?>">
  <input type="hidden" name="erekammedis_id">

  <div class="row">
    <div class="col-lg-12 col-md-12">
      <!-- Section Row Header Field -->
      <div class="row">
        <div class="col-4">
          <div class="mb-1">
            <label class="form-label mb-1">Tgl. Catat</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-calendar-alt"></i></span>
              <input type="text" class="form-control text-black datetimepicker" name="tih_tgl" value="<?= (@$main['tih_tgl'] != '') ? to_date(@$main['tih_tgl'], '', 'full_date') : date('d-m-Y H:i:s') ?>">
            </div>
          </div>
        </div>
        <div class="col-4">
          <div class="mb-1">
            <label class="form-label mb-1 required">Perawat Yang Menyerahkan</label>
            <?= _frm_select('perawatygmenyerahkan_id', [], 'perawatygmenyerahkan_id', '', @$main['perawatygmenyerahkan_id'], '- Pilih -', 'class="form-select select2-ajax me-2" data-url="ajax_statement/all_pegawai_select2" required') ?>
          </div>
        </div>
        <div class="col-4">
          <div class="mb-1">
            <label class="form-label mb-1">Perawat Yang Menerima</label>
            <?= _frm_select('perawatygmenerima_id', [], 'perawatygmenerima_id', '', @$main['perawatygmenerima_id'], '- Pilih -', 'class="form-select select2-ajax me-2" data-url="ajax_statement/all_pegawai_select2"') ?>
          </div>
        </div>
      </div>

      <!-- Section Title Standard -->
      <h5 class="card-title mt-1 mb-1">JUDUL SEKSI FORM</h5>
      <div class="row">
        <div class="col-6">
          <div class="mb-1">
            <label class="form-label mb-1">Dokter DPJP</label>
            <?= _frm_select('dokter_id', [], 'dokter_id', '', @$main['dokter_id'], '- Pilih -', 'class="form-select select2-ajax me-2" data-url="ajax_statement/all_pegawai_select2" required') ?>
          </div>
          <div class="mb-1">
            <label class="form-label mb-1">Catatan</label>
            <textarea class="form-control" rows="3" name="catatan"><?= @$main['catatan'] ?></textarea>
          </div>
        </div>
      </div>

      <!-- Footer Action Buttons Standard Paten RSUD Soedomo -->
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

### 5.4 Script JS Form Modal (`_js_form_tih_modal.php` - Referensi Paten Standard)

```html
<script type="text/javascript">
  $(document).ready(function() {
    $('input[name="erekammedis_id"]').val($('#erekammedis_id_form').val());

    // Populate Select2 AJAX untuk data PPA / Dokter / Perawat jika mode Edit
    <?php if (@$main['dokter_id'] != '') : ?>
      var ppaId = {
        id: '<?= @$main['dokter_id'] ?>',
        text: '<?= @$main['dokter_nm'] ?>'
      };
      var ppaIdOption = new Option(ppaId.text, ppaId.id, false, false);
      $("select[name='dokter_id']").append(ppaIdOption).trigger('change');
      $("select[name='dokter_id']").val(ppaId.id).trigger('change');
    <?php endif; ?>

    // Standard jQuery Validation & Handler Submit Form Modal
    $("#form-tih-modal").validate({
      rules: {},
      messages: {},
      errorElement: "em",
      errorPlacement: function(error, element) {
        error.addClass("invalid-feedback");
        if (element.prop("type") === "checkbox") {
          error.insertAfter(element.next("label"));
        } else if ($(element).hasClass("chosen-select") || $(element).hasClass("select2-ajax")) {
          error.insertAfter(element.next(".select2-container")).addClass("mt-n2 mb-1");
        } else if (element.prop("type") === "radio") {
          error.appendTo(element.parents(".input-checkbox")).addClass("d-block");
        } else {
          error.insertAfter(element);
        }
      },
      highlight: function(element, errorClass, validClass) {
        $(element).addClass("is-invalid").removeClass("is-valid");
      },
      unhighlight: function(element, errorClass, validClass) {
        $(element).addClass("is-valid").removeClass("is-invalid");
      },
      submitHandler: function(form) {
        $("button[type='submit']").attr("disabled", true);
        loadingShow();
        var formData = new FormData(form);
        formData.append("_is_ajax", true);
        formData.append("_token", _token);

        $.ajax({
            type: "POST",
            url: "<?= @$form_act . '?n=' . _get('n') ?>",
            data: formData,
            processData: false,
            contentType: false,
          })
          .done(function(res) {
            if (res == null) {
              loadingHide();
              $("button[type='submit']").attr("disabled", false);
              _toast("error", "Terjadi kesalahan sistem");
            } else {
              var message = res.message;
              if (res.data !== null && res.data != "") {
                if (typeof res.data === "object" || Array.isArray(res.data)) {
                  message = res.message;
                } else {
                  message = res.message + "<br>" + res.data;
                }
              }
              if (res.status) {
                _modalHide(2);
                if (typeof tabel !== 'undefined' && tabel) {
                  tabel.draw();
                }
                loadingHide();
                $("button[type='submit']").attr("disabled", false);
                _toast("success", message);
              } else {
                loadingHide();
                $("button[type='submit']").attr("disabled", false);
                _toast("error", message);
              }
            }
          })
          .fail(function(xhr, status, error) {
            loadingHide();
            $("button[type='submit']").attr("disabled", false);
            _toast("error", "Terjadi kesalahan sistem<br>" + xhr.status + " (" + error + ")");
          });
        return false;
      },
    });
  });
</script>
```
