import Auth from './auth.js';

// hace las peticiones con el refresh token en cuenta
async function apiRequest(url, options = {}) {
  if (!options.headers) options.headers = {};
  options.credentials = "include"; // por si alguna ruta necesita la cookie

  const token = Auth.getToken();
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  let response = await fetch(url, options);

  if (response.status === 401) {
    const newToken = await Auth.refreshToken();
    if (newToken) {
      options.headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, options); // Reintento con el token nuevo
    }
  }

  return response;
}

export default apiRequest;
