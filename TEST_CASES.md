# Skenario Pengujian Sistem (TEST_CASES.md)

Berikut adalah 5 skenario pengujian wajib untuk Sistem Perpustakaan Digital (E-Library):

## 1. Pengujian Login Multi-Role
- **Langkah**: 
  1. Buka halaman login.
  2. Gunakan akun Admin (admin/password123), Petugas (petugas/password123), dan Peminjam (peminjam/password123).
- **Ekspektasi**: 
  - Masing-masing role berhasil login dan diarahkan ke dashboard masing-masing.
  - Menu navigasi pada sidebar menyesuaikan hak akses (misal, admin melihat menu kelola user, siswa hanya melihat katalog dan riwayat pinjam).

## 2. Pengajuan Peminjaman Buku oleh Siswa
- **Langkah**:
  1. Login sebagai Siswa/Peminjam.
  2. Masuk ke menu Katalog Buku.
  3. Cari buku dan klik tombol "Pinjam Buku" untuk mengajukan peminjaman.
- **Ekspektasi**:
  - Peminjaman tercatat dengan status "PENDING".
  - Notifikasi berhasil muncul di layar peminjam.

## 3. Persetujuan Peminjaman oleh Petugas (Approval)
- **Langkah**:
  1. Login sebagai Petugas.
  2. Buka menu "Peminjaman" -> tab "Pending/Menunggu Persetujuan".
  3. Klik tombol "Setujui" pada permohonan siswa sebelumnya.
- **Ekspektasi**:
  - Status peminjaman berubah dari "PENDING" menjadi "DIPINJAM".
  - Stok fisik buku di database otomatis berkurang 1 unit.

## 4. Pengembalian Buku & Perhitungan Denda Keterlambatan
- **Langkah**:
  1. Login sebagai Petugas.
  2. Buka menu "Peminjaman" (Buku yang sedang dipinjam).
  3. Cari peminjaman yang melewati batas jatuh tempo (dapat disimulasikan melalui seed data atau mengubah tanggal di database).
  4. Klik tombol "Proses Pengembalian".
- **Ekspektasi**:
  - Status peminjaman menjadi "KEMBALI".
  - Denda dihitung otomatis berdasarkan jumlah hari keterlambatan dikali tarif denda (misal Rp 1.000/hari).
  - Stok buku otomatis bertambah 1 unit.

## 5. Pengujian Keamanan Role-Based Access Control (RBAC)
- **Langkah**:
  1. Login sebagai Siswa/Peminjam.
  2. Coba akses rute URL khusus Admin (misal: `/admin/users` atau `/admin/logs`) langsung di address bar browser.
  3. Coba akses rute khusus Petugas (misal: `/petugas/loans`).
- **Ekspektasi**:
  - Sistem menolak akses dan menampilkan halaman 403 Forbidden atau meredirect ke dashboard siswa.
  - User tidak dapat melihat atau mengeksekusi fungsi di luar hak aksesnya.
