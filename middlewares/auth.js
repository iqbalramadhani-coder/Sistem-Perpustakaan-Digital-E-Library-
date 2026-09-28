function isAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }
  req.session.error = 'Silakan login terlebih dahulu.';
  res.redirect('/auth/login');
}

function hasRole(roles) {
  return (req, res, next) => {
    if (req.session.user && roles.includes(req.session.user.role)) {
      return next();
    }
    res.status(403).render('403', { message: 'Akses Ditolak: Anda tidak memiliki hak akses untuk halaman ini.' });
  };
}

module.exports = {
  isAuth,
  hasRole
};
