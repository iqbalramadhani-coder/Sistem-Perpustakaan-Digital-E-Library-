const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isAuth, hasRole } = require('../middlewares/auth');
const bcrypt = require('bcryptjs');

router.use(isAuth, hasRole(['ADMIN']));

router.get('/', async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalBooks = await prisma.book.count();
  const totalLoans = await prisma.loan.count();
  const recentLogs = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  res.render('admin/dashboard', { 
    title: 'Dashboard Admin',
    totalUsers, totalBooks, totalLoans, recentLogs 
  });
});

// CRUD Users
router.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.render('admin/users', { title: 'Kelola Pengguna', users });
});

router.post('/users', async (req, res) => {
  const { username, password, nama, role, nisn, telepon } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { username, password: hashedPassword, nama, role, nisn, telepon }
    });
    req.session.success = 'Pengguna berhasil ditambahkan.';
  } catch (error) {
    req.session.error = 'Gagal menambahkan pengguna.';
  }
  res.redirect('/admin/users');
});

router.post('/users/delete/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    req.session.success = 'Pengguna berhasil dihapus.';
  } catch (error) {
    req.session.error = 'Gagal menghapus pengguna.';
  }
  res.redirect('/admin/users');
});

// CRUD Categories & Rak (Shared with Petugas, but handled here for Admin)
router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany();
  res.render('admin/categories', { title: 'Kategori & Rak', categories });
});

router.post('/categories', async (req, res) => {
  const { namaKategori, kodeRak } = req.body;
  try {
    await prisma.category.create({ data: { namaKategori, kodeRak } });
    req.session.success = 'Kategori berhasil ditambahkan.';
  } catch (error) {
    req.session.error = 'Gagal menambahkan kategori.';
  }
  res.redirect('/admin/categories');
});

// Audit Log
router.get('/logs', async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });
  res.render('admin/logs', { title: 'Audit Log', logs });
});

// Books (Basic view for Admin)
router.get('/books', async (req, res) => {
  const books = await prisma.book.findMany({ include: { category: true } });
  const categories = await prisma.category.findMany();
  res.render('admin/books', { title: 'Katalog Buku', books, categories });
});

module.exports = router;
