const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: "¡Demasiadas peticiones, intente de nuevo más tarde!"
});