const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isAuth, hasRole } = require('../middlewares/auth');

router.use(isAuth, hasRole(['PEMINJAM']));

router.get('/', async (req, res) => {
  const userLoans = await prisma.loan.count({ where: { userId: req.session.user.id } });
  const activeLoans = await prisma.loan.count({ where: { userId: req.session.user.id, status: 'DIPINJAM' } });
  
  // Hitung total denda
  const dendaLoans = await prisma.loan.findMany({ 
    where: { userId: req.session.user.id, denda: { gt: 0 } }
  });
  const totalDenda = dendaLoans.reduce((acc, curr) => acc + curr.denda, 0);

  res.render('peminjam/dashboard', { 
    title: 'Dashboard Peminjam',
    userLoans, activeLoans, totalDenda
  });
});

router.get('/books', async (req, res) => {
  const query = req.query.q || '';
  const books = await prisma.book.findMany({
    where: {
      OR: [
        { judul: { contains: query } },
        { pengarang: { contains: query } }
      ]
    },
    include: { category: true }
  });
  res.render('peminjam/books', { title: 'Katalog Buku', books, query });
});

router.post('/books/borrow/:id', async (req, res) => {
  const bookId = parseInt(req.params.id);
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  
  if (book && book.stok > 0) {
    const today = new Date();
    await prisma.loan.create({
      data: {
        userId: req.session.user.id,
        bookId: book.id,
        tglPinjam: today,
        tglJatuhTempo: new Date(new Date().setDate(today.getDate() + 7)),
        status: 'PENDING'
      }
    });
    req.session.success = 'Pengajuan peminjaman berhasil, menunggu persetujuan petugas.';
  } else {
    req.session.error = 'Buku tidak tersedia atau stok habis.';
  }
  res.redirect('/peminjam/books');
});

router.get('/history', async (req, res) => {
  const loans = await prisma.loan.findMany({
    where: { userId: req.session.user.id },
    include: { book: true, petugas: true },
    orderBy: { tglPinjam: 'desc' }
  });
  res.render('peminjam/history', { title: 'Riwayat Peminjaman', loans });
});

module.exports = router;
