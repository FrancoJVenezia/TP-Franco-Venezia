import Auth from './auth.js';
const server_domain = "http://localhost:3443" 

document.getElementById("loginForm").addEventListener("submit", async(event) => {
  event.preventDefault();
  
  const user = document.getElementById("username").value
  const pass = document.getElementById("password").value

  const response = await fetch(server_domain + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });

	const div = document.getElementById("sesionIniciada")
  if (response.ok) {
    const data = await response.json();
		div.innerHTML = '<p class="success-login">¡Accediste correctamente!</p>'
    Auth.setToken(data.accessToken);
    console.log("Token almacenado:", Auth.getToken());
  } else {
		div.innerHTML = '<p class="denied-login">Hubo un error al iniciar sesion.</p>'
    console.error("Error en el login");
  }
})

document.getElementById("login").addEventListener("click", async () => {
	const user = document.getElementById("username").value
  const pass = document.getElementById("password").value

  const response = await fetch(server_domain + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });

	const div = document.getElementById("sesionIniciada")
  if (response.ok) {
    const data = await response.json(); //{ accessToken: token }
		div.innerHTML = '<p class="success-login">¡Accediste correctamente!</p>'
    Auth.setToken(data.accessToken); // Guardar el token en memoria
    console.log("Token almacenado:", Auth.getToken());
  } else {
		div.innerHTML = '<p class="denied-login">Hubo un error al iniciar sesion.</p>'
    console.error("Error en el login");
  }
});

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