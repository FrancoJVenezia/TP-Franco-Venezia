# Backend

## Instalación
# 1. Instalar las dependencias
```bash
npm install
```

## Desarrollo

```bash
npm start
```

## Certificados HTTPS
El backend funciona con certificados autofirmados.
Para generar certificados autofirmados, dentro de la carpeta Backend:

```bash
openssl req -nodes -new -x509 -keyout server.key -out server.crt
```

En el caso de que no funcione bien el front (no te deje hacer peticion al servidor).
Entrar a:

https://localhost:3443/

Hacé click en "Avanzado" → "Continuar a localhost (no seguro)"