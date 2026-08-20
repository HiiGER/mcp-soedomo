# Kaidah & Standar Pembuatan List Cetak & PDF SIMRS RSUD Soedomo

Dokumen ini menjelaskan standar arsitektur pencetakan dokumen medis, pratinjau (*preview*) PDF berbasis modal, Tanda Tangan Elektronik (TTE), dan pembuatan template cetak PDF di SIMRS RSUD Soedomo.

> [!CAUTION]
> **STANDAR TUNGGAL BENCHMARK LEMBAR CETAK (TRACKED BASE CODE)**:
> Seluruh pembuatan cetakan PDF ERM **WAJIB KONSISTEN 100%** mengacu pada berkas referensi resmi terkomit di repositori:
> - `cetak_informed_consent_tonsilektomy.php` & `cetak_informed_consent_mow.php`
> 
> **ATURAN SUCI KOP SURAT 3-KOLOM (MURNI & SIMETRIS)**:
> 1. Kop Surat 3-Kolom Official (Logo RS + Identitas, Box Pasien, Box Registrasi) **TIDAK BOLEH DICAMPUR ATAU DIBERI KOMPONEN LAIN** (seperti Form Kode kustom di dalam box, digit box, dll.). Kop Surat harus murni dan bersih!
> 2. **KONSISTENSI SIMETRIS HEIGHT BOX PROFIL & METADATA (FIXED HEIGHT 105px)**:
>    Box Profil Pasien (Kolom 2) dan Box Metadata Registrasi (Kolom 3) **WAJIB SAMA TINGGI & SIMETRIS 100%**.
>    Gunakan `height: 105px;` pada kedua elemen `<div>` pembungkus box agar garis border bawah kedua box sejajar horizontal sempurna:
>    ```html
>    <div style="border: 1px solid #000; padding: 4px; height: 105px;">
>    ```
> 3. **Kolom 1 (`36%` width)**: Logo Base64 RSUD Soedomo via `$identitas['lap_logo']` + Identitas Resmi RS.
> 4. **Kolom 2 (`32%` width)**: Box Profil Pasien (`border: 1px solid #000; padding: 4px; height: 105px;`) berisi Nama, Jenis Kelamin, Tgl Lahir, Umur, Alamat.
> 5. **Kolom 3 (`32%` width)**: Box Metadata Registrasi (`border: 1px solid #000; padding: 4px; height: 105px;`) HANYA berisi 6 field standar:
>    - `No Registrasi`
>    - `No RM`
>    - `Ruangan`
>    - `Kelas`
>    - `Tgl. MRS`
>    - `Tgl. KRS`
> 6. Judul Dokumen (`.header-title`) ditempatkan langsung di bawah Kop Surat 3-Kolom.
> 7. Metadata atau digit box khusus formulir (seperti Bulan/Tahun, Kode RS, No Urut Kematian) diletakkan di bawah Judul Dokumen sebagai bagian dari konten body, bukan di dalam Kop Surat.
> 8. Seluruh isi dokumen per halaman WAJIB dibungkus `<div class="page-wrapper">` dengan border hitam solid `1.5px solid #000`.
> 9. Menggunakan font `DejaVu Sans` untuk simbol centang `&#9745;` (tercentang) dan `&#9744;` (kosong).

---

## 1. Source Code Template Kop Surat 3-Kolom Official Murni & Simetris (Fixed Height 105px)

```html
<!-- Kop Surat Standard SIMRS RSUD Soedomo (3 Kolom Official Murni & Simetris) -->
<table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
  <tr>
    <!-- Kolom 1: Logo & Identitas RSUD Soedomo -->
    <td width="36%" class="text-center" style="vertical-align: top; padding-right: 4px;">
      <img src="<?= 'data:image/png;base64,' . base64_encode(file_get_contents(@$identitas['lap_logo'])) ?>" height="45px" style="margin-bottom: 2px;"><br>
      <span style="font-size: 7.5px; font-weight: bold; display: block; line-height: 1.1;"><?= strtoupper(@$identitas['lap_title_1'] ? $identitas['lap_title_1'] : 'PEMERINTAH KABUPATEN ' . @$identitas['lap_ttd_daerah']) ?></span>
      <?php if (!empty($identitas['lap_title_2'])) : ?>
        <span style="font-size: 7px; font-weight: bold; display: block; line-height: 1.1;"><?= strtoupper(@$identitas['lap_title_2']) ?></span>
      <?php endif; ?>
      <span style="font-size: 11px; font-weight: bold; display: block; line-height: 1.2;"><?= strtoupper(@$identitas['rumahsakit_nm'] ? $identitas['rumahsakit_nm'] : @$identitas['nama_instansi']) ?></span>
      <span style="font-size: 7px; display: block; line-height: 1.1;"><?= @$identitas['lap_alamat'] ?><?= @$identitas['lap_telp_no'] ? ', Telp./Fax ' . @$identitas['lap_telp_no'] : '' ?></span>
      <span style="font-size: 7px; display: block; line-height: 1.1;">Email : <?= @$identitas['lap_email'] ? $identitas['lap_email'] : @$identitas['email'] ?></span>
      <span style="font-size: 7.5px; font-weight: bold; display: block; line-height: 1.1;"><?= strtoupper(@$identitas['lap_ttd_daerah']) ?></span>
    </td>

    <!-- Kolom 2: Box Profil Pasien (Fixed Height 105px Simetris) -->
    <td width="32%" style="vertical-align: top; padding-right: 4px;">
      <div style="border: 1px solid #000; padding: 4px; height: 105px;">
        <table style="width: 100%; font-size: 8.5px; border-collapse: collapse; line-height: 1.25;">
          <tr>
            <td width="36%" style="vertical-align: top;"><strong>Nama</strong></td>
            <td width="5%" style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><strong><?= strtoupper(@$pasien['pasien_nm'] ? $pasien['pasien_nm'] : @$pelayanan['pasien_nm']) ?></strong></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Jenis Kelamin</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= strtoupper(@$pasien['jenis_kelamin'] ? $pasien['jenis_kelamin'] : (@$pasien['sex_id'] == '01' ? 'LAKI-LAKI' : 'PEREMPUAN')) ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Tgl Lahir</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= to_date(@$pasien['tgl_lahir'] ? @$pasien['tgl_lahir'] : @$pasien['lahir_tgl']) ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Umur</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= (isset($pelayanan['umur_thn']) || isset($pelayanan['umur_bln']) || isset($pelayanan['umur_hari'])) ? @$pelayanan['umur_thn'] . 'thn ' . @$pelayanan['umur_bln'] . 'bln ' . @$pelayanan['umur_hari'] . 'hr' : @$pasien['umur'] ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Alamat</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;">
              <?php
                $rt_val = !empty($pasien['alamat_rt']) ? $pasien['alamat_rt'] : @$pelayanan['alamat_rt'];
                $rw_val = !empty($pasien['alamat_rw']) ? $pasien['alamat_rw'] : @$pelayanan['alamat_rw'];
                $kel_val = !empty($pasien['alamat_kelurahan_nm']) ? $pasien['alamat_kelurahan_nm'] : @$pelayanan['alamat_kelurahan_nm'];
                $kec_val = !empty($pasien['alamat_kecamatan_nm']) ? $pasien['alamat_kecamatan_nm'] : @$pelayanan['alamat_kecamatan_nm'];
                $kota_val = !empty($pasien['alamat_kota_nm']) ? $pasien['alamat_kota_nm'] : @$pelayanan['alamat_kota_nm'];
                $prov_val = !empty($pasien['alamat_provinsi_nm']) ? $pasien['alamat_provinsi_nm'] : @$pelayanan['alamat_provinsi_nm'];

                $arr_alamat = [];
                if ($rt_val !== null || $rw_val !== null) $arr_alamat[] = 'RT ' . $rt_val . ' / RW ' . $rw_val;
                if (!empty($kel_val)) $arr_alamat[] = $kel_val;
                if (!empty($kec_val)) $arr_alamat[] = $kec_val;
                if (!empty($kota_val)) $arr_alamat[] = $kota_val;
                if (!empty($prov_val)) $arr_alamat[] = $prov_val;

                $alamat_out = implode(', ', $arr_alamat);
                echo !empty($alamat_out) ? strtoupper($alamat_out) : strtoupper(@$pasien['alamat_lengkap'] ? $pasien['alamat_lengkap'] : @$pasien['alamat']);
              ?>
            </td>
          </tr>
        </table>
      </div>
    </td>

    <!-- Kolom 3: Box Metadata Registrasi (Fixed Height 105px Simetris) -->
    <td width="32%" style="vertical-align: top;">
      <div style="border: 1px solid #000; padding: 4px; height: 105px;">
        <table style="width: 100%; font-size: 8.5px; border-collapse: collapse; line-height: 1.25;">
          <tr>
            <td width="42%" style="vertical-align: top;"><strong>No Registrasi</strong></td>
            <td width="5%" style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= @$pelayanan['registrasi_id'] ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>No RM</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><strong><?= @$pelayanan['rm_no'] ?></strong></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Ruangan</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= @$pelayanan['lokasi_nm'] ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Kelas</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= @$pelayanan['kelas_layanan_nm'] ? @$pelayanan['kelas_layanan_nm'] : (@$pelayanan['kelas_nm'] ? @$pelayanan['kelas_nm'] : '-') ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Tgl. MRS</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= to_date(@$pelayanan['registrasi_tgl'], '', 'full_date') ?></td>
          </tr>
          <tr>
            <td style="vertical-align: top;"><strong>Tgl. KRS</strong></td>
            <td style="vertical-align: top;">:</td>
            <td style="vertical-align: top;"><?= @$pelayanan['dilayani_selesai_tgl'] ? to_date(@$pelayanan['dilayani_selesai_tgl'], '', 'full_date') : '-' ?></td>
          </tr>
        </table>
      </div>
    </td>
  </tr>
</table>
```

---

## 2. Template Code Full View Cetak ERM (`cetak_..._php`)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FORMULIR ERM CETAK - SIMRS RSUD SOEDOMO</title>
  <style>
    @page { margin: 10px 15px 10px 15px; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; color: #000; line-height: 1.2; }
    .page-wrapper { border: 1.5px solid #000; padding: 6px; position: relative; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    .table-bordered th, .table-bordered td { border: 1px solid #000; padding: 3px 4px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .fw-bold { font-weight: bold; }
    .header-title { font-size: 12px; font-weight: bold; text-align: center; margin-top: 4px; margin-bottom: 6px; text-decoration: underline; }
    .check-mark { font-family: DejaVu Sans, sans-serif; font-weight: bold; }
  </style>
</head>
<body>

  <div class="page-wrapper">
    
    <!-- Kop Surat Standard SIMRS RSUD Soedomo (3 Kolom Official Murni & Simetris) -->
    <!-- (Gunakan Source Code Template Kop Surat di atas) -->

    <div class="header-title">JUDUL DOKUMEN CETAK ERM</div>
    <?php if (!empty($berkas_no)) : ?>
      <p style="text-align: center; margin: 0; padding: 0;"><strong>(<?= $berkas_no ?>)</strong></p>
    <?php endif; ?>

    <!-- KONTEN SUBSTANTIF DOKUMEN... -->

    <!-- Tanda Tangan & Verifikasi PPA & Non-Pegawai -->
    <?php
      if (!function_exists('format_ttd_src')) {
        function format_ttd_src($val) {
          if (empty($val)) return '';
          if (strpos($val, 'data:image') === 0) return $val;
          if (file_exists($val)) return 'data:image/png;base64,' . base64_encode(file_get_contents($val));
          if (strlen($val) > 50) {
            return (strpos($val, 'base64,') !== false) ? $val : 'data:image/png;base64,' . $val;
          }
          return '';
        }
      }
      $penerima_ttd_src = format_ttd_src(@$main['pihak_menerima_ttd']);
      $dokter_ttd_src   = format_ttd_src(@$main['dokter_ttd']);
    ?>
    <table style="margin-top: 15px; width: 100%;">
      <tr>
        <td width="50%" class="text-center" style="vertical-align: top;">
          Pihak yang Menerima<br>
          <div style="margin: 3px 0; min-height: 65px;">
            <?php if (!empty($penerima_ttd_src)): ?>
              <img src="<?= $penerima_ttd_src ?>" height="65px" />
            <?php else: ?>
              <br><br><br><br>
            <?php endif; ?>
          </div>
          ( <u><?= @$main['pihak_menerima_nm'] ? @$main['pihak_menerima_nm'] : '...........................................' ?></u> )<br>
          <small style="font-size: 8px;">Tanda Tangan dan Nama Terang</small>
        </td>
        <td width="50%" class="text-center" style="vertical-align: top;">
          Trenggalek, <?= to_date(@$main['dokter_tgl_jam'], '', 'date') ?> Jam : <?= to_date(@$main['dokter_tgl_jam'], '', 'time') ?><br>
          Dokter DPJP<br>
          <div style="margin: 3px 0; min-height: 65px;">
            <?php if (@$bsre == 1 || @$bsre == true): ?>
              <img height="65px" src="data:image/png;base64,<?= generate_qr_code_base64(@$main['dokter_nm'] . ', DOKTER DPJP ,' . @$main['dokter_tgl_jam']); ?>" />
            <?php elseif (!empty($dokter_ttd_src)): ?>
              <img src="<?= $dokter_ttd_src ?>" height="65px" />
            <?php else: ?>
              <br><br><br><br>
            <?php endif; ?>
          </div>
          ( <u><?= @$main['dokter_nm'] ? @$main['dokter_nm'] : '...........................................' ?></u> )<br>
          <small style="font-size: 8px;">Tanda Tangan dan Nama Terang</small>
        </td>
      </tr>
    </table>

  </div>

</body>
</html>
```

---

## 3. Standardisasi Mutlak Nomor Berkas RM (`berkas_no`) pada Lembar Cetak PDF & Controller

> [!IMPORTANT]
> **ATURAN PASTI & WAJIB DITURUTI DI SELURUH MODUL ERM**:
> Nomor Berkas Rekam Medis (seperti `RM 13.8.1`, `RM 13.9`, `RM 7.16`) **HARUS 100% DINAMIS** dan **DILARANG DI-HARDCODE** secara statis pada view template cetak (`cetak_...php`).

### 3.1. Penarikan `berkas_no` di Level Controller (3-Tier Fallback Rule)
Setiap method pencetakan di Controller (`cetak_[feature]` dan `cetak_[feature]_all`) WAJIB menerapkan alur penarikan 3-Tier Fallback berikut:
```php
$berkas_no = !empty($berkas_no) ? $berkas_no : _get('berkas_no');
if (empty($berkas_no)) {
  $get_erm = DB::raw('row_array', "SELECT berkas_no FROM mst_erekam_medis WHERE function_controller LIKE '%list_[feature]_modal%' AND deleted_st = 0 AND active_st = 1 LIMIT 1");
  $berkas_no = !empty($get_erm['berkas_no']) ? $get_erm['berkas_no'] : '[DEFAULT_RM_KODE]';
}
$data['berkas_no'] = rawurldecode(@$berkas_no);
```

### 3.2. Formatting `berkas_no` di View Template Cetak PDF (`cetak_...php`)
Penulisan Judul & Nomor Berkas pada lembar cetak PDF WAJIB seragam menggunakan salah satu dari 2 standar resmi berikut:

**Pola A (Judul Terpisah + Sub-Paragraf Nomor Berkas)**:
```html
<div class="header-title">[NAMA FORMULIR KAPITAL]</div>
<p style="text-align: center; margin: 0 0 4px 0; padding: 0; font-size: 9.5px;">
  <strong>(<?= !empty($berkas_no) ? $berkas_no : '[DEFAULT_RM_KODE]' ?>)</strong>
</p>
```

**Pola B (Judul + Inline Span Nomor Berkas)**:
```html
<div class="header-title">
  [NAMA FORMULIR KAPITAL] 
  <span class="header-number"> (<?= !empty($berkas_no) ? $berkas_no : '[DEFAULT_RM_KODE]' ?>)</span>
</div>
```

> [!CAUTION]
> DILARANG MENULISKAN string RM statis (seperti `(RM 13.8.1)`) tanpa ekspresi PHP `<?= !empty($berkas_no) ? $berkas_no : ... ?>`!

