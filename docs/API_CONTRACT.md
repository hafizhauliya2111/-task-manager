# API Contract — Task Manager

**Base URL (development):** `http://localhost/task-manager/backend/api`
**Format:** JSON
**Auth:** Bearer Token — dikirim di header `Authorization: Bearer <token>`
**Role:** `owner`, `editor`, `viewer` — **role ini per-board**, bukan role global seperti di
myretail. Satu user bisa jadi `owner` di board miliknya sendiri, sekaligus `editor` atau
`viewer` di board milik orang lain, tergantung board mana yang sedang diakses.

> Referensi logika bisnis tiap fitur ada di `FUNCTIONAL_REQUIREMENTS.md`.

---

## 1. Response Format Standar

### Sukses
```json
{
  "success": true,
  "data": { },
  "message": "Berhasil"
}
```

### Gagal
```json
{
  "success": false,
  "message": "Pesan error yang jelas",
  "errors": {
    "field_name": ["Field ini wajib diisi"]
  }
}
```

### Status Code yang dipakai
| Code | Arti |
|------|------|
| 200  | OK / Sukses |
| 201  | Data berhasil dibuat |
| 400  | Request tidak valid |
| 401  | Belum login / token invalid / token expired |
| 403  | Sudah login, tapi tidak punya akses ke resource ini (role tidak sesuai) |
| 404  | Data tidak ditemukan |
| 409  | Konflik (misal email sudah dipakai saat register) |
| 422  | Validasi gagal |
| 500  | Server error |

### Konvensi Penulisan
- Semua field nama pakai `snake_case`
- Semua tanggal pakai format ISO 8601 (`2026-09-16T10:15:00Z`)
- Endpoint yang butuh login wajib kirim header `Authorization: Bearer <token>`
- Endpoint bertanda **(owner only)** akan balas `403 Forbidden` kalau diakses role `editor`/`viewer`
- Endpoint bertanda **(owner & editor)** akan balas `403 Forbidden` kalau diakses role `viewer`
- **Prinsip keamanan**: untuk endpoint yang menerima ID resource turunan (`list_id`,
  `card_id`), backend **wajib query ulang** ke database untuk menemukan `board_id`
  sebenarnya — tidak boleh percaya `board_id` yang dikirim langsung dari body request.

---

## 2. Auth

### POST `/auth/register.php`
Akses: publik
Request:
```json
{
  "nama": "Hilmi",
  "email": "hilmi@example.com",
  "password": "12345678"
}
```
Response 201:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "nama": "Hilmi",
    "email": "hilmi@example.com",
    "is_verified": false
  },
  "message": "Registrasi berhasil, silakan cek email untuk verifikasi akun"
}
```
Response 409 (email sudah dipakai):
```json
{ "success": false, "message": "Email sudah terdaftar" }
```

> Setelah register, sistem mengirim email berisi link verifikasi (via PHPMailer + SMTP)
> dengan token yang **expired dalam 24 jam**.

### GET `/auth/verify.php`
Akses: publik
Query: `?token=abc123xyz`
Response 200:
```json
{ "success": true, "message": "Akun berhasil diverifikasi, silakan login" }
```
Response 400 (token invalid/expired):
```json
{ "success": false, "message": "Link verifikasi tidak valid atau sudah kedaluwarsa" }
```

### POST `/auth/resend_verification.php`
Akses: publik
Request:
```json
{ "email": "hilmi@example.com" }
```
Response 200:
```json
{ "success": true, "message": "Email verifikasi baru telah dikirim" }
```

### POST `/auth/login.php`
Akses: publik
Request:
```json
{
  "email": "hilmi@example.com",
  "password": "12345678"
}
```
Response 200:
```json
{
  "success": true,
  "data": {
    "token": "8f3a1c9d2e...",
    "expired_at": "2026-09-23T10:15:00Z",
    "user": {
      "id": 10,
      "nama": "Hilmi",
      "email": "hilmi@example.com"
    }
  },
  "message": "Login berhasil"
}
```
Response 401 (kredensial salah):
```json
{ "success": false, "message": "Email atau password salah" }
```
Response 403 (belum verifikasi):
```json
{ "success": false, "message": "Akun belum diverifikasi, silakan cek email kamu" }
```

> Token berlaku **7 hari flat** sejak diterbitkan (MVP). Setelah expired, user wajib login ulang.

### POST `/auth/logout.php`
Akses: user login
Response 200:
```json
{ "success": true, "message": "Logout berhasil" }
```

### POST `/auth/forgot_password.php`
Akses: publik
Request:
```json
{ "email": "hilmi@example.com" }
```
Response 200:
```json
{ "success": true, "message": "Link reset password telah dikirim ke email kamu" }
```

> Token reset **expired dalam 1 jam** (lebih ketat dari token verifikasi, karena lebih sensitif).

### POST `/auth/reset_password.php`
Akses: publik
Request:
```json
{
  "token": "def456uvw",
  "password_baru": "passwordBaru123"
}
```
Response 200:
```json
{ "success": true, "message": "Password berhasil diubah, silakan login" }
```
Response 400 (token invalid/expired):
```json
{ "success": false, "message": "Link reset password tidak valid atau sudah kedaluwarsa" }
```

### GET `/auth/me.php`
Akses: user login
Response 200:
```json
{
  "success": true,
  "data": {
    "id": 10,
    "nama": "Hilmi",
    "email": "hilmi@example.com",
    "is_verified": true
  }
}
```
Response 401 (token invalid/expired):
```json
{ "success": false, "message": "Sesi kamu berakhir, silakan login kembali" }
```

---

## 3. Board

### POST `/boards/create.php`
Akses: user login (pembuat otomatis jadi `owner`)
Request:
```json
{
  "nama": "Tugas Kuliah Semester 5",
  "deskripsi": "Board buat kelola tugas kelompok dan individu"
}
```
Response 201:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "nama": "Tugas Kuliah Semester 5",
    "deskripsi": "Board buat kelola tugas kelompok dan individu",
    "role": "owner",
    "created_at": "2026-09-16T09:00:00Z"
  },
  "message": "Board berhasil dibuat"
}
```

### GET `/boards/get_boards.php`
Akses: user login
Response 200: board milik user (owner) + board yang di-share ke user (member)
```json
{
  "success": true,
  "data": [
    { "id": 3, "nama": "Tugas Kuliah Semester 5", "deskripsi": "...", "role": "owner" },
    { "id": 7, "nama": "Project Freelance", "deskripsi": "...", "role": "editor" }
  ]
}
```

### GET `/boards/get_detail.php`
Akses: owner atau member board tsb
Query: `?board_id=3`
Response 200:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "nama": "Tugas Kuliah Semester 5",
    "deskripsi": "Board buat kelola tugas kelompok dan individu",
    "role": "owner",
    "created_at": "2026-09-16T09:00:00Z"
  }
}
```
Response 403 (bukan owner/member):
```json
{ "success": false, "message": "Kamu tidak punya akses ke board ini" }
```

### POST `/boards/update.php`
Akses: owner & editor
Request:
```json
{
  "board_id": 3,
  "nama": "Tugas Kuliah Semester 5 (Update)",
  "deskripsi": "Deskripsi baru"
}
```
Response 200:
```json
{ "success": true, "message": "Board berhasil diperbarui" }
```
Response 403 (role viewer):
```json
{ "success": false, "message": "Kamu tidak punya izin untuk mengubah board ini" }
```

### POST `/boards/delete.php` *(owner only)*
Request:
```json
{ "board_id": 3 }
```
Response 200:
```json
{ "success": true, "message": "Board berhasil dihapus" }
```
Response 403 (bukan owner):
```json
{ "success": false, "message": "Hanya pemilik board yang dapat menghapus board ini" }
```

### POST `/boards/invite_member.php` *(owner only)*
Request:
```json
{
  "board_id": 3,
  "email": "teman@example.com",
  "role": "editor"
}
```
`role` harus salah satu dari: `"editor"`, `"viewer"`.

Response 200:
```json
{
  "success": true,
  "data": {
    "user_id": 15,
    "nama": "Teman Satu",
    "email": "teman@example.com",
    "role": "editor"
  },
  "message": "Member berhasil ditambahkan ke board"
}
```
Response 404 (email belum terdaftar):
```json
{ "success": false, "message": "User dengan email ini belum terdaftar, minta dia daftar dulu" }
```
Response 403 (bukan owner):
```json
{ "success": false, "message": "Hanya pemilik board yang dapat mengundang member" }
```

### GET `/boards/get_members.php`
Akses: owner atau member board tsb
Query: `?board_id=3`
Response 200:
```json
{
  "success": true,
  "data": [
    { "user_id": 10, "nama": "Hilmi", "email": "hilmi@example.com", "role": "owner" },
    { "user_id": 15, "nama": "Teman Satu", "email": "teman@example.com", "role": "editor" }
  ]
}
```

### POST `/boards/remove_member.php` *(owner only)*
Request:
```json
{ "board_id": 3, "user_id": 15 }
```
Response 200:
```json
{ "success": true, "message": "Member berhasil dikeluarkan dari board" }
```

---

## 4. List

### POST `/lists/create.php`
Akses: owner & editor
Request:
```json
{ "board_id": 3, "nama_list": "To Do" }
```
Response 201:
```json
{
  "success": true,
  "data": { "id": 8, "board_id": 3, "nama_list": "To Do" },
  "message": "List berhasil dibuat"
}
```

### GET `/lists/get_lists.php`
Akses: owner atau member board tsb
Query: `?board_id=3`
Response 200: urut sesuai urutan dibuat
```json
{
  "success": true,
  "data": [
    { "id": 8, "nama_list": "To Do" },
    { "id": 9, "nama_list": "In Progress" },
    { "id": 10, "nama_list": "Done" }
  ]
}
```

### POST `/lists/update.php`
Akses: owner & editor
Request:
```json
{ "list_id": 8, "nama_list": "Backlog" }
```
Response 200:
```json
{ "success": true, "message": "List berhasil diperbarui" }
```

### POST `/lists/delete.php`
Akses: owner & editor
Request:
```json
{ "list_id": 8 }
```
Response 200:
```json
{ "success": true, "message": "List dan semua card di dalamnya berhasil dihapus" }
```

> Frontend wajib menampilkan konfirmasi peringatan dulu ("list ini masih berisi X card,
> yakin ingin menghapus?") sebelum memanggil endpoint ini — backend langsung melakukan
> cascade delete tanpa konfirmasi ulang.

---

## 5. Card

### POST `/cards/create.php`
Akses: owner & editor
Request:
```json
{
  "list_id": 8,
  "judul": "Kerjakan laporan praktikum",
  "deskripsi": "Bab 1-3, deadline sebelum UTS",
  "deadline": "2026-09-30"
}
```
`deadline` **wajib diisi**.

Response 201:
```json
{
  "success": true,
  "data": {
    "id": 22,
    "list_id": 8,
    "judul": "Kerjakan laporan praktikum",
    "deskripsi": "Bab 1-3, deadline sebelum UTS",
    "deadline": "2026-09-30",
    "position": 1
  },
  "message": "Card berhasil dibuat"
}
```

### GET `/cards/get_cards.php`
Akses: owner atau member board tsb
Query: `?list_id=8`
Response 200: urut berdasarkan `position`
```json
{
  "success": true,
  "data": [
    { "id": 22, "judul": "Kerjakan laporan praktikum", "deadline": "2026-09-30", "position": 1 },
    { "id": 23, "judul": "Review PR teman", "deadline": "2026-09-20", "position": 2 }
  ]
}
```

### POST `/cards/update.php`
Akses: owner & editor
Request (partial update, field yang tidak dikirim tidak berubah):
```json
{
  "card_id": 22,
  "deadline": "2026-10-05"
}
```
Response 200:
```json
{ "success": true, "message": "Card berhasil diperbarui" }
```

### POST `/cards/delete.php`
Akses: owner & editor
Request:
```json
{ "card_id": 22 }
```
Response 200:
```json
{ "success": true, "message": "Card berhasil dihapus" }
```

### POST `/cards/move_list.php`
Akses: owner & editor
Request:
```json
{ "card_id": 22, "arah": "right" }
```
`arah` harus salah satu dari: `"left"`, `"right"`. Backend yang menentukan list tujuan
berdasarkan urutan list dalam board (bukan `list_id` tujuan dari frontend).

Response 200:
```json
{
  "success": true,
  "data": { "card_id": 22, "list_id_baru": 9 },
  "message": "Card berhasil dipindahkan"
}
```
Response 400 (sudah di list paling kiri/kanan):
```json
{ "success": false, "message": "Card sudah berada di list paling akhir" }
```

### POST `/cards/reorder.php`
Akses: owner & editor
Request:
```json
{ "card_id": 22, "arah": "up" }
```
`arah` harus salah satu dari: `"up"`, `"down"`. Backend menukar (`swap`) nilai `position`
dengan card tetangga dalam list yang sama menggunakan database transaction.

Response 200:
```json
{ "success": true, "message": "Urutan card berhasil diperbarui" }
```
Response 400 (sudah di posisi paling atas/bawah):
```json
{ "success": false, "message": "Card sudah berada di posisi paling atas" }
```

---

## 6. Catatan Penting Buat Kolaborasi

- Semua field nama pakai `snake_case` (contoh: `board_id`, bukan `boardId`)
- Semua tanggal pakai format ISO 8601
- Endpoint dengan tanda **(owner only)** atau **(owner & editor)** wajib dicek role-nya di
  backend, bukan cuma disembunyikan tombolnya di frontend
- Role itu **per-board**, jadi setiap endpoint yang butuh cek role harus tau board mana
  yang sedang diakses — untuk endpoint yang cuma terima `list_id`/`card_id`, backend wajib
  query ulang untuk menemukan `board_id` yang sebenarnya sebelum cek role
- Kalau ada perubahan struktur endpoint, update file ini dulu sebelum ubah kode
- Frontend bisa pakai data dummy sesuai format `data` di atas sebelum backend selesai

## 7. Hal yang Masih Perlu Didiskusikan
- Struktur tabel `tokens` final (kolom apa saja selain `token`, `user_id`, `expired_at`)
  akan ditentukan saat setup database
- Konfigurasi SMTP (pilih Mailtrap untuk testing, atau langsung Gmail SMTP) — dibahas saat
  setup PHPMailer
- Format `deadline`: tanggal saja (`YYYY-MM-DD`) atau lengkap dengan jam? — masih perlu
  dipastikan saat implementasi form di frontend

---

*Dokumen ini adalah living document — update terus seiring project berjalan. Lihat juga
`FUNCTIONAL_REQUIREMENTS.md`.*
