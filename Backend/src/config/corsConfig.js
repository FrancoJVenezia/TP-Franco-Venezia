module.exports = {
  origin: ["http://localhost:8080"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // Necesario para enviar/recibir la cookie httpOnly del refresh token
}