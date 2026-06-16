const express = require('express');
const cors = require("cors")
const jwt = require("jsonwebtoken")
const sanitizeHtml = require('sanitize-html')
const ratelimit = require('express-rate-limit')
const morgan = require("morgan")
const app = express();

const corsOptions = {
  origin: ["http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("combined"));

const globalLimiter = ratelimit({
  windowMs: 10*60*1000, //15 minutos
  max: 100, //maximo de peticiones por IP
  message: "¡Demasiadas peticiones, intente de nuevo más tarde!"
});

app.use(globalLimiter);

const loginLimiter = ratelimit({
  windowMs: 10*60*1000, //10 minutos
  max: 10,
  message: "¡Demasiadas peticiones, intente de nuevo más tarde!"
});



const tokenConfig = {
  SECRET_KEY: "123456",
  expiresIn: "1h"
}

const db = {
  users: [
    {
      id: 1,
			name: "Roberto",
			username: "gerente",
      password: "4321", // Simulación de password hasheado
      role: "ADMIN",
    },
    {
      id: 2,
			name: 'Juan',
      username: "empleado",
      password: "1234",
      role: "EMPLOYEE",
    },
    {
      id: 3,
			name: 'Pedro',
      username: "cliente",
      password: "4444",
      role: "CLIENT",
    }
  ],

  products: [
    {
      id: 1,
      name: "Leche Entera 1L",
      price: 1200.50,
      stock: 50,
      lastUpdatedBy: 1,
    },
    {
      id: 2,
      name: "Detergente Bio",
      price: 2500.00,
      stock: 15,
      lastUpdatedBy: 1,
    }
  ],
};


//Post de logueo(generamos un token)
app.post("/login", loginLimiter, (req,res)=>{
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

		const users = db.users;

		for(let i = 0; i < users.length; i++) {
			const user = users[i];
			if (normalizedUsername == user.username && normalizedPassword == user.password){
        const token = jwt.sign({ id: user.id, role: user.role, username: user.username, name: user.name }, tokenConfig.SECRET_KEY, { expiresIn: tokenConfig.expiresIn });

        console.log(`[POST] login. Se ha iniciado sesion correctamente, ${user.name} (${user.role})`);
        return res.json({ accessToken: token })
			}
		}

		res.status(401).json({message:"Credenciales Incorrectas"})

});

//Middleware(funcion) para verificar token
const verifyToken = (req, res, next) => {
	const token = req.headers["authorization"]

	if(!token) return res.status(401).json({message:"Token Requerido"})

	jwt.verify(token.split(" ")[1], tokenConfig.SECRET_KEY, (err,decoded) =>{
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

const authorizationRole = (roles) => {
    return (req, res, next)=>{
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({error:"Acceso no autorizado"})
      }    
      next()
    }
};



app.get('/productos', (req, res) => {
	console.log("[GET] Productos:", db.products)
	res.json(db.products)
});

app.post('/productos', verifyToken, authorizationRole(["ADMIN"]), (req, res) => {
  const { name, price, stock } = req.body;
  const hasPrice = price !== null && price !== undefined;
  const hasStock = stock !== null && stock !== undefined;

  const sanitizedName = typeof name === "string"
    ? sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} }).trim()
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
		id: db.products.length + 1,
		name: sanitizedName,
		price,
    stock,
    lastUpdatedBy: req.user.id,
	}

	db.products.push(newProduct);

  console.log("[POST] nuevo producto:", newProduct)
	res.json(newProduct);
});

app.put('/productos/:id', verifyToken, authorizationRole(["ADMIN", "EMPLOYEE"]), (req, res) => {
  const id = Number(req.params.id)
  const index = db.products.findIndex((product) => product.id === id)

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

    

    const originalProduct = db.products[index]

		const editedProduct = {
			...db.products[index],
			price: req.body.price ?? db.products[index].price,
			stock: req.body.stock ?? db.products[index].stock,
			lastUpdatedBy: req.user.id
		}

    db.products[index] = editedProduct
    console.log(`[PUT] producto modificado: ${JSON.stringify(originalProduct)} ==> ${JSON.stringify(editedProduct)}`)
    res.json(db.products[index]);
});

app.delete('/productos/:id', verifyToken, authorizationRole(["ADMIN"]), (req, res) => {
    const id = Number(req.params.id)
    const index = db.products.findIndex((product) => product.id === id)

    if (index === -1) {
			return res.status(404).json({ message: "Producto no encontrado" })
    }

    const deletedProduct = db.products.splice(index, 1)[0]

    console.log("[DELETE] producto borrado: ", deletedProduct)
    res.json(deletedProduct);
});

app.listen('3443', (err) => {
	if (err) return console.error('Hubo un error al levantar el servidor en el puerto 3443.');

	
	console.log('Servidor en http://localhost:3443');
    
});