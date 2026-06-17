const jwt = require("jsonwebtoken");
const tokenConfig = require("../config/tokenConfig");


module.exports = (req, res, next) => {
    const token = req.headers["authorization"];
    if (!token) return res.status(401).json({ message: "Token Requerido" });

    jwt.verify(token.split(" ")[1], tokenConfig.SECRET_KEY, (err,decoded) => {
			if (err) {
				if (err.name === 'TokenExpiredError') {
					return res.status(401).json({ message: "Token Expirado" })
				}
				return res.status(401).json({message:"Token Invalido"})
			}
			req.user = decoded //guardamos la informacion del usuario en el request
			next()
		})
};