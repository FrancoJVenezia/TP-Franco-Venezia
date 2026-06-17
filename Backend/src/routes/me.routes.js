const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const usuarios = require("../data/usuarios");

router.get('/me', verifyToken, (req, res) => {
  const userId = req.user.id;

  for(let i = 0; i < usuarios.length; i++) {
    const usuario = usuarios[i];
    if (usuario.id === userId) {
      // no le mandamos la contraseña al front
      const { password, ...safeUser } = usuario;
      return res.json(safeUser);
    }
  }
  res.status(400).json({ message: "Error. El usuario no existe en la base de datos." });
});

module.exports = router;
