import Auth from './auth.js';
const server_domain = "http://localhost:3443" 

document.getElementById("loginForm").addEventListener("submit", async(event) => {
  event.preventDefault();
  
  const user = document.getElementById("username").value
  const pass = document.getElementById("password").value

  let error = "";

  if (!user &&  typeof user == 'string') {
    error += "El nombre de usuario es requerido. ";
  }
  if (user.length < 4 || user.length > 50) {
    error += "El nombre de usuario debe tener entre 4 y 50 caracteres. "
  }
  
  if (!pass &&  typeof pass == 'string') {
    error += "La contraseña es requerida. ";
  }

  if (pass.length < 4 || pass.length > 30) {
    error += "La contraseña debe tener entre 4 y 30 caracteres. "
  }

  if (error) {
    return alert(`Error: ${error}`);
  }

  const response = await fetch(server_domain + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (response.ok) {
    const data = await response.json();
    Auth.setToken(data.accessToken);
    alert("¡Accediste correctamente!");
    showHome();
    console.log("Token almacenado:", Auth.getToken());
  } else {
    alert("Hubo un error al iniciar sesion. Revisá el usuario y contraseña y volvé a intentarlo más tarde.")
    console.error("Error en el login");
  }
})


// document.getElementById("loginBtn").addEventListener("click", async () => {
  
//   const user = document.getElementById("username").value
//   const pass = document.getElementById("password").value

//   const response = await fetch(server_domain+"/login", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username: user, password: pass }),
//   });

//   if (response.ok) {
//     const data = await response.json(); //{ accessToken: token }
//     Auth.setToken(data.accessToken); // Guardar el token en memoria
//     console.log("Token almacenado:", Auth.getToken());
//   } else {
//     console.error("Error en el login");
//   }
// });


////    CON API PROTEGIDA   ///
// document.getElementById("getDataBtn").addEventListener("click", async () => {
//   const token = Auth.getToken();
//   if (!token) {
//     console.error("No hay token disponible");
//     return;
//   }

//   const response = await fetch(server_domain+"/productos", {
//     method: "GET",
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   if (response.ok) {
//     const data = await response.json();
//     console.log("Datos protegidos:", data);
//   } else {
//     console.error("No autorizado");
//   }
// });

// // LOGOUT - LIMPIAR TOKEN 
// document.getElementById("logoutBtn").addEventListener("click", async () => {
//   Auth.clearToken(); // Borrar token de memoria
//   await fetch(server_domain+"/logout", {
//     method: "POST",
//     credentials: "include",
//   });
//   console.log("Sesión cerrada");
// });

const homeContainer     = document.getElementById("homeContainer");
const loginContainer    = document.getElementById("loginContainer");
const productsContainer = document.getElementById("productsContainer");

const loginEl = document.getElementById("loginBtn");
const logoutEl = document.getElementById("logoutBtn");

const allContainers = [homeContainer, loginContainer, productsContainer];

function hideAll() {
  allContainers.forEach(container => container.classList.add("d-none"));
  if (Auth.getToken()) {
    logoutEl.classList.remove("d-none");
    loginEl.classList.add("d-none");
  } else {
    logoutEl.classList.add("d-none");
    loginEl.classList.remove("d-none");
  }
}

function showHome() {
  hideAll();
  homeContainer.classList.remove("d-none");
}

function showLogin() {
  console.log("funciona=?");
  hideAll();
  loginContainer.classList.remove("d-none");
}

function showProducts() {
  hideAll();
  productsContainer.classList.remove("d-none");
}

function logout() {
  Auth.clearToken();
  showHome();
}

document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("loginBtn").addEventListener("click", showLogin);
document.getElementById("homeLoginBtn").addEventListener("click", showLogin);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("productsBtn").addEventListener("click", showProducts);
document.getElementById("homeProductsBtn").addEventListener("click", showProducts);