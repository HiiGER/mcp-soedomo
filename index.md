# Dokumentasi Resmi SIMRS RSUD Soedomo

Selamat datang di repositori dokumentasi teknis, standar pengkodean (*coding standards*), kaidah basis data, dan cetak biru (*blueprint*) E-Rekam Medis (ERM) untuk **SIMRS RSUD Soedomo**.

---

## 📚 Modul & Panduan Utama

Silakan pilih dokumen panduan di bawah ini sesuai dengan kebutuhan pengembangan Anda:

### 1. 🗄️ Basis Data & Helper (`DB`)
- **[Kaidah & Standar Pembuatan Database RSUD Soedomo](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-style.md)** 
  *Aturan penamaan tabel (`dat_`, `mst_`, `log_`), struktur 8 kolom audit log mandatory, generator Primary Key anti-deadlock dengan PostgreSQL Advisory Lock (`pg_advisory_xact_lock`), enkripsi kolom data sensitif, dan kebijakan Soft Delete.*
- **[Referensi Lengkap Fungsi DB Helper (`db_helper.php`)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/database-helper.md)**  
  *Dokumentasi lengkap seluruh method statis pada class `DB` (query builder, raw query, mutasi data, DataTables server-side, ID generator, enkripsi, dan transaksi database).*

---

### 2. 📋 E-Rekam Medis (ERM)
- **[Blueprint & Standardisasi Fitur E-Rekam Medis (ERM)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/erm.md)**  
  *Arsitektur 3 jalur akses PPA (Offcanvas Right, Global Navbar Search, dan In-Page Nav Tab), struktur pendaftaran di `mst_erekam_medis`, pencatatan audit di `log_erekam_medis` (`log_erm()`), query PostgreSQL `SIMILAR TO`, dan code complete template (Controller, Model, View).*

---

### 3. 🖼️ User Interface & Modal Form
- **[Kaidah Pembuatan UI Modal Form (`itm.js`)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/modal-style.md)**  
  *Panduan arsitektur multi-level modal stacking (Level 1 List Modal vs Level 2 Form Input Modal), ukuran modal Bootstrap (`modal-sm` s/d `modal-full-width`), fungsi peluncur JS (`_modal`, `_modalNoEvent`, `_modalHide`), aturan penulisan view murni, serta alur AJAX submit & DataTables redraw.*

---

### 4. 🖨️ Pencetakan Dokumen & PDF
- **[Kaidah Modal Print & Cetak PDF](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/list-cetak.md)**  
  *Standardisasi preview pencetakan berbasis modal (`_modalPrint`, `_modalPrintTTE`), jembatan controller `Printpage.php`, pembuatan PDF via library `PdfDom` (Dompdf), alokasi memori `ini_set("memory_limit", "-1")`, Kop Surat identitas RS, serta template HTML print.*

---

### 5. 🛠️ Solusi & Troubleshooting
- **[Panduan Penanganan & Pencegahan Error (`solve-eror.md`)](file:///home/geri/ITM/SOEDOMO/dokumentasi-soedomo/solve-eror.md)**  
  *Langkah mudah mengatasi dan mencegah error umum di SIMRS RSUD Soedomo (DataTables AJAX parsing error, PostgreSQL advisory lock collision, indikator ERM tidak hijau, modal backdrop glitch, dan memory limit PDF).*

---

## 🚀 Ringkasan Tech Stack SIMRS RSUD Soedomo

- **Backend Framework**: CodeIgniter 3 (CI3) + HMVC Modules
- **Database Engine**: PostgreSQL 12+ (Driver: `postgre`)
- **Frontend UI Framework**: Bootstrap 5 / Tabler UI + jQuery
- **Client Script Helper**: `dist/js/itm.js` & `application/helpers/itm_helper.php`
- **PDF Engine**: Dompdf Wrapper (`application/libraries/PdfDom.php`)
