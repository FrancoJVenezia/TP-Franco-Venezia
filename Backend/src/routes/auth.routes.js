const express = require("express");
const jwt = require("jsonwebtoken");
const users = require("../data/usuarios");
const tokenConfig = require("../config/tokenConfig");
const loginLimiter = require("../middleware/loginRateLimit");

const router = express.Router();

// base de datos de refresh tokens validos
let refreshTokens = [];

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None", // front 8080 y back 3443
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
};

//Post de logueo(generamos un token)
router.post("/login", loginLimiter, (req,res)=>{

    const { username, password } = req.body;

    const normalizedUsername = typeof username === 'string' ? username.trim() : username;
    const normalizedPassword = typeof password === 'string' ? password.trim() : password;

    if(!normalizedUsername || typeof normalizedUsername !== 'string' || normalizedUsername.length < 4 || normalizedUsername.length > 50) {
      console.error("Error. Tiene que ingresar un nombre de usuario valido.");
      return res.status(400).json({ message:"Error. Tiene que ingresar un nombre de usuario valido." });
    }

    if(!normalizedPassword || typeof normalizedPassword !== 'string' || normalizedPassword.length < 4 || normalizedPassword.length > 30) {
      console.error("Error. Tiene que ingresar una contraseña valida.");
      return res.status(400).json({ message:"Error. Tiene que ingresar una contraseña valida." });
    }

    for(let i = 0; i < users.length; i++) {
      const user = users[i];

      if (normalizedUsername == user.username && normalizedPassword == user.password){
        const payload = { id: user.id, role: user.role, username: user.username, name: user.name };

        const accessToken = jwt.sign(payload, tokenConfig.SECRET_KEY, { expiresIn: tokenConfig.expiresIn });
        const refreshToken = jwt.sign(payload, tokenConfig.REFRESH_SECRET_KEY, { expiresIn: tokenConfig.refreshExpiresIn });

        refreshTokens.push(refreshToken);
        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        console.log(`[POST] login. Se ha iniciado sesion correctamente, ${user.name} (${user.role})`);
        return res.json({ accessToken })
      }
    }

    res.status(401).json({ message:"Credenciales Incorrectas" })

});

router.post("/refresh-token", (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No autorizado" });

    if (!refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Refresh Token inválido" });
    }

    jwt.verify(refreshToken, tokenConfig.REFRESH_SECRET_KEY, (err, decoded) => {
      if (err) {
        refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
        return res.status(403).json({ message: "Refresh Token inválido" });
      }

      const accessToken = jwt.sign(
        { id: decoded.id, role: decoded.role, username: decoded.username, name: decoded.name },
        tokenConfig.SECRET_KEY,
        { expiresIn: tokenConfig.expiresIn }
      );
      res.json({ accessToken });
    });
});


router.post("/logout", (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    });

    res.json({ message: "Sesión cerrada" });
});


module.exports = router;
