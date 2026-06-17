const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const corsOptions = require("./config/corsConfig");
const authRoutes = require("./routes/auth.routes");
const productosRoutes = require("./routes/productos.routes");
const meRoutes = require("./routes/me.routes");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const infoLog = fs.createWriteStream(
    path.join(__dirname, "logg.log"),
    { flags: "a" }
);
app.use(morgan("combined", { stream: infoLog }));

app.use(authRoutes);
app.use(productosRoutes);
app.use(meRoutes);

module.exports = app;
