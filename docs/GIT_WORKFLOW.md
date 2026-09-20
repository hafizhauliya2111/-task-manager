# GIT WORKFLOW — Task Manager

> Panduan ini berlaku untuk SEMUA kontributor (backend maupun frontend).
> Branch `main` sudah dikunci pakai **branch protection** — push langsung ke `main`
> akan DITOLAK oleh GitHub. Semua perubahan wajib lewat Pull Request (PR).

---

## 1. Clone Repo (dilakukan sekali di awal)

```bash
git clone https://github.com/USERNAME/task-manager.git
cd task-manager
```

Ganti `USERNAME` sesuai pemilik repo. Kalau sudah pernah clone sebelumnya, cukup lanjut ke langkah 2.

---

## 2. Sebelum Mulai Kerja Hari Ini — Selalu Update `main` Dulu

Ini penting dilakukan **setiap kali mau mulai kerja baru**, supaya branch kamu dimulai dari
kode paling terbaru (menghindari conflict yang tidak perlu).

```bash
git checkout main
git pull origin main
```

---

## 3. Buat Branch Baru untuk Kerjaan Kamu

**JANGAN PERNAH** kerja langsung di branch `main` — selain karena akan ditolak GitHub saat push,
ini juga best practice supaya kerjaan yang belum selesai/belum ditest tidak tercampur ke kode utama.

Pola penamaan branch:
- `feature/nama-fitur` — untuk menambah fitur/hal baru (contoh: `feature/login-page`, `feature/board-ui`)
- `fix/nama-bug` — untuk memperbaiki bug (contoh: `fix/tombol-delete-error`)

```bash
git checkout -b feature/nama-fitur-kamu
```

Perintah ini otomatis membuat branch baru SEKALIGUS berpindah ke branch itu.

---

## 4. Kerja Seperti Biasa

Edit/tambah file seperlunya di editor (VS Code, dll) sesuai kerjaan kamu.

---

## 5. Cek Perubahan Sebelum Commit

**Selalu jalankan ini dulu** sebelum `git add`, supaya kamu tahu persis file apa saja yang
akan ikut ter-commit (menghindari ikut nge-commit file yang tidak seharusnya, misal file
config berisi kredensial pribadi).

```bash
git status
```

---

## 6. Add & Commit

```bash
git add .
git commit -m "Deskripsi singkat perubahan kamu"
```

Contoh pesan commit yang baik: `"Add halaman login dan validasi form"`,
bukan sekadar `"update"` atau `"fix"` tanpa konteks.

---

## 7. Push Branch ke GitHub

```bash
git push -u origin feature/nama-fitur-kamu
```

> Catatan: push ke branch selain `main` TIDAK akan diblokir branch protection.
> Yang diblokir HANYA push langsung ke `main`.

Kalau ini kali pertama branch itu di-push, wajib pakai `-u origin nama-branch` (supaya
git "mengingat" branch remote yang dituju). Untuk push berikutnya di branch yang sama,
cukup `git push`.

---

## 8. Buat Pull Request (PR) di GitHub

1. Buka repo di github.com — biasanya muncul notifikasi kuning "Compare & pull request"
   untuk branch yang baru saja di-push. Klik itu.
2. Kalau notifikasi tidak muncul: buka tab **Pull Requests** → **New pull request** →
   pastikan `base: main` dan `compare: feature/nama-fitur-kamu`.
3. Beri judul & deskripsi singkat PR-nya, lalu klik **Create pull request**.

---

## 9. Review & Merge

- Untuk tim kecil (berdua), boleh saling cek PR satu sama lain sebelum merge, atau merge
  sendiri kalau sudah yakin kodenya benar dan sudah ditest.
- Klik **Merge pull request** di GitHub setelah siap.

---

## 10. Update `main` Lokal Setelah Merge

Setelah PR ter-merge, branch `main` di GitHub sudah berisi kode terbaru. Sinkronkan juga
ke laptop kamu:

```bash
git checkout main
git pull origin main
```

Branch fitur yang sudah di-merge boleh dihapus (opsional, tidak wajib):
```bash
git branch -d feature/nama-fitur-kamu
```

---

## Ringkasan Alur (Setiap Kali Mulai Kerjaan Baru)

```
git checkout main
git pull origin main
git checkout -b feature/nama-fitur-baru
   ... kerja ...
git status
git add .
git commit -m "pesan commit"
git push -u origin feature/nama-fitur-baru
   ... buat PR di GitHub, merge ...
git checkout main
git pull origin main
```

---

## Kenapa Push Langsung ke `main` Ditolak?

Branch protection sengaja diaktifkan supaya tidak ada perubahan yang masuk ke `main`
tanpa lewat Pull Request — ini mencegah insiden seperti kode yang belum siap/belum
ditest tercampur ke kode utama tanpa sengaja. Kalau ada error "protected branch" saat
push, itu tandanya kamu sedang mencoba push langsung ke `main` — solusinya, ikuti alur
di atas: buat branch baru dulu, baru push dari situ.
