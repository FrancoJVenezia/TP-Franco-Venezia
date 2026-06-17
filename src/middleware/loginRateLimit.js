const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
  windowMs: 10*60*1000, //10 minutos
  max: 10,
  message: "¡Demasiadas peticiones, intente de nuevo más tarde!"
});