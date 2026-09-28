const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Users
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: passwordHash,
      nama: 'Administrator',
      role: 'ADMIN',
    },
  });

  const petugas = await prisma.user.upsert({
    where: { username: 'petugas' },
    update: {},
    create: {
      username: 'petugas',
      password: passwordHash,
      nama: 'Petugas Perpus',
      role: 'PETUGAS',
    },
  });

  const peminjam = await prisma.user.upsert({
    where: { username: 'peminjam' },
    update: {},
    create: {
      username: 'peminjam',
      password: passwordHash,
      nama: 'Siswa Teladan',
      role: 'PEMINJAM',
      nisn: '1234567890',
      telepon: '081234567890'
    },
  });

  // Seed Categories
  const cat1 = await prisma.category.create({
    data: {
      namaKategori: 'Sains & Teknologi',
      kodeRak: 'A-01'
    }
  });

  const cat2 = await prisma.category.create({
    data: {
      namaKategori: 'Fiksi & Sastra',
      kodeRak: 'B-01'
    }
  });

  // Seed Books
  const book1 = await prisma.book.create({
    data: {
      judul: 'Belajar Node.js dari Nol',
      pengarang: 'John Doe',
      penerbit: 'TechPress',
      tahun: '2023',
      isbn: '978-602-123-456-7',
      stok: 5,
      categoryId: cat1.id
    }
  });

  const book2 = await prisma.book.create({
    data: {
      judul: 'Laskar Pelangi',
      pengarang: 'Andrea Hirata',
      penerbit: 'Bentang Pustaka',
      tahun: '2005',
      isbn: '979-3062-79-7',
      stok: 10,
      categoryId: cat2.id
    }
  });

  // Seed Loans (1 Pending, 1 Dipinjam, 1 Kembali, 1 Overdue)
  const today = new Date();
  
  // Pending
  await prisma.loan.create({
    data: {
      userId: peminjam.id,
      bookId: book1.id,
      tglPinjam: new Date(),
      tglJatuhTempo: new Date(new Date().setDate(today.getDate() + 7)),
      status: 'PENDING'
    }
  });

  // Dipinjam
  await prisma.loan.create({
    data: {
      userId: peminjam.id,
      bookId: book2.id,
      tglPinjam: new Date(new Date().setDate(today.getDate() - 2)),
      tglJatuhTempo: new Date(new Date().setDate(today.getDate() + 5)),
      status: 'DIPINJAM',
      petugasId: petugas.id
    }
  });
  
  // Overdue (untuk test denda)
  await prisma.loan.create({
    data: {
      userId: peminjam.id,
      bookId: book1.id,
      tglPinjam: new Date(new Date().setDate(today.getDate() - 15)),
      tglJatuhTempo: new Date(new Date().setDate(today.getDate() - 8)),
      status: 'DIPINJAM',
      petugasId: petugas.id
    }
  });

  console.log('Seed database berhasil!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
