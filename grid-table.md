# Panduan Penggunaan & Integrasi GridTable (Tabel Dinamis ERM)

Dokumen ini berisi acuan baku penggunaan plugin Javascript **GridTable** (`dist/libs/grid-table/gridTable.js`) untuk pembuatan tabel dinamis (monitoring/observasi multi-baris) pada modul E-Rekam Medis (ERM) SIMRS RSUD dr. Soedomo Trenggalek.

---

## 📌 1. Prinsip Utama & Arsitektur GridTable

`GridTable` digunakan pada form ERM yang membutuhkan input berulang (*dynamic multi-row*) seperti tabel observasi vital sign, lembar monitoring restrain, daftar obat riwayat, atau daftar tindakan/prosedur.

### Komponen Utama:
1. **View HTML (`form_..._modal.php`)**: Menyiapkan elemen `<table id="item_observasi"></table>`.
2. **View JS (`_js_form_..._modal.php`)**: Menginisialisasi plugin `$("#item_observasi").gridTable({ ... })`.
3. **Model Backend (`M_pelayanan.php`)**:
   - Memproses submit array dari form.
   - Membersihkan variabel metadata non-kolom (seperti `$d['no']`, `$d['_is_ajax']`, `$d['_token']`).
   - Menyimpan daftar baris sebagai JSON string ke kolom `observasi_detail` (TEXT).
4. **Cetak PDF (`cetak_...php`)**: Mengurai JSON string (`json_decode`) menjadi baris tabel HTML baku.

---

## ⚠️ 2. Kaidah Mandatori Format Data Baris (`rows`)

> [!IMPORTANT]
> `gridTable.js` **MEWAJIBKAN** data baris (`rows`) dikirimkan dalam format **Array Terurut berdasarkan Posisi Kolom (`[col0, col1, col2, ...]`)**, BUKAN berupa Objek `{field: val}`.

### Contoh Pemetaan Data yang Benar (PHP & JS):

```javascript
// Pemetaan data dari JSON database ke format Array terurut GridTable
var raw_observasi = <?= !empty($main['observasi_list']) ? json_encode($main['observasi_list']) : '[]' ?>;
var rows_observasi = [];

if (Array.isArray(raw_observasi) && raw_observasi.length > 0) {
  $.each(raw_observasi, function(idx, item) {
    rows_observasi.push([
      '',                             // Index 0: Column 'no' (autonumeric readonly)
      item.tgl || '<?= date("d-m-Y") ?>',
      item.jam || '<?= date("H:i") ?>',
      item.kesadaran || 'Compos Mentis',
      item.gcs || '',
      item.tensi || '',
      item.nadi || '',
      item.suhu || '',
      item.rr || '',
      item.tangan_kanan || '-',
      item.tangan_kiri || '-',
      item.kaki_kanan || '-',
      item.kaki_kiri || '-',
      item.luka || '-',
      item.petugas_nm || '<?= @$main['petugas_nm'] ?>'
    ]);
  });
} else {
  // Baris default awal untuk form baru
  rows_observasi.push([
    '',
    '<?= date("d-m-Y") ?>',
    '<?= date("H:i") ?>',
    'Compos Mentis',
    'E4V5M6',
    '120/80',
    '80',
    '36.5',
    '20',
    '-',
    '-',
    '-',
    '-',
    '-',
    '<?= @$main['petugas_nm'] ?>'
  ]);
}
```

---

## 🛠️ 3. Konfigurasi Inisialisasi `gridTable`

```javascript
tableItemObservasiRestrain = $("#item_observasi_restrain").gridTable({
  focusAfterAdd: 1,
  deleteAction: true,
  deleteBefore: true,
  rows: data,
  deleteOnBefore: function() {
    var row = this.row;
    tableItemObservasiRestrain.deleteRow(row);
  },
  columns: [
    {
      name: "No",
      fieldName: "no",
      type: "readonly",
      width: "35",
      bodyClass: "text-center",
      autoNumeric: true
    },
    {
      name: "Tanggal",
      fieldName: "obs_tgl",
      type: "text",
      width: "110",
      bodyClass: "text-center"
    },
    {
      name: "Kesadaran",
      fieldName: "obs_kesadaran",
      type: "select",
      width: "130",
      bodyClass: "text-left",
      select: {
        remoteType: "static",
        dataStatic: [
          { val: 'Compos Mentis', data: 'Compos Mentis' },
          { val: 'Apatis', data: 'Apatis' },
          { val: 'Delirium', data: 'Delirium' },
          { val: 'Somnolen', data: 'Somnolen' },
          { val: 'Sopor', data: 'Sopor' },
          { val: 'Coma', data: 'Coma' }
        ]
      }
    },
    {
      name: "GCS",
      fieldName: "obs_gcs",
      type: "text",
      width: "70",
      bodyClass: "text-center"
    },
    {
      name: "Tensi",
      fieldName: "obs_tensi",
      type: "text",
      width: "85",
      bodyClass: "text-center"
    },
    {
      name: "Nama Petugas",
      fieldName: "obs_petugas_nm",
      type: "text",
      width: "160",
      bodyClass: "text-left"
    }
  ]
});
```

> [!WARNING]
> Jangan gunakan properti `defaultValue` statis di tingkat konfigurasi `columns: [...]` apabila bidang input dapat diedit secara bebas oleh pengguna. Properti `defaultValue` pada skema kolom dapat mengakibatkan pustaka memutarbalikkan (*reset*) editan pengguna kembali ke nilai bawaan.

---

## ➕ 4. Penambahan Baris Baru (`addRow`) & Auto-Fill Dinamis

Untuk menambahkan baris baru secara otomatis yang terisi (*auto-fill*) dari nilai terkini pada bagian pengkajian (Tab A):

```javascript
function table_item_observasi_restrain_add_row() {
  if (tableItemObservasiRestrain !== null) {
    // 1. Ambil nilai dinamis dari input Tab A (Pengkajian)
    var tgl = $("input[name='tgl_pengkajian']").val() || '<?= date("d-m-Y") ?>';
    
    var now = new Date();
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var jam = hours + ':' + minutes;

    var kesadaran = $("input[name='kesadaran_cd']:checked").val() || 'Compos Mentis';

    var gcs_e = $("input[name='gcs_e']").val() || '';
    var gcs_v = $("input[name='gcs_v']").val() || '';
    var gcs_m = $("input[name='gcs_m']").val() || '';
    var gcs = (gcs_e || gcs_v || gcs_m) ? ('E' + gcs_e + 'V' + gcs_v + 'M' + gcs_m) : 'E4V5M6';

    var tensi = $("input[name='vital_tensi']").val() || '120/80';
    var nadi = $("input[name='vital_nadi']").val() || '80';
    var suhu = $("input[name='vital_suhu']").val() || '36.5';
    var rr = $("input[name='vital_rr']").val() || '20';

    var tangan_kanan = $('#restrain_nonfar_tangan_kanan').is(':checked') ? '+' : '-';
    var tangan_kiri = $('#restrain_nonfar_tangan_kiri').is(':checked') ? '+' : '-';
    var kaki_kanan = $('#restrain_nonfar_kaki_kanan').is(':checked') ? '+' : '-';
    var kaki_kiri = $('#restrain_nonfar_kaki_kiri').is(':checked') ? '+' : '-';

    var petugas = $('#petugas_id option:selected').text() || '<?= @$main["petugas_nm"] ?>';
    if (petugas.indexOf('- Pilih') !== -1 || !petugas.trim()) {
      petugas = '<?= @$main["petugas_nm"] ?>';
    }

    // 2. Tambahkan baris baru ke GridTable
    tableItemObservasiRestrain.addRow();
    var last = tableItemObservasiRestrain.getLastRow();

    // 3. Set nilai sel menggunakan API setValCell / setValCellSelect
    tableItemObservasiRestrain.setValCell('obs_tgl', last, tgl);
    tableItemObservasiRestrain.setValCell('obs_jam', last, jam);
    tableItemObservasiRestrain.setValCellSelect('obs_kesadaran', last, kesadaran);
    tableItemObservasiRestrain.setValCell('obs_gcs', last, gcs);
    tableItemObservasiRestrain.setValCell('obs_tensi', last, tensi);
    tableItemObservasiRestrain.setValCell('obs_nadi', last, nadi);
    tableItemObservasiRestrain.setValCell('obs_suhu', last, suhu);
    tableItemObservasiRestrain.setValCell('obs_rr', last, rr);
    tableItemObservasiRestrain.setValCellSelect('obs_tangan_kanan', last, tangan_kanan);
    tableItemObservasiRestrain.setValCellSelect('obs_tangan_kiri', last, tangan_kiri);
    tableItemObservasiRestrain.setValCellSelect('obs_kaki_kanan', last, kaki_kanan);
    tableItemObservasiRestrain.setValCellSelect('obs_kaki_kiri', last, kaki_kiri);
    tableItemObservasiRestrain.setValCellSelect('obs_luka', last, '-');
    tableItemObservasiRestrain.setValCell('obs_petugas_nm', last, petugas);
  }
}
```

---

## 💾 5. Penanganan Penyimpanan Backend (PHP CodeIgniter)

Pada method simpan di model (`M_pelayanan.php`), data dikirim sebagai array bertingkat (misal: `$d['obs_tgl']`, `$d['obs_jam']`, dll).

> [!CAUTION]
> Kolom penomoran otomatis `no[]` yang dihasilkan oleh `gridTable` akan ter-post sebagai array (`$d['no'] = ['1', '2']`). Wajib dilakukan `unset($d['no'])` dan pembersihan metadata AJAX sebelum menjalankan query database untuk mencegah error Postgres (`Invalid query: INSERT INTO ... VALUES (Array, ...)`).

```php
public function save_pengkajian_observasi_restrain($registrasi_id = null)
{
  $d = _post();

  // 1. Ekstrak array baris GridTable
  $obs_rows = [];
  if (isset($d['obs_tgl']) && is_array($d['obs_tgl'])) {
    for ($i = 0; $i < count($d['obs_tgl']); $i++) {
      $tgl_val = isset($d['obs_tgl'][$i]) ? trim($d['obs_tgl'][$i]) : '';
      $jam_val = isset($d['obs_jam'][$i]) ? trim($d['obs_jam'][$i]) : '';
      if ($tgl_val !== '' || $jam_val !== '') {
        $obs_rows[] = [
          'tgl'          => $tgl_val,
          'jam'          => $jam_val,
          'kesadaran'    => isset($d['obs_kesadaran'][$i]) ? trim($d['obs_kesadaran'][$i]) : '',
          'gcs'          => isset($d['obs_gcs'][$i]) ? trim($d['obs_gcs'][$i]) : '',
          'tensi'        => isset($d['obs_tensi'][$i]) ? trim($d['obs_tensi'][$i]) : '',
          'nadi'         => isset($d['obs_nadi'][$i]) ? trim($d['obs_nadi'][$i]) : '',
          'suhu'         => isset($d['obs_suhu'][$i]) ? trim($d['obs_suhu'][$i]) : '',
          'rr'           => isset($d['obs_rr'][$i]) ? trim($d['obs_rr'][$i]) : '',
          'tangan_kanan' => isset($d['obs_tangan_kanan'][$i]) ? trim($d['obs_tangan_kanan'][$i]) : '',
          'tangan_kiri'  => isset($d['obs_tangan_kiri'][$i]) ? trim($d['obs_tangan_kiri'][$i]) : '',
          'kaki_kanan'   => isset($d['obs_kaki_kanan'][$i]) ? trim($d['obs_kaki_kanan'][$i]) : '',
          'kaki_kiri'    => isset($d['obs_kaki_kiri'][$i]) ? trim($d['obs_kaki_kiri'][$i]) : '',
          'luka'         => isset($d['obs_luka'][$i]) ? trim($d['obs_luka'][$i]) : '',
          'petugas_nm'   => isset($d['obs_petugas_nm'][$i]) ? trim($d['obs_petugas_nm'][$i]) : ''
        ];
      }
    }
  }

  // 2. MANDATORI: Unset seluruh bidang non-kolom & array GridTable
  unset(
    $d['no'], $d['n'], $d['_is_ajax'], $d['_token'],
    $d['obs_tgl'], $d['obs_jam'], $d['obs_kesadaran'], $d['obs_gcs'],
    $d['obs_tensi'], $d['obs_nadi'], $d['obs_suhu'], $d['obs_rr'],
    $d['obs_tangan_kanan'], $d['obs_tangan_kiri'], $d['obs_kaki_kanan'],
    $d['obs_kaki_kiri'], $d['obs_luka'], $d['obs_petugas_nm']
  );

  // 3. Serialize array menjadi JSON string
  $d['observasi_detail'] = json_encode($obs_rows);

  if (empty($d['pengkajianobservasirestrain_id'])) {
    $d['pengkajianobservasirestrain_id'] = DB::get_id('dat_pengkajian_observasi_restrain');
    $res = DB::insert('dat_pengkajian_observasi_restrain', $d);
    DB::update_id('dat_pengkajian_observasi_restrain', $d['pengkajianobservasirestrain_id']);
  } else {
    $res = DB::update('dat_pengkajian_observasi_restrain', $d, ['pengkajianobservasirestrain_id' => $d['pengkajianobservasirestrain_id']]);
  }
}
```

---

## 🖨️ 6. Render Tabel Dinamis pada Cetakan Dompdf

Pada berkas view cetakan PDF (`cetak_...php`):

```php
<?php 
  $obs_list = !empty($main['observasi_detail']) ? json_decode($main['observasi_detail'], true) : [];
?>

<table class="table-data font-size-9" style="width: 100%; border-collapse: collapse; margin-top: 5px;">
  <thead>
    <tr>
      <th style="border: 1px solid #000; width: 3%; text-align: center;">NO</th>
      <th style="border: 1px solid #000; width: 10%; text-align: center;">TANGGAL</th>
      <th style="border: 1px solid #000; width: 6%; text-align: center;">JAM</th>
      <th style="border: 1px solid #000; width: 12%; text-align: center;">KESADARAN</th>
      <th style="border: 1px solid #000; width: 8%; text-align: center;">GCS</th>
      <th style="border: 1px solid #000; width: 8%; text-align: center;">TENSI</th>
      <th style="border: 1px solid #000; width: 6%; text-align: center;">NADI</th>
      <th style="border: 1px solid #000; width: 6%; text-align: center;">SUHU</th>
      <th style="border: 1px solid #000; width: 6%; text-align: center;">RR</th>
      <th style="border: 1px solid #000; width: 15%; text-align: center;">PETUGAS</th>
    </tr>
  </thead>
  <tbody>
    <?php if (!empty($obs_list)) : ?>
      <?php foreach ($obs_list as $no => $r) : ?>
        <tr>
          <td style="border: 1px solid #000; text-align: center;"><?= $no + 1 ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['tgl'] ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['jam'] ?></td>
          <td style="border: 1px solid #000; text-align: left; padding-left: 3px;"><?= @$r['kesadaran'] ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['gcs'] ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['tensi'] ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['nadi'] ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['suhu'] ?></td>
          <td style="border: 1px solid #000; text-align: center;"><?= @$r['rr'] ?></td>
          <td style="border: 1px solid #000; text-align: left; padding-left: 3px;"><?= @$r['petugas_nm'] ?></td>
        </tr>
      <?php endforeach; ?>
    <?php else : ?>
      <tr>
        <td colspan="10" style="border: 1px solid #000; text-align: center;">- Belum ada data observasi -</td>
      </tr>
    <?php endif; ?>
  </tbody>
</table>
```
