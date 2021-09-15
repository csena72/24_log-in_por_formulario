const express = require("express");
var exphbs = require('express-handlebars');

const app = express();
const router = express.Router();
const { PORT } = require('./config/globals');
const { getConnection } = require('./dao/db/connection');
const routes = require("./routes/routes");

const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const ProductoService = require("./services/producto");
const MensajeService = require("./services/mensajes");

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use("/public", express.static("./src/public"));
app.use(routes(router));

app.engine('handlebars', exphbs());
app.set("views", "./src/views");
app.set('view engine', 'handlebars');




io.on('connection', async (socket) => {
  productoService = new ProductoService();
  mensajeService = new MensajeService();
  let productosWs = await productoService.getAllProductos();
  let mensajes = await mensajeService.getAllMensajes();  

  socket.emit('mensajes', { mensajes: await mensajeService.getAllMensajes() })

  socket.on('nuevo-mensaje', async (nuevoMensaje) => {
    const { author, message } = nuevoMensaje; 
    const elNuevoMensaje = {
      author,
      message,
    }
    
    await mensajeService.createMensaje(elNuevoMensaje);

    io.sockets.emit('recibir nuevoMensaje', [elNuevoMensaje])
  })

  io.sockets.emit('productos', await productoService.getAllProductos() ); 

  socket.on('producto-nuevo', async data => {
    await productoService.createProducto(data);
  })

});

getConnection().then(() =>
  server.listen(PORT, () => console.log("server's up", PORT))
);