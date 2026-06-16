// auth.js - Módulo para manejar la autenticación

//¿Qué hace este módulo?
//Usa una variable privada accessToken para guardar el JWT.
//Proporciona funciones para guardar, obtener y eliminar el token.

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
  };
})();

// Exportamos el módulo
export default Auth;
