# Panduan & Referensi Fungsi DB Helper (`db_helper.php`) SIMRS RSUD Soedomo

File Helper: [db_helper.php](file:///home/geri/ITM/SOEDOMO/simrs/application/helpers/db_helper.php)  
Class: `DB`

Class `DB` di `db_helper.php` merupakan **Data Access Layer (DAL)** utama yang digunakan di seluruh modul SIMRS RSUD Soedomo. Seluruh method pada class `DB` berupa method statis (`public static function`) yang membungkus Query Builder CodeIgniter 3 serta mengintegrasikan fitur otomatisasi audit log, dekripsi/enkripsi data, transaksi PostgreSQL, dan penanganan DataTables server-side.

---

## 1. Daftar Method Query (Read Operations)

### `DB::all($table, $params = null, $order = null)`
Mengambil seluruh record dari sebuah tabel yang memiliki status aktif (`active_st = '1'`).
- **Param `$table`**: `string` nama tabel (misal: `'mst_pasien'`).
- **Param `$params`**: `array|null` kondisi Dimana (`where`). Contoh: `['jenisregistrasi_id' => '1']`.
- **Param `$order`**: `array|null` pengurutan. Contoh: `['pasien_id', 'ASC']`.
- **Return**: `array` array of associative arrays (result set). Otomatis didekripsi jika field terdaftar di `encrypted_db_fields`.

```php
$pasien_list = DB::all('mst_pasien', ['status_perkawinan_id' => '1'], ['created_at', 'DESC']);
```

---

### `DB::all_like($table, $params = null, $params_where = null, $order = null, $side = 'both')`
Mengambil data dengan klausa `OR LIKE` pada kolom tertentu (case-insensitive via `LOWER()`) dan `active_st = '1'`.
- **Param `$params`**: `array` pasangan `[kolom => keyword]`.
- **Param `$params_where`**: `array|null` klausa `WHERE` tambahan.
- **Param `$side`**: `'both'`, `'before'`, atau `'after'`.

```php
$pasien = DB::all_like('mst_pasien', ['pasien_nm' => 'Budi'], ['active_st' => '1']);
```

---

### `DB::all_in($table, $params = null, $params_where = null, $order = null)`
Mengambil data berdasarkan klausa `WHERE IN` pada nilai array (case-insensitive via `LOWER()`) dan `active_st = '1'`.
- **Param `$params`**: `array` format `['nama_kolom' => ['val1', 'val2']]`.

```php
$ruangan = DB::all_in('mst_lokasi', ['jenisregistrasi_id' => ['1', '2']]);
```

---

### `DB::get($table, $params = array())`
Mengambil 1 (satu) record saja (row array) dari tabel berdasarkan parameter `$params`.
- **Return**: `array|null` 1 baris data associative array.

```php
$pelayanan = DB::get('dat_pelayanan', ['pelayanan_id' => $pelayanan_id]);
```

---

### `DB::get_return($table, $params = array(), $return = false)`
Mengambil 1 record dari tabel. Jika data ditemukan mengembalikan `row_array`, jika tidak ada mengembalikan nilai `$return` (default `false`).

```php
$cek = DB::get_return('dat_pelayanan', ['pelayanan_id' => '123'], false);
if ($cek !== false) {
    // Data ditemukan
}
```

---

### `DB::query($query, $where = null, $order = null, $return = 'result')`
Mengeksekusi SQL kustom dengan opsi klausa `$where` dan `$order` opsional.
- **Param `$return`**: `'result'` untuk `result_array()`, `'row'` untuk `row_array()`.

```php
$sql = "SELECT a.*, b.pegawai_nm FROM dat_tih a LEFT JOIN mst_pegawai b ON a.dokter_id = b.pegawai_id";
$data = DB::query($sql, ['a.pelayanan_id' => $pelayanan_id], ['a.tih_id' => 'DESC'], 'result');
```

---

### `DB::raw($init, $sql, $params = false)`
Mengeksekusi query SQL mentah murni dengan fleksibilitas mengembalikan tipe data yang diinginkan.
- **Param `$init`**:
  - `'result_array'`: Mengembalikan `result_array()` (banyak baris).
  - `'row_array'`: Mengembalikan `row_array()` (satu baris).
  - `'num_rows'`: Mengembalikan `integer` jumlah baris.
  - `default`: Mengembalikan object CI DB Query Result.

```php
// Mengambil 1 baris
$row = DB::raw('row_array', "SELECT * FROM mst_pasien WHERE pasien_id = ?", [$pasien_id]);

// Mengambil banyak baris
$list = DB::raw('result_array', "SELECT * FROM dat_anamnesis WHERE pelayanan_id = '$pelayanan_id'");
```

---

### `DB::raw_json($init, $sql, $params = false)`
Mengeksekusi query mentah dan langsung merender output JSON (`_json($result)`) ke HTTP client.
- **Param `$init`**: `'result_array'`, `'row_array'`, `'num_rows'`.

```php
// Digunakan dalam AJAX Controller endpoint
DB::raw_json('result_array', "SELECT * FROM mst_lokasi WHERE active_st = '1'");
```

---

### `DB::valid_id($table, $field, $value)`
Memeriksa apakah ada record di tabel `$table` dimana `$field == $value`.
- **Return**: `boolean` (`true` jika ada, `false` jika tidak ada).

```php
if (DB::valid_id('mst_pasien', 'pasien_id', '00123456')) {
    // Pasien ditemukan
}
```

---

## 2. Daftar Method Mutasi Data (Insert, Update, Delete)

### `DB::insert($table, $data)`
Memasukkan record baru ke dalam tabel.
- **Otomatisasi**:
  1. Validasi CSRF Token via `_validate_token()`.
  2. Pengisian otomatis `created_at = _now()` jika kosong.
  3. Pengisian otomatis `created_by = _ses_get('user_realname')` jika kosong.
  4. Pengenalan enkripsi DB otomatis jika kolom terdaftar di `encrypted_db_fields`.
  5. Pencatatan audit trail otomatis via `DBLog::insert`.
- **Return**: `array` `['id' => '', 'status' => boolean, 'data' => $data]`.

```php
$data_tih = [
    'tih_id'       => $tih_id,
    'pelayanan_id' => $pelayanan_id,
    'registrasi_id'=> $registrasi_id,
    'pasien_id'    => $pasien_id,
    'catatan'      => 'Pasien stabil'
];
$res = DB::insert('dat_tih', $data_tih);
```

---

### `DB::update($table, $data, $where, $trans_id = null)`
Memperbarui record eksisting.
- **Otomatisasi**:
  1. Validasi CSRF Token via `_validate_token()`.
  2. Pengisian otomatis `updated_at = _now()` jika kosong.
  3. Pengisian otomatis `updated_by = _ses_get('user_realname')` jika kosong.
  4. Pencatatan audit trail otomatis via `DBLog::update`.
- **Return**: `array` `['id' => '', 'status' => boolean, 'data' => $data]`.

```php
$update = ['catatan' => 'Pasien dipindahkan ke ICU'];
$where  = ['tih_id' => $tih_id];
$res    = DB::update('dat_tih', $update, $where);
```

---

### `DB::delete($table, $where = null, $trans_id = null)`
Menghapus record secara fisik (Hard Delete) dari database.
- **Otomatisasi**: Catat audit log via `DBLog::delete`.

```php
DB::delete('dat_tih', ['tih_id' => $tih_id]);
```

---

### `DB::soft_delete($table, $where)`
Menghapus record secara konseptual (Soft Delete) tanpa menghapus fisik baris.
- **Otomatisasi**:
  - `active_st = 0`
  - `deleted_st = 1`
  - `deleted_at = _now()`
  - `deleted_by = _ses_get('user_realname')`

```php
DB::soft_delete('dat_tih', ['tih_id' => $tih_id]);
```

---

## 3. ID Generator & Anti-Concurrency Lock (`get_id`)

### `DB::get_id($modul = null, $type = 1, $tanggal = null)`
Menghasilkan Primary Key unik anti-duplikat dan anti-deadlock khusus database **PostgreSQL** RSUD Soedomo.
- **Mekanisme Kerja Internals**:
  1. Membuka transaksi eksplisit (`trans_begin()`).
  2. Mengeksekusi PostgreSQL Transaction-Level Advisory Lock:
     ```sql
     SELECT pg_advisory_xact_lock($lock_key1, $lock_key2)
     ```
     *$lock_key1 & $lock_key2 dihitung dari signed 32-bit `crc32()` hash nama modul.*
  3. Membaca counter terakhir di tabel `tmp_id`.
  4. Menghitung ID berikutnya berdasarkan tipe format `$type`.
  5. Melakukan **Anti-Collision Loop** (maksimal 100 percobaan) untuk memastikan ID belum pernah ada di tabel target.
  6. Memperbarui tabel `tmp_id` via `DB::update_id()`.
  7. Menyiapkan transaksi (`trans_commit()`) yang mana Advisory Lock akan dilepas secara otomatis.

- **Pilihan Tipe ID (`$type`)**:
  - `type = 1`: **YYMMDD + 6 Digit Counter** (Contoh: `260814000001`), reset tiap hari.
  - `type = 2`: **12 Digit Padded Counter** (Contoh: `000000000001`), berurutan tidak reset per hari.
  - `default` (`type = 3`): **YYMMDD + 4 Digit Counter** (Contoh: `2608140001`), reset tiap hari.

```php
// Contoh membuat ID transaksi baru untuk dat_tih
$tih_id = DB::get_id('dat_tih'); // Format: YYMMDD000001

// Menyimpan record ke tabel
DB::insert('dat_tih', $data);

// Memperbarui counter tmp_id secara eksplisit
DB::update_id('dat_tih', $tih_id);
```

---

### `DB::get_id_custom($modul = null, $type = 1, $length_id = '12', $tanggal = null)`
Menghasilkan ID unik dengan kustomisasi panjang karakter `$length_id`.

```php
$custom_id = DB::get_id_custom('dat_pelayanan', 1, 14);
```

---

### `DB::update_id($modul = null, $no_id = null, $tanggal = null, $status = false)`
Memperbarui baris counter pada tabel `tmp_id`. Jika baris modul belum ada di `tmp_id`, fungsi akan melakukan `INSERT`, jika sudah ada akan melakukan `UPDATE`.

---

## 4. Helper DataTables Server-Side

### `DB::datatables_query($query, $keyword, $where, $iswhere = null)`
Memproses dan merender data JSON berformat DataTables server-side (lengkap dengan `draw`, `recordsTotal`, `recordsFiltered`, dan `data`).

- **Param `$query`**: Base query SQL utama (wajib dibungkus subquery `SELECT * FROM (...) a` jika ada JOIN).
- **Param `$keyword`**: `array|null` daftar kolom yang dapat dicari di search bar DataTables.
- **Param `$where`**: `array|null` key-value exact match.
- **Param `$iswhere`**: `string|null` string klausa WHERE tambahan (misal: `"a.registrasi_id = '123'"`).

```php
public function load_datatables_tih()
{
    $query = "SELECT * FROM (
        SELECT 
            a.*,
            b.pegawai_nm AS dokter_nm,
            c.lokasi_nm
        FROM dat_tih a
        LEFT JOIN mst_pegawai b ON a.dokter_id = b.pegawai_id
        LEFT JOIN mst_lokasi c ON a.lokasi_id = c.lokasi_id
    ) a";

    $keyword  = ['a.tih_id', 'a.dokter_nm', 'a.lokasi_nm'];
    $where    = null;
    $is_where = "a.registrasi_id = '" . $this->input->post('registrasi_id') . "'";

    DB::datatables_query($query, $keyword, $where, $is_where);
}
```

---

### `DB::datatables_query_different_count_query($query, $keyword, $where, $iswhere = null, $queryCount)`
Digunakan jika query pencacah jumlah total baris (`COUNT(1)`) memerlukan SQL tersendiri yang berbeda demi optimasi performa query kompleks.

---

## 5. String Helper & Transaksi Database

### Helper String Query
- `DB::where_in_str($field, $string, $separator = '#')`: Mengubah string ber-delimiter (contoh: `"A#B#C"`) menjadi SQL `col IN ('A', 'B', 'C')`.
- `DB::like_in_str($field, $string, $separator = '#')`: Mengubah string ber-delimiter menjadi `(col LIKE 'A%' OR col LIKE 'B%')`.
- `DB::where_in_arr($field, $arr)`: Mengubah array PHP menjadi string `col IN ('val1', 'val2')`.
- `DB::escape($value)`: Melakukan escaping karakter khusus SQL via CodeIgniter `db->escape()`.

### Transaksi Database
- `DB::trans_begin()`: Memulai transaksi database (Wajib untuk PostgreSQL Advisory Lock).
- `DB::trans_commit()`: Melakukan commit transaksi.
- `DB::trans_rollback()`: Melakukan rollback jika terjadi kesalahan/exception.
- `DB::trans_start()`, `DB::trans_complete()`, `DB::trans_status()`, `DB::trans_strict($val)`.

---

## 6. Enkripsi & Dekripsi Kolom Data Sensitif

SIMRS RSUD Soedomo mendukung enkripsi level kolom pada database untuk menjaga kerahasiaan data medis/pasien.

- `DB::encrypt_column($value)`: Mengenkripsi string `$value` menggunakan algoritma **AES-256 CTR** dengan `encryption_key` aplikasi.
- `DB::decrypt_column($value)`: Mendekripsi string terenkripsi kembali ke teks biasa.
- **Tabel Monitoring Enkripsi**: Setiap kolom terenkripsi dicatat di tabel `mst_encrypt_db` untuk melacak status dan iterasi enkripsi per record.
