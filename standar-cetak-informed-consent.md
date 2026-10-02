# STANDAR LEMBAR CETAK INFORMED CONSENT (PERSETUJUAN / PENOLAKAN TINDAKAN KEDOKTERAN)

> **Dokumen Standar SIMRS RSUD Dr. Soedomo Trenggalek**  
> **Benchmark Acuan Baku**: [`cetak_informed_consent_hdawal.php`](file:///home/geri/ITM/SOEDOMO/simrs/application/modules/pelayanan/views/pelayanan/cetak/cetak_informed_consent_hdawal.php)  
> **Kategori**: Lembar Cetak PDF E-Rekam Medis (ERM)  
> **Library Renderer**: Dompdf (`$this->load->library('PdfDom')`)  
> **Ukuran Kertas**: F4 Portrait (`array(0, 0, 8.46 * 72, 12.99 * 72)`) atau standard A4 (`'A4'`, `'portrait'`)

---

## 1. ATURAN BAKU STRUKTUR & TATA LETAK

Setiap lembar cetak formulir **Informed Consent** (Persetujuan / Penolakan Tindakan Kedokteran) di lingkungan SIMRS RSUD Dr. Soedomo wajib mengikuti arsitektur baku berikut:

```
+-----------------------------------------------------------------------------------+
| 1. KOP SURAT 3-KOLOM RESMI (Height: 105px Simetris)                               |
|    - Kolom 1 (36%): Logo RSUD & Identitas Lengkap Pemkab & RS                     |
|    - Kolom 2 (32%): Box Profil Pasien (Nama, JK, Tgl Lahir, Umur, Alamat)         |
|    - Kolom 3 (32%): Box Metadata Registrasi (No Reg, No RM, Ruangan, Kelas, Tgl)  |
+-----------------------------------------------------------------------------------+
| 2. JUDUL DOKUMEN FORMULIR (TANPA NOMOR BERKAS / RM)                               |
|    FORMULIR INFORMED CONSENT                                                      |
|    (PERSETUJUAN / PENOLAKAN TINDAKAN KEDOKTERAN [NAMA TINDAKAN])                  |
+-----------------------------------------------------------------------------------+
| 3. TABEL PEMBERIAN INFORMASI                                                      |
|    - Dokter Pelaksana Tindakan, Pemberi Informasi, Penerima Informasi              |
|    - Header: NO (4%) | JENIS INFORMASI (24%) | ISI FORMULIR (64%) | TANDA (8%)     |
|    - Item Checklist: Icon cb-check.png / cb-none.png + Teks Tebal (<strong>)      |
|    - Kolom Tanda: Icon cb-check.png (13px) jika terverifikasi                      |
+-----------------------------------------------------------------------------------+
| 4. PERNYATAAN DOKTER & TTD BARCODE QR CODE PPA                                    |
|    - TTD Dokter Pelaksana WAJIB Barcode QR Code TTE via generate_ttd() (48px)     |
+-----------------------------------------------------------------------------------+
| 5. PERNYATAAN PASIEN / WALI & TTD PASIEN                                          |
|    - TTD Pasien / Wali (Non-Pegawai) via helper format_ttd_...() (Base64 & File)  |
+-----------------------------------------------------------------------------------+
| 6. BLOK PERSETUJUAN / PENOLAKAN TINDAKAN KEDOKTERAN                               |
|    - Data Yang Menyatakan (Nama, TTL/Umur, Alamat)                                |
|    - Data Pasien yang Diberi Tindakan (Nama, TTL/Umur, Alamat)                    |
|    - Teks Pernyataan Hukum & Kesadaran Medis                                      |
+-----------------------------------------------------------------------------------+
| 7. TANDA TANGAN AKHIR 3 KOLOM SEJAJAR (HEIGHT: 50px SIMETRIS)                     |
|    - Kolom 1 (33.3%): Yang Menyatakan (Pasien / Wali)                             |
|    - Kolom 2 (33.3%): Saksi I (Keluarga / Pihak Pasien / RS)                      |
|    - Kolom 3 (33.3%): Saksi II (Keluarga / Saksi RS)                              |
+-----------------------------------------------------------------------------------+
```

---

## 2. SPESIFIKASI DETAIL ATURAN LEMBAR CETAK

### 2.1. Tanpa Nomor Berkas (No RM Berkas Dihapus)
- Judul formulir **DILARANG** mencantumkan nomor berkas (seperti `RM 8.6`, `RM 11.2`, dsb).
- Tag `<title>` HTML disetel bersih: `<title>INFORMED CONSENT [NAMA TINDAKAN]</title>`.
- Judul heading di body:
  ```html
  <div class="header-title">
    FORMULIR INFORMED CONSENT<br>
    (PERSETUJUAN / PENOLAKAN TINDAKAN KEDOKTERAN [NAMA TINDAKAN KAPITAL])
  </div>
  ```

### 2.2. Mandatori Barcode / QR Code TTE untuk Dokter / Perawat (PPA)
- Seluruh tanda tangan pegawai (Dokter Pelaksana Tindakan, Dokter DPJP, Perawat) **WAJIB 100% MENGGUNAKAN QR CODE TTE** yang dihasilkan dari helper `generate_ttd()`.
- **Dilarang** menampilkan goresan tanda tangan biasa atau spasi kosong untuk pegawai rumah sakit.
- Pada Controller:
  ```php
  // Barcode QR Code TTE Dokter Pelaksana / PPA via generate_ttd()
  $dokter_id = !empty($data['main']['dokter_pelaksana_tindakan_id']) 
    ? $data['main']['dokter_pelaksana_tindakan_id'] 
    : (!empty($data['main']['dokter_id']) ? $data['main']['dokter_id'] : (!empty($data['main']['pemberi_informasi_id']) ? $data['main']['pemberi_informasi_id'] : _ses_get('pegawai_id')));
  $dokumen_nm = 'INFORMED CONSENT [NAMA TINDAKAN]';
  $tgl_ttd = !empty($data['main']['[field_tgl]']) ? $data['main']['[field_tgl]'] : date('Y-m-d H:i:s');

  if (!empty($dokter_id) && function_exists('generate_ttd')) {
    $data['dokter_ttd_qr'] = generate_ttd($pelayanan_id, $dokter_id, $dokumen_nm, $tgl_ttd, '48px');
  } else {
    $data['dokter_ttd_qr'] = '';
  }
  ```
- Pada View:
  ```html
  <div style="height: 50px; margin: 2px 0;">
    <?php if (!empty($dokter_ttd_qr)) : ?>
      <?= $dokter_ttd_qr ?>
    <?php elseif (!empty($ttd_dokter)) : ?>
      <img height="45px" src="<?= $ttd_dokter ?>">
    <?php endif; ?>
  </div>
  ```

### 2.3. Helper TTD Pasien / Non-Pegawai Bebas Bug (Development & Production Safe)
- Menghindari bug `image not found or type unknown` di Dompdf akibat pemanggilan `file_get_contents()` pada raw base64 atau pemanggilan `base_url()` remote HTTP.
- Menggunakan helper `format_ttd_...()` di bagian paling atas berkas view:
  ```php
  if (!function_exists('format_ttd_[feature]')) {
    function format_ttd_[feature]($val, $folder = 'assets/ttd/ic_[folder]/')
    {
      if (empty($val)) return '';
      $val = trim($val);
      if (strpos($val, 'data:image') === 0) return $val;
      if (file_exists($val)) return 'data:image/png;base64,' . base64_encode(file_get_contents($val));
      if (defined('FCPATH') && file_exists(FCPATH . $folder . $val)) return 'data:image/png;base64,' . base64_encode(file_get_contents(FCPATH . $folder . $val));
      if (defined('FCPATH') && file_exists(FCPATH . $val)) return 'data:image/png;base64,' . base64_encode(file_get_contents(FCPATH . $val));
      if (defined('FCPATH') && file_exists(FCPATH . 'assets/ttd/' . $val)) return 'data:image/png;base64,' . base64_encode(file_get_contents(FCPATH . 'assets/ttd/' . $val));
      if (strlen($val) > 100) {
        return (strpos($val, 'base64,') !== false) ? $val : 'data:image/png;base64,' . $val;
      }
      return '';
    }
  }
  ```

### 2.4. Standar Checkbox & Checklist (Jelas, Tebal, dan Tajam)
- Simbol Unicode font DejaVu Sans (`&#9745;`) seringkali terlalu kecil/buram pada hasil cetak printer fisik.
- Diganti dengan embedding base64 dari icon resmi SIMRS: `cb-check.png` & `cb-none.png`:
  ```php
  $img_cb_check = '';
  $img_cb_none = '';
  if (defined('FCPATH') && file_exists(FCPATH . 'assets/images/cb-check.png')) {
    $img_cb_check = 'data:image/png;base64,' . base64_encode(file_get_contents(FCPATH . 'assets/images/cb-check.png'));
  } elseif (file_exists('./assets/images/cb-check.png')) {
    $img_cb_check = 'data:image/png;base64,' . base64_encode(file_get_contents('./assets/images/cb-check.png'));
  }

  if (defined('FCPATH') && file_exists(FCPATH . 'assets/images/cb-none.png')) {
    $img_cb_none = 'data:image/png;base64,' . base64_encode(file_get_contents(FCPATH . 'assets/images/cb-none.png'));
  } elseif (file_exists('./assets/images/cb-none.png')) {
    $img_cb_none = 'data:image/png;base64,' . base64_encode(file_get_contents('./assets/images/cb-none.png'));
  }
  ```
- Ukuran render:
  - Pilihan dalam baris: `width="11px" height="11px" style="vertical-align: middle; margin-right: 2px;"`
  - Teks item yang tercentang diberi penekanan: `<strong>...</strong>`
  - Kolom **TANDA**: `width="13px" height="13px" style="vertical-align: middle;"`

---

## 3. CHECKLIST PROGRESS REFACTORING INFORMED CONSENT (TOTAL 98 ITEM)

Pelaksanaan standarisasi lembar cetak Informed Consent dibagi menjadi **10 Batch eksekusi** (setiap run memproses 10 dokumen secara konsisten, teliti, dan terverifikasi).

### 📋 Batch 1 (Item 1 - 10) - *SELESAI (10/10)*
- [x] `001.001` | **IC TIVA** (`list_informed_consent_tiva_modal`)
- [x] `001.002` | **IC LMA** (`list_informed_consent_lma_modal`)
- [x] `001.003` | **IC GETA** (`list_informed_consent_anastesi_geta_modal`)
- [x] `001.004` | **IC SPINAL** (`list_informed_consent_anestesi_spinal_modal`)
- [x] `001.005` | **IC EPIDURAL** (`list_informed_consent_epidural_modal`)
- [x] `002.001` | **IC PASANG CVC** (`list_informed_consent_pasangcvc_modal`)
- [x] `002.003` | **INFORMASI PERKEMBANGAN PASIEN** (`list_informed_consent_perkembanganpasien_modal`)
- [x] `002.004` | **IC PASANG CDL** (`list_informed_consent_pasangcdl_modal`)
- [x] `002.005` | **IC INTUBASI DAN VENTILATOR** (`list_informed_consent_intubasiventilator_modal`)
- [x] `002.006` | **IC DEFIBRILASI** (`list_informed_consent_defibrilasi_modal`)

### 📋 Batch 2 (Item 11 - 20) - *SELESAI (10/10)*
- [x] `004.001` | **PERSETUJUAN TINDAKAN HD LANJUTAN** (`list_persetujuan_tindakan_hemodialisa_modal`)
- [x] `004.002` | **IC HEMODIALISA AWAL** (`list_informed_consent_hdawal_modal`) *(Benchmark Acuan Baku Selesai)*
- [x] `005.001` | **IC TRANFUSI DARAH** (`list_informed_consent_transfusi_darah_modal`)
- [x] `006.003` | **IC IMUNISASI HEPATITIS** (`list_informed_consent_imunisasi_hepatitis_modal`)
- [x] `006.004` | **IC IMUNISASI POLIO** (`list_informed_consent_imunisasi_polio_modal`)
- [x] `007.001` | **IC PERSALINAN VACUM** (`list_informed_consent_persalinanvacum_modal`)
- [x] `007.002` | **IC EKSPORASI KET** (`list_informed_consent_eksporasiket_modal`)
- [x] `007.004` | **IC HISTEREKTOMI** (`list_informed_consent_histerektomi_modal`)
- [x] `007.005` | **IC DILATASI DAN KURETASE** (`list_informed_consent_dilatasi_modal`)
- [x] `007.006` | **IC PERAWATAN KONSERVATIF** (`list_informed_consent_konservatif_modal`)

### 📋 Batch 3 (Item 21 - 30) - *SELESAI (10/10)*
- [x] `007.007` | **IC MANUAL PLASENTA** (`list_informed_consent_manualplasenta_modal`)
- [x] `007.008` | **IC INDUKSI PERSALINAN** (`list_informed_consent_induksipersalinan_modal`)
- [x] `007.009` | **IC TUBEKTOMI DEXTRA ET SINISTRA** (`list_informed_consent_tubektomi_modal`)
- [x] `007.010` | **IC PEMASANGAN KB IMPLANT** (`list_informed_consent_kbimplant_modal`)
- [x] `007.012` | **IC SC** (`list_informed_consent_sectio_caesaria_modal`)
- [x] `007.014` | **IC MOW** (`list_informed_consent_mow_modal`)
- [x] `007.021` | **IC PEMASANGAN IUD** (`list_informed_consent_pemasangan_iud_modal`)
- [x] `007.023` | **IC TOTAL VAGINAL HISTEREKTOMY (TVH)** (`list_informed_consent_tvh_modal`)
- [x] `007.024` | **IC TOTAL ABDOMINAL HISTEREKTOMY (TAH)** (`list_informed_consent_tah_modal`)
- [x] `007.025` | **IC ATONIA UTERI** (`list_informed_consent_atoniauteri_modal`)

### 📋 Batch 4 (Item 31 - 40) - *SELESAI (10/10)*
- [x] `007.026` | **IC AUGMENTASI PERSALINAN** (`list_informed_consent_augmentasipersalinan_modal`)
- [x] `007.027` | **IC CURRETAGE** (`list_informed_consent_curretage_modal`)
- [x] `007.029` | **IC MENOLAK MKJP** (`list_informed_consent_menolakmkjp_modal`)
- [x] `007.030` | **IC SALPINGOOFORECTOMY** (`list_informed_consent_salpingooforectomy_modal`)
- [x] `008.001` | **IC ABSES, ULKUS** (`list_informed_consent_absesulkus_modal`)
- [x] `008.002` | **IC TUMOR MAMAE, STT** (`list_informed_consent_tumormamae_modal`)
- [x] `008.004` | **IC HEMOROID** (`list_informed_consent_hemoroid_modal`)
- [x] `008.006` | **IC PHIMOSIS** (`list_informed_consent_phismosis_modal`)
- [x] `008.007` | **IC EFUSI PLEURA, EMPIEMA** (`list_informed_consent_efusipleura_modal`)
- [x] `008.008` | **IC ILEUS OBSTRUKTIF** (`list_informed_consent_ileusobstruktif_modal`)

### 📋 Batch 5 (Item 41 - 50) - *SELESAI (10/10)*
- [x] `008.009` | **IC COMBUSTIO** (`list_informed_consent_combustio_modal`)
- [x] `008.010` | **IC APPENDICITIS** (`list_informed_consent_appendicitis_modal`)
- [x] `008.012` | **IC HERNIA** (`list_informed_consent_hernia_modal`)
- [x] `010.001` | **IC DC (DOWN CATETER) URIN** (`list_informed_consent_dc_modal`)
- [x] `010.002` | **IC NGT (NASO GASTRIC TUBE)** (`list_informed_consent_ngt_modal`)
- [x] `011.001` | **IC INJEKSI IA** (`list_informed_consent_injeksia_modal`)
- [x] `011.002` | **IC ORIF** (`list_informed_consent_orif_modal`)
- [x] `011.003` | **IC REPOSISI FIKSASI EKSTERNAL GIPS** (`list_informed_consent_reposisifiksasi_modal`)
- [x] `011.004` | **IC ROI WIRE** (`list_informed_consent_roiwire_modal`)
- [x] `011.005` | **IC SKIN TRAKSI** (`list_informed_consent_skintraksi_modal`)

### 📋 Batch 6 (Item 51 - 60)
- [x] `011.006` | **IC FRAKTUR** (`list_informed_consent_fraktur_modal`)
- [x] `012.001` | **IC ANESTESI SUBKONJUNCTIVA** (`list_informed_consent_anestesisubkonjunctiva_modal`)
- [x] `012.002` | **IC CORPAL** (`list_informed_consent_corpal_modal`)
- [x] `012.003` | **IC EVISCERASI BULBY** (`list_informed_consent_eviscerasibulby_modal`)
- [x] `012.004` | **IC KATARAK** (`list_informed_consent_katarak_modal`)
- [x] `012.005` | **IC PTERYGIUM** (`list_informed_consent_pterygium_modal`)
- [x] `012.006` | **IC REKONTRUKSI PALPEBRA ENTROPION** (`list_informed_consent_rekontruksipalpebra_modal`)
- [x] `012.007` | **IC TRABECULECTOMY** (`list_informed_consent_trabeculectomy_modal`)
- [x] `012.008` | **IC TUMOR PALPEBRA** (`list_informed_consent_tumorpalpebra_modal`)
- [x] `012.009` | **IC ND-YAG LASER CAPSULOTOMY** (`list_informed_consent_ndyaglasercapsulotomy_modal`)

### 📋 Batch 7 (Item 61 - 70)
- [x] `012.010` | **IC INJEKSI AVASTIN** (`list_informed_consent_injeksiavastin_modal`)
- [x] `012.011` | **IC INJEKSI INTRAVITREAL** (`list_informed_consent_injeksiintravitreal_modal`)
- [x] `013.001` | **IC KARDIOVERSI** (`list_informed_consent_kardioversi_modal`)
- [x] `014.001` | **IC PROSTAT HIPERTROFI/ BATU BULI** (`list_informed_consent_hipertrofi_modal`)
- [x] `014.002` | **IC VESICOLITIASIS** (`list_informed_consent_vesicolitiasis_modal`)
- [x] `014.003` | **IC BATU URETER/STENOSIS URETER/DJ STENT** (`list_informed_consent_batuureter_modal`)
- [x] `014.004` | **IC STRIKTUR URETRA/BPH/VESIKOLITIASIS** (`list_informed_consent_striktururetra_modal`)
- [x] `014.005` | **IC URETEROLITIASIS/NEFROLITIASIS/KISTA GINJAL** (`list_informed_consent_ureterolitiasis_modal`)
- [x] `015.001` | **IC ABSES HIDUNG** (`list_informed_consent_abseshidung_modal`)
- [x] `015.002` | **IC ABSES PERITONSILAR** (`list_informed_consent_absesperitonsilar_modal`)

### 📋 Batch 8 (Item 71 - 80)
- [x] `015.003` | **IC ABSES SUBMANDIBULA** (`list_informed_consent_absessubmandibula_modal`)
- [x] `015.004` | **IC DEVIASI SEPTUM NASAL** (`list_informed_consent_deviasiseptumnasal_modal`)
- [x] `015.005` | **IC HIPERTROFI ADENOID** (`list_informed_consent_hipertrofiadenoid_modal`)
- [x] `015.006` | **IC INJEKSI INTRATIMPANI** (`list_informed_consent_injeksiintratimpani_modal`)
- [x] `015.007` | **IC KERATOSIS** (`list_informed_consent_keratosis_modal`)
- [x] `015.008` | **IC KOLESTEATOMA** (`list_informed_consent_kolesteatoma_modal`)
- [x] `015.009` | **IC POLIP NASAL** (`list_informed_consent_polipnasal_modal`)
- [x] `015.010` | **IC TIMPANOPLASTY** (`list_informed_consent_timpanoplasty_modal`)
- [x] `015.011` | **IC TONSILEKTOMY** (`list_informed_consent_tonsilektomy_modal`)
- [x] `015.012` | **IC TUMOR LEHER** (`list_informed_consent_tumorleher_modal`)

### 📋 Batch 9 (Item 81 - 90)
- [x] `015.013` | **IC TUMOR NASOFARING** (`list_informed_consent_tumornasofaring_modal`)
- [x] `015.014` | **IC TUMOR PERITONSILAR** (`list_informed_consent_tumorperitonsilar_modal`)
- [x] `015.015` | **IC TUMOR TELINGA** (`list_informed_consent_tumortelinga_modal`)
- [x] `016.001` | **IC HERNIA UMBILIKAL** (`list_informed_consent_herniaumbilikal_modal`)
- [x] `016.002` | **IC HIDROCELE** (`list_informed_consent_hidrocele_modal`)
- [x] `016.003` | **IC HIPOSPADHIA** (`list_informed_consent_hipospadhia_modal`)
- [x] `016.004` | **IC HYSPRUNG** (`list_informed_consent_hysprung_modal`)
- [x] `016.005` | **IC PHIMOSIS** (`list_informed_consent_phimosis_modal`)
- [x] `016.006` | **IC POLYDACTYLY** (`list_informed_consent_polydactyly_modal`)
- [x] `016.007` | **IC STT** (`list_informed_consent_stt_modal`)

### 📋 Batch 10 (Item 91 - 98)
- [x] `016.008` | **IC SYNECHIA VAGINALIS** (`list_informed_consent_synechiavaginalis_modal`)
- [x] `016.009` | **IC UDT** (`list_informed_consent_udt_modal`)
- [x] `016.010` | **IC HERNIA** (`list_informed_consent_hernia_bedahanak_modal`)
- [x] `017.001` | **IC KOSONGAN** (`list_informed_consent_kosongan_modal`)
- [x] `017.002` | **IC TINDAKAN INFUS** (`list_informed_consent_tindakan_infus_modal`)
- [x] `017.003` | **IC MANAJEMEN NYERI** (`list_informed_consent_manajemen_nyeri_modal`)
- [x] `018.006` | **IC GIGI SEMUA** (`list_informed_consent_gigisemua_modal`)
- [x] `019.001` | **IC RADIOLOGI** (`list_informed_consent_radiologi_modal`)
