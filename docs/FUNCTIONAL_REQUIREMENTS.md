# FUNCTIONAL REQUIREMENTS — Task Manager

> Aplikasi manajemen tugas/project bergaya Trello (board - list/kolom - card)
> Stack: PHP native + MySQL (backend), HTML/CSS/Vanilla JS (frontend)
> Kolaborasi 2 orang: backend + frontend

## 1. Ringkasan Project

- **Nama project**: Task Manager
- **Target pengguna**: Publik — siapa saja bisa self-register
- **Model kepemilikan data**: Setiap Board dimiliki oleh 1 user (Owner). User lain hanya bisa
  mengakses board tertentu jika di-invite sebagai member (Viewer/Editor).
- **Motivasi project**: latihan teknis (relasi antar tabel lebih kompleks, permission/role),
  kebutuhan pribadi (kelola tugas berdua), sekaligus portfolio.

## 2. Module Auth

### 2.1 Register
- Field: email, password, nama
- Setelah register, akun berstatus **belum terverifikasi** (`is_verified = 0`)
- Sistem mengirim **email verifikasi asli** (via PHPMailer + SMTP) berisi link dengan token
- Token verifikasi **memiliki masa berlaku** (expired setelah durasi tertentu, mis. 24 jam)
- Tersedia endpoint **resend verification email** jika token expired atau email belum diterima

### 2.2 Verifikasi Email
- User klik link di email → token divalidasi → jika valid & belum expired, `is_verified` diubah jadi 1
- Jika token expired/invalid → beri pesan jelas, arahkan user untuk resend

### 2.3 Login
- Input: email, password
- **Login ditolak** jika akun belum verified — pesan jelas ("akun belum diverifikasi, cek email kamu")
- Autentikasi menggunakan **token custom** (bukan session PHP)
  - Token disimpan di tabel `tokens` (kolom: token, user_id, expired_at)
  - Setiap request ke endpoint yang butuh login wajib menyertakan header `Authorization: Bearer <token>`
- **Masa berlaku token**: 7 hari flat (MVP). Expired total setelah 7 hari sejak diterbitkan.
  - *(Catatan v1.5: upgrade ke sliding expiration — token diperpanjang otomatis selama aktif dipakai)*
- Rate limiting brute force login → **ditunda ke v2**

### 2.4 Logout
- Invalidate token yang sedang dipakai (hapus/tandai token tidak valid di tabel `tokens`)

### 2.5 Reset Password
- User request via email → sistem generate token reset, kirim link ke email
- Token reset **memiliki masa berlaku** (lebih ketat dari verification, mis. 1 jam)
- User klik link → input password baru → password diupdate
- Auto-logout semua sesi lain setelah reset berhasil → **tidak diimplementasikan (skip)**

## 3. Module Board

### 3.1 CRUD Board
- Create: nama board + deskripsi
- Get list board: menampilkan board yang dimiliki user (owner) **dan** board yang di-share ke user (member)
- Get detail board: cek akses — user harus owner ATAU member board tsb, jika tidak → 403
- Update board (nama/deskripsi): boleh dilakukan Owner dan Editor, Viewer tidak boleh
- Delete board: **hak eksklusif Owner** — Editor tidak boleh menghapus board

### 3.2 Sharing / Invite Member
- Mekanisme: **by email** (bukan invite link)
  - Owner input email + pilih role (Viewer/Editor)
  - Jika email terdaftar → langsung jadi member board dengan role tsb
  - Jika email belum terdaftar → tampilkan pesan "user belum terdaftar, minta daftar dulu"
- **Hak invite adalah eksklusif Owner** — Editor tidak boleh invite member baru
- Tersedia fitur **get_members**: menampilkan daftar member beserta role-nya
- Tersedia fitur **remove_member**: Owner bisa mencabut akses member (kick), Editor tidak boleh

### 3.3 Role & Permission
| Role | Ubah isi (list/card) | Invite member | Delete board | Remove member |
|---|---|---|---|---|
| Owner | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ❌ | ❌ | ❌ |
| Viewer | ❌ (read-only) | ❌ | ❌ | ❌ |

*(Catatan v2: mekanisme invite via link — 2 jenis link (Viewer/Editor), berlaku sampai di-revoke oleh Owner)*

## 4. Module List

- CRUD list dalam sebuah board (create, get, update nama, delete)
- Permission list **mengikuti permission board induknya** (tidak ada permission terpisah)
- **Urutan list**: fixed sesuai urutan dibuat (tidak ada reorder manual untuk list)
- **Delete list yang masih berisi card**:
  - Frontend menampilkan konfirmasi peringatan dulu ("list ini masih berisi X card, yakin ingin menghapus?")
  - Jika user konfirmasi ("Yes") → backend melakukan cascade delete (list + semua card di dalamnya)

## 5. Module Card

- CRUD card dalam sebuah list: judul, deskripsi, **deadline (wajib diisi, bisa diedit/diperpanjang belakangan)**
- Permission card mengikuti permission board (via list → board)
- **Urutan card dalam 1 list**: manual, menggunakan kolom `position`
  - Reorder dilakukan lewat tombol naik/turun (swap position dengan card tetangga)
- **Pindah antar list ("pindah kolom")**: menggunakan tombol panah kiri/kanan (bukan drag & drop)
  - Kiri = pindah ke list dengan urutan sebelumnya, Kanan = pindah ke list urutan berikutnya
  - Tombol otomatis disable jika sudah di list paling kiri/kanan

## 6. Fitur yang Ditunda ke v2 (Backlog)

- Drag & drop card antar list
- Field tambahan pada card: assignee, label/tag warna, checklist item
- Reminder/notifikasi deadline (butuh cron job/scheduled task)
- Invite member via link (2 jenis link + revoke)
- Rate limiting brute force login
- Sliding token expiration (perpanjang otomatis token selama aktif dipakai)

## 7. Konvensi Teknis (disepakati, berlaku juga untuk API Contract)

- Response API konsisten:
  ```json
  // sukses
  { "success": true, "data": { ... } }
  // error
  { "success": false, "message": "..." }
  ```
- Autentikasi via header: `Authorization: Bearer <token>`
- **HTTP status code dipakai secara disiplin** (200, 201, 400, 401, 403, 404, 500) —
  bukan asal 200 semua seperti myretail. Khususnya:
  - `401` = belum login / token invalid
  - `403` = sudah login, tapi tidak punya akses (bukan owner/member board tsb)
- Prinsip keamanan penting: **jangan pernah percaya data permission (mis. board_id) yang
  dikirim langsung dari client**. Selalu query ulang dari database berdasarkan ID resource
  yang diberikan (mis. dari `list_id`, cari tahu `board_id` sebenarnya di database),
  baru cek permission dari situ.
