import Auth from './auth.js';
import apiRequest from './request.js';
import { server_domain } from './config.js';

document.getElementById("loginForm").addEventListener("submit", async(event) => {
  event.preventDefault();
  
  const user = document.getElementById("username").value
  const pass = document.getElementById("password").value

  let error = "";

  if (!user) {
    error += "El nombre de usuario es requerido. ";
  }
  if (user.length < 4 || user.length > 50) {
    error += "El nombre de usuario debe tener entre 4 y 50 caracteres. "
  }
  
  if (!pass) {
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
    credentials: "include", // Para que el navegador acepte la cookie httpOnly del refresh token
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (response.ok) {
    const data = await response.json();
    Auth.setToken(data.accessToken);
    alert("¡Accediste correctamente!");
    showHome();
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
//   await fetch(server_domain + "/logout", {
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
  if(Auth.getToken()) return;
  hideAll();
  loginContainer.classList.remove("d-none");
}

async function showProducts() {
  hideAll();

  const response = await apiRequest(server_domain + "/productos", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    const products = await response.json();

    const user = await getMe();
    const perms = getPerms(user);

    const html = construirHtmlProductos(products, perms);

    productsContainer.innerHTML = html;

    // Una vez que el HTML esta en pantalla, enganchamos los botones.
    activarBotones(products, perms);
  } else {
    console.error("Error en al traer los productos");
  }

  productsContainer.classList.remove("d-none");
}

async function logout() {
  try {
    await fetch(server_domain + "/logout", {
      method: "POST",
      credentials: "include", // Para que el backend reciba la cookie y la borre
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
  Auth.clearToken();
  showHome();
}

document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("loginBtn").addEventListener("click", showLogin);
document.getElementById("homeLoginBtn").addEventListener("click", showLogin);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("productsBtn").addEventListener("click", showProducts);
document.getElementById("homeProductsBtn").addEventListener("click", showProducts);

// Al cargar la página, intentamos recuperar la sesión desde la cookie httpOnly.
// Si hay un refresh token válido, obtenemos un nuevo access token y la barra
// superior muestra "Salir" en lugar de "Iniciar sesión".
async function init() {
  await Auth.refreshToken();
  showHome();
}

init();

function construirHtmlProductos(products, perms) {
  
  const anyPerm = perms.canEdit || perms.canDelete

  let msg = `${perms.canCreate ? createProductHtml() : ''}`;


  for (const product of products) {
    msg += `
      <div class="card product" id="card-${product.id}">
      ${anyPerm ? '<div class="action-btn-container">' : ''}
        ${perms.canEdit ? editProductHtml(product.id) : ''}
        ${perms.canDelete ? deleteProductHtml(product.id) : ''}
      ${anyPerm ? '</div>' : ''}

        <div class="product-info">
          <p>${product.name}</p>
          <p>$${product.price}</p>
          <p>(${product.stock} unidades disponibles)</p>
        </div>
      </div>`
  }

  return msg;
}

function createProductHtml() {
  return `
    <svg class="action-btn card create-btn" id="product-create" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path fill="currentColor" d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/>
    </svg>
  `
}

function editProductHtml(productId) {
  return `
    <svg class="action-btn" id="edit-${productId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <path fill="currentColor"d="M290.74 93.24l128.02 128.02-277.99 277.99-114.14 12.6C11.35 513.54-1.56 500.62.14 485.34l12.7-114.22 277.9-277.88zm207.2-19.06l-60.11-60.11c-18.75-18.75-49.16-18.75-67.91 0l-56.55 56.55 128.02 128.02 56.55-56.55c18.75-18.76 18.75-49.16 0-67.91z"/>
    </svg>
  `
}

function deleteProductHtml(productId) {
  return `
    <svg class="action-btn" id="delete-${productId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path fill="currentColor" d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"/>
    </svg>
  `
}

async function getMe() {
  if (!Auth.getToken()) return null;

  const res = await apiRequest(server_domain + "/me", {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) return null;

  return await res.json();
}

function getPerms(user) {
  if (!user) return { canCreate: false, canEdit: false, canDelete: false };

  const canCreate = user.role === "ADMIN";
  const canEdit = user.role === "ADMIN" || user.role === "EMPLOYEE";
  const canDelete = user.role === "ADMIN";

  return {
    canCreate,
    canEdit,
    canDelete
  }
}

// Recorre los productos y le pone el listener a cada boton de editar/borrar.
// Tambien engancha el boton "+" de crear si el usuario tiene permiso.
function activarBotones(products, perms) {
  if (perms.canCreate) {
    document.getElementById("product-create").addEventListener("click", mostrarFormCrear);
  }

  for (const product of products) {
    if (perms.canEdit) {
      document.getElementById(`edit-${product.id}`)
        .addEventListener("click", () => editarProducto(product));
    }
    if (perms.canDelete) {
      document.getElementById(`delete-${product.id}`)
        .addEventListener("click", () => borrarProducto(product));
    }
  }
}

// ----- BORRAR -----
async function borrarProducto(product) {
  if (!confirm(`¿Seguro que querés borrar "${product.name}"?`)) return;

  const response = await apiRequest(server_domain + "/productos/" + product.id, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    // Sacamos la card de la pantalla, sin recargar todo.
    document.getElementById(`card-${product.id}`).remove();
  } else {
    alert("No se pudo borrar el producto.");
    console.error("Error al borrar el producto");
  }
}

// ----- EDITAR -----
// Reemplazamos los <p> de precio/stock por inputs y los botones por guardar/cancelar.
function editarProducto(product) {
  const card = document.getElementById(`card-${product.id}`);

  card.innerHTML = `
    <div class="action-btn-container">
      <svg class="action-btn" id="save-${product.id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="currentColor" d="M173.9 439.4l-166.4-166.4c-9.4-9.4-9.4-24.6 0-33.9l33.9-33.9c9.4-9.4 24.6-9.4 33.9 0L192 312.7 432.7 71.9c9.4-9.4 24.6-9.4 33.9 0l33.9 33.9c9.4 9.4 9.4 24.6 0 33.9L207 439.4c-9.3 9.4-24.5 9.4-33.9 0z"/>
      </svg>
      <svg class="action-btn" id="cancel-${product.id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
        <path fill="currentColor" d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.4c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"/>
      </svg>
    </div>

    <div class="product-info">
      <p>${product.name}</p>
      <p class="input-line">$<input type="number" id="price-${product.id}" class="product-input" value="${product.price}" min="1"></p>
      <p class="input-line"><input type="number" id="stock-${product.id}" class="product-input" value="${product.stock}" min="0"> unidades</p>
    </div>
  `;

  document.getElementById(`save-${product.id}`)
    .addEventListener("click", () => guardarEdicion(product));

  // Cancelar: volvemos a mostrar toda la lista como estaba.
  document.getElementById(`cancel-${product.id}`)
    .addEventListener("click", showProducts);
}

async function guardarEdicion(product) {
  const price = Number(document.getElementById(`price-${product.id}`).value);
  const stock = Number(document.getElementById(`stock-${product.id}`).value);

  let error = "";
  if (!price || price <= 0) {
    error += "El precio debe ser un número mayor a 0. ";
  }
  if (stock < 0 || !Number.isInteger(stock)) {
    error += "El stock debe ser un número entero mayor o igual a 0. ";
  }
  if (error) {
    return alert(`Error: ${error}`);
  }

  const response = await apiRequest(server_domain + "/productos/" + product.id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ price, stock }),
  });

  if (response.ok) {
    // Refrescamos la lista para ver el producto con los valores nuevos.
    showProducts();
  } else {
    alert("No se pudo guardar el producto.");
    console.error("Error al editar el producto");
  }
}

// ----- CREAR -----
// El boton "+" se transforma en un formulario dentro de la misma card.
function mostrarFormCrear() {
  const card = document.getElementById("product-create");

  card.outerHTML = `
    <div class="card product" id="create-form">
      <div class="action-btn-container">
        <svg class="action-btn" id="create-save" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path fill="currentColor" d="M173.9 439.4l-166.4-166.4c-9.4-9.4-9.4-24.6 0-33.9l33.9-33.9c9.4-9.4 24.6-9.4 33.9 0L192 312.7 432.7 71.9c9.4-9.4 24.6-9.4 33.9 0l33.9 33.9c9.4 9.4 9.4 24.6 0 33.9L207 439.4c-9.3 9.4-24.5 9.4-33.9 0z"/>
        </svg>
        <svg class="action-btn" id="create-cancel" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
          <path fill="currentColor" d="M242.7 256l100.1-100.1c12.3-12.3 12.3-32.2 0-44.5l-22.2-22.2c-12.3-12.3-32.2-12.3-44.5 0L176 189.3 75.9 89.2c-12.3-12.3-32.2-12.3-44.5 0L9.2 111.4c-12.3 12.3-12.3 32.2 0 44.5L109.3 256 9.2 356.1c-12.3 12.3-12.3 32.2 0 44.5l22.2 22.2c12.3 12.3 32.2 12.3 44.5 0L176 322.7l100.1 100.1c12.3 12.3 32.2 12.3 44.5 0l22.2-22.2c12.3-12.3 12.3-32.2 0-44.5L242.7 256z"/>
        </svg>
      </div>

      <div class="product-info">
        <p><input type="text" id="create-name" class="product-input" placeholder="Nombre" minlength="4" maxlength="50"></p>
        <p class="input-line">$<input type="number" id="create-price" class="product-input" placeholder="Precio" min="1"></p>
        <p class="input-line"><input type="number" id="create-stock" class="product-input" placeholder="Stock" min="1"> unidades</p>
      </div>
    </div>
  `;

  document.getElementById("create-save").addEventListener("click", crearProducto);
  // Cancelar: volvemos a mostrar la lista (con el "+" de nuevo).
  document.getElementById("create-cancel").addEventListener("click", showProducts);
}

async function crearProducto() {
  const name = document.getElementById("create-name").value.trim();
  const price = Number(document.getElementById("create-price").value);
  const stock = Number(document.getElementById("create-stock").value);

  let error = "";
  if (!name || name.length < 4 || name.length > 50) {
    error += "El nombre debe tener entre 4 y 50 caracteres. ";
  }
  if (!/^[\p{L}\p{N}\s.,-]+$/u.test(name)) {
    error += "El nombre contiene caracteres inválidos. ";
  }
  if (!price || price <= 0) {
    error += "El precio debe ser un número mayor a 0. ";
  }
  if (!stock || stock <= 0 || !Number.isInteger(stock)) {
    error += "El stock debe ser un número entero mayor a 0. ";
  }
  if (error) {
    return alert(`Error: ${error}`);
  }

  const response = await apiRequest(server_domain + "/productos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, price, stock }),
  });

  if (response.ok) {
    // Refrescamos la lista para que aparezca el producto nuevo.
    showProducts();
  } else {
    alert("No se pudo crear el producto.");
    console.error("Error al crear el producto");
  }
}