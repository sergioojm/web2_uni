import http from 'node:http';

const server = http.createServer((req, res) => {
  // req: información de la petición
  // res: objeto para enviar respuesta
  
  console.log(`${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('¡Hola desde Node.js!');
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});