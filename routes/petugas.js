const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isAuth, hasRole } = require('../middlewares/auth');

router.use(isAuth, hasRole(['PETUGAS', 'ADMIN'])); // Admin can also access if needed, but let's restrict to PETUGAS as per route or allow both? Just PETUGAS is fine for now.

router.get('/', async (req, res) => {
  const pendingLoans = await prisma.loan.count({ where: { status: 'PENDING' } });
  const activeLoans = await prisma.loan.count({ where: { status: 'DIPINJAM' } });
  res.render('petugas/dashboard', { 
    title: 'Dashboard Petugas',
    pendingLoans, activeLoans 
  });
});

// Categories
router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.render('petugas/categories', { title: 'Kategori & Rak', categories });
});
router.post('/categories', async (req, res) => {
  const { namaKategori, kodeRak } = req.body;
  await prisma.category.create({ data: { namaKategori, kodeRak } });
  res.redirect('/petugas/categories');
});

// Books
router.get('/books', async (req, res) => {
  const books = await prisma.book.findMany({ include: { category: true } });
  const categories = await prisma.category.findMany();
  res.render('petugas/books', { title: 'Katalog Buku', books, categories });
});
router.post('/books', async (req, res) => {
  const { judul, pengarang, penerbit, tahun, isbn, stok, categoryId } = req.body;
  await prisma.book.create({
    data: { judul, pengarang, penerbit, tahun, isbn, stok: parseInt(stok), categoryId: parseInt(categoryId) }
  });
  req.session.success = 'Buku berhasil ditambahkan.';
  res.redirect('/petugas/books');
});
router.post('/books/delete/:id', async (req, res) => {
  await prisma.book.delete({ where: { id: parseInt(req.params.id) } });
  req.session.success = 'Buku berhasil dihapus.';
  res.redirect('/petugas/books');
});

// Loans Management (Approval & Pengembalian)
router.get('/loans', async (req, res) => {
  const loans = await prisma.loan.findMany({
    include: { user: true, book: true, petugas: true },
    orderBy: { tglPinjam: 'desc' }
  });
  res.render('petugas/loans', { title: 'Kelola Peminjaman', loans });
});

router.post('/loans/approve/:id', async (req, res) => {
  const loanId = parseInt(req.params.id);
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { book: true } });
  
  if (loan && loan.status === 'PENDING' && loan.book.stok > 0) {
    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: { status: 'DIPINJAM', petugasId: req.session.user.id }
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { stok: loan.book.stok - 1 }
      })
    ]);
    req.session.success = 'Peminjaman disetujui.';
  } else {
    req.session.error = 'Gagal menyetujui, stok mungkin habis.';
  }
  res.redirect('/petugas/loans');
});

router.post('/loans/return/:id', async (req, res) => {
  const loanId = parseInt(req.params.id);
  const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { book: true } });
  
  if (loan && loan.status === 'DIPINJAM') {
    const tglKembali = new Date();
    let denda = 0;
    
    // Hitung denda jika terlambat
    if (tglKembali > loan.tglJatuhTempo) {
      const diffTime = Math.abs(tglKembali - loan.tglJatuhTempo);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      denda = diffDays * 1000; // Rp 1000 per hari
    }

    await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: { status: 'KEMBALI', tglKembali, denda }
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { stok: loan.book.stok + 1 }
      })
    ]);
    req.session.success = `Buku dikembalikan. Denda: Rp ${denda}`;
  }
  res.redirect('/petugas/loans');
});

// Laporan
router.get('/reports', async (req, res) => {
  const loans = await prisma.loan.findMany({
    include: { user: true, book: true },
    orderBy: { tglPinjam: 'desc' }
  });
  res.render('petugas/reports', { title: 'Laporan Bulanan', loans });
});

module.exports = router;
