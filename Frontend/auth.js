// auth.js - Módulo para manejar la autenticación

//¿Qué hace este módulo?
//Usa una variable privada accessToken para guardar el JWT.
//Proporciona funciones para guardar, obtener y eliminar el token.
import { server_domain } from './config.js';

const Auth = (() => {
  let accessToken = null; // Token almacenado en memoria

  return {
    setToken: (token) => {
      accessToken = token;
    },
    getToken: () => accessToken,
    clearToken: () => {
      accessToken = null;
    },
    async refreshToken() {
      try {
        const response = await fetch(server_domain + "/refresh-token", {
          method: "POST",
          credentials: "include", // Importante para enviar la cookie httpOnly
        });

        if (!response.ok) {
          accessToken = null;
          return null;
        }

        const data = await response.json();
        accessToken = data.accessToken;
        return accessToken;
      } catch (error) {
        console.error("Error al refrescar el token:", error);
        accessToken = null;
        return null;
      }
    },
  };
})();

// Exportamos el módulo
export default Auth;
