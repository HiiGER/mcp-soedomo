# Blueprint Standar Asesmen Rawat Inap Jiwa (RM 13.1.1, RM 13.1.2, RM 13.1.3, RM 13.1.4)

Dokumen ini merupakan **blueprint teknis komprehensif, standar arsitektur, skema database, pendaftaran DML, alur controller HMVC, dan panduan UI/Cetak PDF** untuk seluruh kelompok formulir **Asesmen Keperawatan & Medis Rawat Inap Jiwa (RM 13.1.1 s/d RM 13.1.4)** pada sistem SIMRS RSUD Soedomo.

---

## 🗺️ 1. Matriks Taksonomi & Komponen 4 Form RM 13.1.x

Kelompok Asesmen Rawat Inap Jiwa dibagi menjadi 4 formulir demografi/kategori klinis mandiri:

| Kode RM | Nama Resmi Dokumen ERM | Tabel Database Utama | Controller Form Keperawatan | Controller Form Medis DPJP | View Cetak PDF |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RM 13.1.1** | Asesmen Keperawatan & Medis Ranap Jiwa Anak & Remaja | `dat_asesmen_keperawatan_ranap_jiwa_anak` | `Pelayanan::form_asesmen_keperawatan_ranap_jiwa_anak_modal` | `Pelayanan::form_asesmen_medis_ranap_jiwa_anak_modal` | `cetak_asesmen_keperawatan_ranap_jiwa_anak.php` |
| **RM 13.1.2** | Asesmen Keperawatan & Medis Ranap Jiwa Dewasa | `dat_asesmen_keperawatan_ranap_jiwa_dewasa` | `Pelayanan::form_asesmen_keperawatan_ranap_jiwa_dewasa_modal` | `Pelayanan::form_asesmen_medis_ranap_jiwa_dewasa_modal` | `cetak_asesmen_keperawatan_ranap_jiwa_dewasa.php` |
| **RM 13.1.3** | Asesmen Keperawatan & Medis Ranap Jiwa Geriatri | `dat_asesmen_keperawatan_ranap_jiwa_geriatri` | `Pelayanan::form_asesmen_keperawatan_ranap_jiwa_geriatri_modal` | `Pelayanan::form_asesmen_medis_ranap_jiwa_geriatri_modal` | `cetak_asesmen_keperawatan_ranap_jiwa_geriatri.php` |
| **RM 13.1.4** | Asesmen Keperawatan & Medis Ranap Jiwa Organik | `dat_asesmen_keperawatan_ranap_jiwa_organik` | `Pelayanan::form_asesmen_keperawatan_ranap_jiwa_organik_modal` | `Pelayanan::form_asesmen_medis_ranap_jiwa_organik_modal` | `cetak_asesmen_keperawatan_ranap_jiwa_organik.php` |

---

## 🏗️ 2. Arsitektur Dual-Entry System (Perawat & Dokter DPJP)

Formulir RM 13.1.1 s/d 13.1.4 mengimplementasikan **Dual-Entry System** dengan alur sinkronisasi sebagai berikut:

```mermaid
flowchart TD
    subgraph AlurPerawat [1. Entry Point Perawat (Keperawatan)]
        A[Buka Form Asesmen Keperawatan] --> B[Isi Halaman 1: Alasan Masuk & Predisposisi]
        B --> C[Isi Halaman 2: Pengkajian Fisik & Tanda Vital]
        C --> D[Isi Halaman 3: Status Mental & Persepsi Sensorik]
        D --> E[Isi Halaman 4: Eliminasi, Edukasi, Koping & Pulang]
        E --> F[Submit Simpan Asesmen Keperawatan]
        F --> G[Tersimpan di dat_asesmen_keperawatan_ranap_jiwa_* dengan jenis_asesmen = 'JIWA_*_PERAWAT']
    end

    subgraph AlurDokter [2. Entry Point Dokter DPJP (Medis)]
        H[Buka Form Asesmen Medis DPJP] --> I[Auto-Pull Data Keperawatan via AJAX Endpoint get_keperawatan_jiwa_*_ajax]
        I --> J[Review Data Anamnesis & Fisik Hasil Input Perawat]
        J --> K[Isi Status Lokalis, Diagnosis, Prognosis & Rencana Medis]
        K --> L[Submit Simpan Asesmen Medis DPJP]
        L --> M[Tersimpan di dat_asesmen_keperawatan_ranap_jiwa_* dengan jenis_asesmen = 'JIWA_*_DOKTER']
    end

    G --> N[Log ERM status HIJAU log_erm]
    M --> N
    N --> O[Cetak PDF Dompdf Gabungan Medis & Keperawatan RM 13.1.x]
```

---

## 💾 3. Skema Database DDL & Registrasi DML (`mst_erekam_medis`)

### 3.1 DDL 4 Tabel Master Rawat Inap Jiwa

```sql
-- 1. RM 13.1.1 (Jiwa Anak & Remaja)
CREATE TABLE dat_asesmen_keperawatan_ranap_jiwa_anak (
    asesmenjiwaanak_id VARCHAR(50) NOT NULL PRIMARY KEY,
    pelayanan_id VARCHAR(50) NOT NULL,
    registrasi_id VARCHAR(50) NOT NULL,
    jenis_asesmen VARCHAR(30) DEFAULT 'JIWA_ANAK_PERAWAT', -- 'JIWA_ANAK_PERAWAT' / 'JIWA_ANAK_DOKTER'
    alasan_masuk TEXT, faktor_presipitasi TEXT, faktor_predisposisi TEXT, pengkajian_fisik TEXT, status_mental TEXT, persiapan_pulang TEXT, penilaian_stressor TEXT, sumber_koping TEXT,
    anamnesis TEXT, pemeriksaan_penunjang TEXT, rencana TEXT, diagnosis_keperawatan TEXT, intervensi_keperawatan TEXT, evaluasi_keperawatan TEXT,
    dokter_id VARCHAR(50), username_dokter VARCHAR(50), perawat_id VARCHAR(50), username_perawat VARCHAR(50), ttd_perawat TEXT, ttd_dokter TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(50), updated_at TIMESTAMP, updated_by VARCHAR(50), deleted_at TIMESTAMP, deleted_by VARCHAR(50), active_st CHAR(1) DEFAULT '1', deleted_st CHAR(1) DEFAULT '0'
);

-- 2. RM 13.1.2 (Jiwa Dewasa)
CREATE TABLE dat_asesmen_keperawatan_ranap_jiwa_dewasa (
    asesmenjiwadewasa_id VARCHAR(50) NOT NULL PRIMARY KEY,
    pelayanan_id VARCHAR(50) NOT NULL,
    registrasi_id VARCHAR(50) NOT NULL,
    jenis_asesmen VARCHAR(30) DEFAULT 'JIWA_DEWASA_PERAWAT', -- 'JIWA_DEWASA_PERAWAT' / 'JIWA_DEWASA_DOKTER'
    alasan_masuk TEXT, faktor_presipitasi TEXT, faktor_predisposisi TEXT, pengkajian_fisik TEXT, status_mental TEXT, persiapan_pulang TEXT, penilaian_stressor TEXT, sumber_koping TEXT,
    anamnesis TEXT, pemeriksaan_penunjang TEXT, rencana TEXT, diagnosis_keperawatan TEXT, intervensi_keperawatan TEXT, evaluasi_keperawatan TEXT,
    dokter_id VARCHAR(50), username_dokter VARCHAR(50), perawat_id VARCHAR(50), username_perawat VARCHAR(50), ttd_perawat TEXT, ttd_dokter TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(50), updated_at TIMESTAMP, updated_by VARCHAR(50), deleted_at TIMESTAMP, deleted_by VARCHAR(50), active_st CHAR(1) DEFAULT '1', deleted_st CHAR(1) DEFAULT '0'
);

-- 3. RM 13.1.3 (Jiwa Geriatri)
CREATE TABLE dat_asesmen_keperawatan_ranap_jiwa_geriatri (
    asesmenjiwageriatri_id VARCHAR(50) NOT NULL PRIMARY KEY,
    pelayanan_id VARCHAR(50) NOT NULL,
    registrasi_id VARCHAR(50) NOT NULL,
    jenis_asesmen VARCHAR(30) DEFAULT 'JIWA_GERIATRI_PERAWAT', -- 'JIWA_GERIATRI_PERAWAT' / 'JIWA_GERIATRI_DOKTER'
    alasan_masuk TEXT, faktor_presipitasi TEXT, faktor_predisposisi TEXT, pengkajian_fisik TEXT, status_mental TEXT, persiapan_pulang TEXT, penilaian_stressor TEXT, sumber_koping TEXT,
    anamnesis TEXT, pemeriksaan_penunjang TEXT, rencana TEXT, diagnosis_keperawatan TEXT, intervensi_keperawatan TEXT, evaluasi_keperawatan TEXT,
    dokter_id VARCHAR(50), username_dokter VARCHAR(50), perawat_id VARCHAR(50), username_perawat VARCHAR(50), ttd_perawat TEXT, ttd_dokter TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(50), updated_at TIMESTAMP, updated_by VARCHAR(50), deleted_at TIMESTAMP, deleted_by VARCHAR(50), active_st CHAR(1) DEFAULT '1', deleted_st CHAR(1) DEFAULT '0'
);

-- 4. RM 13.1.4 (Jiwa Organik)
CREATE TABLE dat_asesmen_keperawatan_ranap_jiwa_organik (
    asesmenjiwaorganik_id VARCHAR(50) NOT NULL PRIMARY KEY,
    pelayanan_id VARCHAR(50) NOT NULL,
    registrasi_id VARCHAR(50) NOT NULL,
    jenis_asesmen VARCHAR(30) DEFAULT 'JIWA_ORGANIK_PERAWAT', -- 'JIWA_ORGANIK_PERAWAT' / 'JIWA_ORGANIK_DOKTER'
    alasan_masuk TEXT, faktor_presipitasi TEXT, faktor_predisposisi TEXT, pengkajian_fisik TEXT, status_mental TEXT, persiapan_pulang TEXT, penilaian_stressor TEXT, sumber_koping TEXT,
    anamnesis TEXT, pemeriksaan_penunjang TEXT, rencana TEXT, diagnosis_keperawatan TEXT, intervensi_keperawatan TEXT, evaluasi_keperawatan TEXT,
    dokter_id VARCHAR(50), username_dokter VARCHAR(50), perawat_id VARCHAR(50), username_perawat VARCHAR(50), ttd_perawat TEXT, ttd_dokter TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by VARCHAR(50), updated_at TIMESTAMP, updated_by VARCHAR(50), deleted_at TIMESTAMP, deleted_by VARCHAR(50), active_st CHAR(1) DEFAULT '1', deleted_st CHAR(1) DEFAULT '0'
);
```

### 3.2 DML Pendaftaran 4 Formulir ke `mst_erekam_medis`

```sql
-- RM 13.1.1: Asesmen Ranap Jiwa Anak & Remaja
INSERT INTO mst_erekam_medis (
    erekammedis_id, erekammedis_nm, berkas_no, parent_id, erekammedis_tp,
    uri_controller, function_controller, type_modal, size_modal, icon, lokasi_map, active_st, deleted_st
) VALUES (
    '01.1311', 'Asesmen Keperawatan & Medis Ranap Jiwa Anak', 'RM 13.1.1', '01', 'D',
    'uri', 'form_asesmen_keperawatan_ranap_jiwa_anak_modal/pelayanan_id/registrasi_id', 'modal', 'modal-xl',
    'fas fa-child', 'BANGSAL#JIWA', '1', '0'
);

-- RM 13.1.2: Asesmen Ranap Jiwa Dewasa
INSERT INTO mst_erekam_medis (
    erekammedis_id, erekammedis_nm, berkas_no, parent_id, erekammedis_tp,
    uri_controller, function_controller, type_modal, size_modal, icon, lokasi_map, active_st, deleted_st
) VALUES (
    '01.1312', 'Asesmen Keperawatan & Medis Ranap Jiwa Dewasa', 'RM 13.1.2', '01', 'D',
    'uri', 'form_asesmen_keperawatan_ranap_jiwa_dewasa_modal/pelayanan_id/registrasi_id', 'modal', 'modal-xl',
    'fas fa-user-friends', 'BANGSAL#JIWA', '1', '0'
);

-- RM 13.1.3: Asesmen Ranap Jiwa Geriatri
INSERT INTO mst_erekam_medis (
    erekammedis_id, erekammedis_nm, berkas_no, parent_id, erekammedis_tp,
    uri_controller, function_controller, type_modal, size_modal, icon, lokasi_map, active_st, deleted_st
) VALUES (
    '01.1313', 'Asesmen Keperawatan & Medis Ranap Jiwa Geriatri', 'RM 13.1.3', '01', 'D',
    'uri', 'form_asesmen_keperawatan_ranap_jiwa_geriatri_modal/pelayanan_id/registrasi_id', 'modal', 'modal-xl',
    'fas fa-blind', 'BANGSAL#JIWA', '1', '0'
);

-- RM 13.1.4: Asesmen Ranap Jiwa Organik
INSERT INTO mst_erekam_medis (
    erekammedis_id, erekammedis_nm, berkas_no, parent_id, erekammedis_tp,
    uri_controller, function_controller, type_modal, size_modal, icon, lokasi_map, active_st, deleted_st
) VALUES (
    '01.1314', 'Asesmen Keperawatan & Medis Ranap Jiwa Organik', 'RM 13.1.4', '01', 'D',
    'uri', 'form_asesmen_keperawatan_ranap_jiwa_organik_modal/pelayanan_id/registrasi_id', 'modal', 'modal-xl',
    'fas fa-brain', 'BANGSAL#JIWA', '1', '0'
);
```

---

## 🕹️ 4. Spesifikasi Controller & Model per Formulir (`Pelayanan.php`)

### 4.1 RM 13.1.1 (Jiwa Anak dan Remaja)

```php
// Keperawatan Form & Save
public function form_asesmen_keperawatan_ranap_jiwa_anak_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_anak WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_ANAK_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' ORDER BY asesmenjiwaanak_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_keperawatan_ranap_jiwa_anak/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_keperawatan_ranap_jiwa_anak/asesmen_keperawatan_ranap_jiwa_anak_modal', $d);
}

public function save_asesmen_keperawatan_ranap_jiwa_anak($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_keperawatan_ranap_jiwa_anak($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1311', 'Asesmen Keperawatan Ranap Jiwa Anak (RM 13.1.1)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

// Medis DPJP Form, Save, & Cetak
public function form_asesmen_medis_ranap_jiwa_anak_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_anak WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_ANAK_DOKTER' AND deleted_st = '0' ORDER BY asesmenjiwaanak_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_medis_ranap_jiwa_anak/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_medis_ranap_jiwa_anak/asesmen_medis_ranap_jiwa_anak_modal', $d);
}

public function save_asesmen_medis_ranap_jiwa_anak($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_medis_ranap_jiwa_anak($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1311', 'Asesmen Medis Ranap Jiwa Anak (RM 13.1.1)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

public function cetak_asesmen_keperawatan_ranap_jiwa_anak($pelayanan_id = null, $registrasi_id = null)
{
    $data['kep'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_anak WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_ANAK_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $data['medis'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_anak WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_ANAK_DOKTER' AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $html = $this->load->view($this->template . 'cetak/cetak_asesmen_keperawatan_ranap_jiwa_anak', $data, true);
    return $this->pdfdom->merge($html, 'cetak_asesmen_keperawatan_ranap_jiwa_anak_' . $pelayanan_id, 'A4', 'portrait');
}
```

---

### 4.2 RM 13.1.2 (Jiwa Dewasa)

```php
// Keperawatan Form & Save
public function form_asesmen_keperawatan_ranap_jiwa_dewasa_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_dewasa WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_DEWASA_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' ORDER BY asesmenjiwadewasa_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_keperawatan_ranap_jiwa_dewasa/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_keperawatan_ranap_jiwa_dewasa/asesmen_keperawatan_ranap_jiwa_dewasa_modal', $d);
}

public function save_asesmen_keperawatan_ranap_jiwa_dewasa($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_keperawatan_ranap_jiwa_dewasa($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1312', 'Asesmen Keperawatan Ranap Jiwa Dewasa (RM 13.1.2)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

// Medis DPJP Form, Save, & Cetak
public function form_asesmen_medis_ranap_jiwa_dewasa_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_dewasa WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_DEWASA_DOKTER' AND deleted_st = '0' ORDER BY asesmenjiwadewasa_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_medis_ranap_jiwa_dewasa/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_medis_ranap_jiwa_dewasa/asesmen_medis_ranap_jiwa_dewasa_modal', $d);
}

public function save_asesmen_medis_ranap_jiwa_dewasa($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_medis_ranap_jiwa_dewasa($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1312', 'Asesmen Medis Ranap Jiwa Dewasa (RM 13.1.2)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

public function cetak_asesmen_keperawatan_ranap_jiwa_dewasa($pelayanan_id = null, $registrasi_id = null)
{
    $data['kep'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_dewasa WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_DEWASA_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $data['medis'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_dewasa WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_DEWASA_DOKTER' AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $html = $this->load->view($this->template . 'cetak/cetak_asesmen_keperawatan_ranap_jiwa_dewasa', $data, true);
    return $this->pdfdom->merge($html, 'cetak_asesmen_keperawatan_ranap_jiwa_dewasa_' . $pelayanan_id, 'A4', 'portrait');
}
```

---

### 4.3 RM 13.1.3 (Jiwa Geriatri)

```php
// Keperawatan Form & Save
public function form_asesmen_keperawatan_ranap_jiwa_geriatri_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_geriatri WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_GERIATRI_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' ORDER BY asesmenjiwageriatri_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_keperawatan_ranap_jiwa_geriatri/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_keperawatan_ranap_jiwa_geriatri/asesmen_keperawatan_ranap_jiwa_geriatri_modal', $d);
}

public function save_asesmen_keperawatan_ranap_jiwa_geriatri($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_keperawatan_ranap_jiwa_geriatri($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1313', 'Asesmen Keperawatan Ranap Jiwa Geriatri (RM 13.1.3)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

// Medis DPJP Form, Save, & Cetak
public function form_asesmen_medis_ranap_jiwa_geriatri_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_geriatri WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_GERIATRI_DOKTER' AND deleted_st = '0' ORDER BY asesmenjiwageriatri_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_medis_ranap_jiwa_geriatri/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_medis_ranap_jiwa_geriatri/asesmen_medis_ranap_jiwa_geriatri_modal', $d);
}

public function save_asesmen_medis_ranap_jiwa_geriatri($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_medis_ranap_jiwa_geriatri($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1313', 'Asesmen Medis Ranap Jiwa Geriatri (RM 13.1.3)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

public function cetak_asesmen_keperawatan_ranap_jiwa_geriatri($pelayanan_id = null, $registrasi_id = null)
{
    $data['kep'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_geriatri WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_GERIATRI_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $data['medis'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_geriatri WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_GERIATRI_DOKTER' AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $html = $this->load->view($this->template . 'cetak/cetak_asesmen_keperawatan_ranap_jiwa_geriatri', $data, true);
    return $this->pdfdom->merge($html, 'cetak_asesmen_keperawatan_ranap_jiwa_geriatri_' . $pelayanan_id, 'A4', 'portrait');
}
```

---

### 4.4 RM 13.1.4 (Jiwa Organik)

```php
// Keperawatan Form & Save
public function form_asesmen_keperawatan_ranap_jiwa_organik_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_organik WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_ORGANIK_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' ORDER BY asesmenjiwaorganik_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_keperawatan_ranap_jiwa_organik/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_keperawatan_ranap_jiwa_organik/asesmen_keperawatan_ranap_jiwa_organik_modal', $d);
}

public function save_asesmen_keperawatan_ranap_jiwa_organik($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_keperawatan_ranap_jiwa_organik($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1314', 'Asesmen Keperawatan Ranap Jiwa Organik (RM 13.1.4)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

// Medis DPJP Form, Save, & Cetak
public function form_asesmen_medis_ranap_jiwa_organik_modal($pelayanan_id = null, $registrasi_id = null)
{
    $d['pelayanan'] = $this->m_pelayanan->get_pelayanan($pelayanan_id);
    $d['main'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_organik WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_ORGANIK_DOKTER' AND deleted_st = '0' ORDER BY asesmenjiwaorganik_id DESC LIMIT 1", [$pelayanan_id]) ?: [];
    $d['form_act'] = $this->uri . '/save_asesmen_medis_ranap_jiwa_organik/' . $pelayanan_id . '/' . $registrasi_id;
    $this->render($this->template . '/asesmen/asesmen_medis_ranap_jiwa_organik/asesmen_medis_ranap_jiwa_organik_modal', $d);
}

public function save_asesmen_medis_ranap_jiwa_organik($pelayanan_id = null, $registrasi_id = null)
{
    $res = $this->m_pelayanan->save_asesmen_medis_ranap_jiwa_organik($pelayanan_id, $registrasi_id);
    log_erm($pelayanan_id, '01.1314', 'Asesmen Medis Ranap Jiwa Organik (RM 13.1.4)');
    _json(_response($res['res'], $this->uri . '/form/' . @$pelayanan_id . '#tindakan'));
}

public function cetak_asesmen_keperawatan_ranap_jiwa_organik($pelayanan_id = null, $registrasi_id = null)
{
    $data['kep'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_organik WHERE pelayanan_id = ? AND (jenis_asesmen = 'JIWA_ORGANIK_PERAWAT' OR jenis_asesmen IS NULL) AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $data['medis'] = DB::raw('row_array', "SELECT * FROM dat_asesmen_keperawatan_ranap_jiwa_organik WHERE pelayanan_id = ? AND jenis_asesmen = 'JIWA_ORGANIK_DOKTER' AND deleted_st = '0' LIMIT 1", [$pelayanan_id]);
    $html = $this->load->view($this->template . 'cetak/cetak_asesmen_keperawatan_ranap_jiwa_organik', $data, true);
    return $this->pdfdom->merge($html, 'cetak_asesmen_keperawatan_ranap_jiwa_organik_' . $pelayanan_id, 'A4', 'portrait');
}
```

---

## 🎨 5. UI Modal Level 2 & Partial Views per Variasi

Setiap varian memiliki folder view tersendiri yang terorganisir secara modular:

```
views/pelayanan/asesmen/
├── asesmen_keperawatan_ranap_jiwa_anak/
├── asesmen_medis_ranap_jiwa_anak/
├── asesmen_keperawatan_ranap_jiwa_dewasa/
├── asesmen_medis_ranap_jiwa_dewasa/
├── asesmen_keperawatan_ranap_jiwa_geriatri/
├── asesmen_medis_ranap_jiwa_geriatri/
├── asesmen_keperawatan_ranap_jiwa_organik/
└── asesmen_medis_ranap_jiwa_organik/
```

### Struktur Sub-Halaman Partial Include (Berlaku untuk 4 Variasi):
```
├── [asesmen_modal.php]                   <-- Tab Nav & Main Wrapper Modal Form
├── [_js_asesmen_modal.php]               <-- Handling Submit AJAX & Validation
├── hal1_alasan_masuk.php                <-- Sub-View Alasan Masuk & Predisposisi
├── hal2_predisposisi_fisik.php           <-- Sub-View Pengkajian Fisik & Tanda Vital
├── hal3_status_mental.php               <-- Sub-View Status Mental: Penampilan, Afek, Persepsi
├── hal4_kebutuhan_pulang_edukasi.php    <-- Sub-View Kebutuhan Persiapan Pulang & Edukasi
└── hal5_penatalaksanaan_evaluasi.php    <-- Sub-View Masalah Keperawatan & Evaluasi
```

---

## 🖨️ 6. Standards Cetak PDF Dompdf Multi-Halaman (`RM 13.1.1 - 13.1.4`)

### 6.1 Standard Cetak PDF View Mapping

| Variasi RM | File View Cetak | Header Tag RM |
| :--- | :--- | :--- |
| **RM 13.1.1** | `cetak_asesmen_keperawatan_ranap_jiwa_anak.php` | `<div style="text-align: right; font-weight: bold; font-size: 11px;">RM 13.1.1</div>` |
| **RM 13.1.2** | `cetak_asesmen_keperawatan_ranap_jiwa_dewasa.php` | `<div style="text-align: right; font-weight: bold; font-size: 11px;">RM 13.1.2</div>` |
| **RM 13.1.3** | `cetak_asesmen_keperawatan_ranap_jiwa_geriatri.php` | `<div style="text-align: right; font-weight: bold; font-size: 11px;">RM 13.1.3</div>` |
| **RM 13.1.4** | `cetak_asesmen_keperawatan_ranap_jiwa_organik.php` | `<div style="text-align: right; font-weight: bold; font-size: 11px;">RM 13.1.4</div>` |

### 6.2 Helper Mandatori `_ck()` & TTD Barcode
Gunakan helper `_ck()` DejaVu Sans centang (`&#10004;`) dan fungsi TTD `generate_ttd()` pada keempat lembar cetak:

```php
// Render Checkbox Centang DejaVu Sans
if (!function_exists('_ck')) {
  function _ck($val, $target = 1) {
    $is_checked = false;
    $targets = is_array($target) ? array_map('strval', $target) : [(string)$target];
    $flat_vals = [];
    if (is_array($val)) {
      array_walk_recursive($val, function($item) use (&$flat_vals) {
        if ($item !== null && $item !== '') $flat_vals[] = (string)$item;
      });
    } else if ($val !== '' && $val !== null) {
      $flat_vals[] = (string)$val;
    }
    foreach ($targets as $t) {
      if (in_array($t, $flat_vals, true)) {
        $is_checked = true;
        break;
      }
    }
    return $is_checked 
      ? '<span style="font-family: DejaVu Sans, Arial, sans-serif; font-weight: bold;">&#10004;</span>' 
      : '&nbsp;&nbsp;';
  }
}
```

---

## ⚠️ 7. Troubleshooting & Error Common Pitfalls

1. **Error `json_decode()` Null / Invalid Array pada View**:
   - *Penyebab*: Field database berisi `NULL`, string kosong `""`, atau string ter-escape ganda.
   - *Solusi*: Selalu gunakan fallback di controller:
     ```php
     $d['main'][$jf] = (!empty($d['main'][$jf]) && is_string($d['main'][$jf])) 
       ? (json_decode($d['main'][$jf], true) ?: []) 
       : [];
     ```

2. **Indikator ERM Tidak Berubah Hijau Setelah Simpan**:
   - *Penyebab*: Lupa memanggil fungsi `log_erm($pelayanan_id, $erekammedis_id, $nama_modul)`.
   - *Solusi*: Pastikan `log_erm(...)` dipanggil dengan `erekammedis_id` yang sesuai (`01.1311` s/d `01.1314`).

3. **Kop Surat PDF Terpotong Saat Cetak**:
   - *Penyebab*: Box header tidak menggunakan fixed height `105px` simetris.
   - *Solusi*: Ikuti kaidah cetak 3-kolom di `list-cetak.md`.
