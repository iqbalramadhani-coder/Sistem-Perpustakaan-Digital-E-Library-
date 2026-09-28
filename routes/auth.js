const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login');
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      req.session.error = 'Username atau password salah.';
      return res.redirect('/auth/login');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.session.error = 'Username atau password salah.';
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role
    };

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        aksi: 'LOGIN',
        keterangan: 'User berhasil login'
      }
    });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.session.error = 'Terjadi kesalahan sistem.';
    res.redirect('/auth/login');
  }
});

router.get('/logout', async (req, res) => {
  if (req.session.user) {
    try {
      await prisma.activityLog.create({
        data: {
          userId: req.session.user.id,
          aksi: 'LOGOUT',
          keterangan: 'User logout'
        }
      });
    } catch (e) {
      console.error(e);
    }
  }
  req.session.destroy((err) => {
    res.redirect('/auth/login');
  });
});

module.exports = router;
