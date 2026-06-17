const http = require("http");
const https = require("https");
const app = require("./app");
const fs = require("fs")

http.createServer((req, res) =>{
    res.writeHead(301, {
        location: "https://localhost:3443"+req.url
    });
    console.log("rediccionando a https...")
    res.end();
}).listen(3001)

https.createServer({
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.crt")
    },
app).listen(3443);




