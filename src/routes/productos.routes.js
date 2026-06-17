const express = require("express");
const verifyToken = require("../middleware/auth");
const authorizationRole = require("../middleware/roles");
const { body, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");
const products = require("../data/productos");

const router = express.Router();

router.get('/productos', (req, res) => {
	console.log("[GET] Productos:", products)
	res.json(products)
});

router.post('/productos', body("name").isString().trim(), body(["price", "stock"]).isNumeric(), verifyToken, authorizationRole(["ADMIN"]), (req, res) => {
  const { name, price, stock } = req.body;
  const hasPrice = price !== null && price !== undefined;
  const hasStock = stock !== null && stock !== undefined;

  const sanitizedName = typeof name === "string"
    ? sanitizeHtml(name).trim()
    : "";

  if(!sanitizedName || sanitizedName.length < 4 || sanitizedName.length > 50) {
    console.error("Error. Tiene que ingresar un nombre de producto válido.");
    return res.status(400).json({ message:"Error. Tiene que ingresar un nombre de producto válido." });
  }

  if(!/^[\p{L}\p{N}\s.,-]+$/u.test(sanitizedName)) {
    console.error("Error. El nombre del producto contiene caracteres inválidos.");
    return res.status(400).json({ message:"Error. El nombre del producto contiene caracteres inválidos." });
  }

  if(!hasPrice) {
    console.error("Error. Se requiere un precio obligatoriamente.");
    return res.status(400).json({ message:"Error. Se requiere un precio obligatoriamente." });
  }

  if(!hasStock) {
    console.error("Error. Se requiere un stock obligatoriamente.");
    return res.status(400).json({ message:"Error. Se requiere un stock obligatoriamente." });
  }

  if(hasPrice && (typeof price !== 'number' || price <= 0)) {
    console.error("Error. Tiene que ingresar un precio valido.");
    return res.status(400).json({ message:"Error. Tiene que ingresar un precio valido." });
  }

  if(hasStock && (typeof stock !== 'number' || stock <= 0)) {
    console.error("Error. El nuevo producto tiene que tener stock.");
    return res.status(400).json({ message:"Error. El nuevo producto tiene que tener stock." });
  }


	const newProduct = {
		id: products.length + 1,
		name: sanitizedName,
		price,
    stock,
    lastUpdatedBy: req.user.id,
	}

	products.push(newProduct);

  console.log("[POST] nuevo producto:", newProduct)
	res.json(newProduct);
});

router.put('/productos/:id', verifyToken, authorizationRole(["ADMIN", "EMPLOYEE"]), (req, res) => {
  const id = Number(req.params.id)
  const index = products.findIndex((product) => product.id === id)

  const { price, stock } = req.body;

  if (index === -1) {
    console.error("Producto no encontrado.");
    return res.status(404).json({ message: "Producto no encontrado" })
  }

  const hasPrice = price !== null && price !== undefined;
  const hasStock = stock !== null && stock !== undefined;

  if(!hasPrice && !hasStock) {
    console.error("Error. Se requiere un precio o un stock a modificar.");
    return res.status(400).json({ message:"Error. Se requiere un precio o un stock a modificar." });
  }
  
  if(hasPrice && (typeof price !== 'number' || price <= 0)) {
    console.error("Error. Tiene que ingresar un precio valido.");
    return res.status(400).json({ message:"Error. Tiene que ingresar un precio valido." });
  }

  if(hasStock && (typeof stock !== 'number' || stock < 0)) {
    console.error("Error. Tiene que ingresar un stock valido.");
    return res.status(400).json({ message:"Error. Tiene que ingresar un stock valido." });
  }

  const originalProduct = products[index]

  const editedProduct = {
    ...products[index],
    price: req.body.price ?? products[index].price,
    stock: req.body.stock ?? products[index].stock,
    lastUpdatedBy: req.user.id
  }

    products[index] = editedProduct
    console.log(`[PUT] producto modificado: ${JSON.stringify(originalProduct)} ==> ${JSON.stringify(editedProduct)}`)
    res.json(products[index]);
});

router.delete('/productos/:id', verifyToken, authorizationRole(["ADMIN"]), (req, res) => {
    const id = Number(req.params.id)
    const index = products.findIndex((product) => product.id === id)

    if (index === -1) {
			return res.status(404).json({ message: "Producto no encontrado" })
    }

    const deletedProduct = products.splice(index, 1)[0]

    console.log("[DELETE] producto borrado: ", deletedProduct)
    res.json(deletedProduct);
});

module.exports = router;
