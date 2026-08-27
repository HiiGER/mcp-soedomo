# Kaidah & Standar Pembuatan List Cetak & PDF SIMRS RSUD Soedomo

Dokumen ini menjelaskan standar arsitektur pencetakan dokumen medis, pratinjau (*preview*) PDF berbasis modal, Tanda Tangan Elektronik (TTE) Pegawai via QR Code `generate_ttd()`, dan pembuatan template cetak PDF di SIMRS RSUD Soedomo.

> [!CAUTION]
> **STANDAR TUNGGAL BENCHMARK LEMBAR CETAK (TRACKED BASE CODE)**:
> Seluruh pembuatan cetakan PDF ERM **WAJIB KONSISTEN 100%** mengacu pada berkas referensi resmi terkomit di repositori:
> - `cetak_informed_consent_tonsilektomy.php` & `cetak_permintaan_pelayanan_kerohanian.php`
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

## 2. ATURAN WAJIB TANDA TANGAN PEGAWAI (DOKTER / PERAWAT / PPA) MENGGUNAKAN QR CODE BARCODE (`generate_ttd`)

> [!IMPORTANT]
> **ATURAN PROSEDURAL WAJIB TTE PEGAWAI SIMRS**:
> Seluruh Tanda Tangan Pegawai (Dokter DPJP, Dokter Pemeriksa, Perawat, Bidan, Terapis, Nutrisionis, PPA) pada lembar cetak PDF **DIWAJIBKAN 100% MENGGUNAKAN QR CODE / BARCODE TTE** yang dihasilkan oleh fungsi helper `generate_ttd()` dari `application/helpers/itm_helper.php`.
> **DILARANG MENGGUNAKAN GAMBAR GO RESAN MANUSIA ATAU DUMMY SPASI UNTUK PEGAWAI**.

### 2.1. Sintaks Prosedural di Level Controller (`Pelayanan.php` / Module Controller)

Pada method controller cetak (misal `cetak_[feature]`), WAJIB melakukan pemanggilan helper `generate_ttd()` sebelum memuat view HTML:

```php
public function cetak_[feature]($pelayanan_id = null, $id = null, $berkas_no = null)
{
  ...
  $data['main'] = $this->m_pelayanan->get_[feature]($id);

  // 1. Identifikasi ID Pegawai (Dokter / Perawat / PPA)
  $pegawai_id = !empty($data['main']['perawat_id']) ? $data['main']['perawat_id'] : (!empty($data['main']['dokter_id']) ? $data['main']['dokter_id'] : _ses_get('pegawai_id'));
  
  // 2. Tentukan Nama Dokumen Resmi (String Kapital)
  $dokumen_nm = '[NAMA FORMULIR KAPITAL]'; // Contoh: 'PERMINTAAN PELAYANAN KEROHANIAN'
  
  // 3. Format Tanggal & Jam TTD (WIB Standard)
  $tgl_ttd = !empty($data['main']['tgl_ttd']) ? $data['main']['tgl_ttd'] . ' ' . (!empty($data['main']['jam_ttd']) ? $data['main']['jam_ttd'] : '00:00') : date('Y-m-d H:i:s');

  // 4. Generate QR Code Barcode TTE via generate_ttd() helper
  if (!empty($pegawai_id)) {
    $data['pegawai_ttd_qr'] = generate_ttd($pelayanan_id, $pegawai_id, $dokumen_nm, $tgl_ttd, '60px');
  } else {
    $data['pegawai_ttd_qr'] = '';
  }

  $html = $this->load->view($this->template . 'cetak/cetak_[feature]', $data, true);
  $this->load->library('PdfDom');
  $this->pdfdom->generate($html, $file_pdf, $paper, $orientation);
}
```

---

### 2.2. Sintaks Prosedural di Level View Template Cetak PDF (`cetak_...php`)

Pada lembar cetak PDF, blok TTD Pegawai (Dokter/Perawat/PPA) dan Pasien/Keluarga (Non-Pegawai) WAJIB disusun **side-by-side** dengan **height container simetris `65px`** agar sejajar presisi:

```html
<!-- TANDA TANGAN SIDE-BY-SIDE (Sejajar Presisi & Simetris) -->
<table style="width: 100%; text-align: center; margin-top: 10px;">
  <tr>
    <!-- Kolom 1: Pegawai (Dokter / Perawat / PPA) -->
    <td width="50%" style="vertical-align: top;">
      <div>Perawat / Dokter DPJP</div>
      <div style="height: 65px; margin-top: 4px; margin-bottom: 4px;">
        <?php if (!empty($pegawai_ttd_qr)) : ?>
          <?= $pegawai_ttd_qr ?>
        <?php elseif (!empty($pegawai_ttd_src)) : ?>
          <img src="<?= $pegawai_ttd_src ?>" height="55px">
        <?php endif; ?>
      </div>
      ( <u><?= @$main['perawat_nm_db'] ? $main['perawat_nm_db'] : (@$main['perawat_nm'] ? $main['perawat_nm'] : '...........................................') ?></u> )<br>
      <span style="font-size: 8.5px;">Tanda Tangan & Nama Terang</span>
    </td>

    <!-- Kolom 2: Pasien / Keluarga / Penanggung Jawab (Non-Pegawai) -->
    <td width="50%" style="vertical-align: top;">
      <div>Pasien / Keluarga</div>
      <div style="height: 65px; margin-top: 4px; margin-bottom: 4px;">
        <?php if (!empty($pasien_ttd_src)) : ?>
          <img src="<?= $pasien_ttd_src ?>" height="55px">
        <?php endif; ?>
      </div>
      ( <u><?= @$main['pasien_keluarga_nm'] ? $main['pasien_keluarga_nm'] : (@$main['pemohon_nama'] ? $main['pemohon_nama'] : '...........................................') ?></u> )<br>
      <span style="font-size: 8.5px;">Tanda Tangan & Nama Terang</span>
    </td>
  </tr>
</table>
```

> [!CAUTION]
> **ATURAN KESEJAJARAN (ALIGNMENT) BARIS TTD**:
> DILARANG menggunakan tag `<br><br><br>` acak pada salah satu kolom. Gunakan `<div>` dengan `height: 65px; margin-top: 4px; margin-bottom: 4px;` pada kedua kolom agar garis nama terang `( <u>Nama</u> )` 100% sejajar horizontal.

---

## 3. Standardisasi Mutlak Nomor Berkas RM (`berkas_no`) pada Lembar Cetak PDF & Controller

> [!IMPORTANT]
> **ATURAN PASTI & WAJIB DITURUTI DI SELURUH MODUL ERM**:
> Nomor Berkas Rekam Medis (seperti `RM 13.8.1`, `RM 13.9`, `RM 7.12`, `RM 7.16`) **HARUS 100% DINAMIS** dan **DILARANG DI-HARDCODE** secara statis pada view template cetak (`cetak_...php`).

### 3.1. Penarikan `berkas_no` di Level Controller (3-Tier Fallback Rule)
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
