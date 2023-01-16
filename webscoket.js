const WebSocket = require('ws');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';

// Crear un servidor de WebSockets en el puerto 3000
const wss = new WebSocket.Server({ port: 3000 });

// Conectarse a la base de datos MongoDB
MongoClient.connect(url, (err, client) => {
  if (err) {
    console.log(`Error al conectarse a la base de datos: ${err}`);
    return;
  }

  console.log('Conectado a la base de datos MongoDB');

  // Escuchar evento de conexión de cliente
  wss.on('connection', (ws) => {
    console.log('Nuevo cliente conectado');

    // Escuchar evento de mensaje recibido del cliente
    ws.on('message', (message) => {
      console.log(`Mensaje recibido: ${message}`);

      // Convertir mensaje recibido a objeto JSON
      let data = JSON.parse(message);

      // Verificar si el mensaje es para crear una nota
      if (data.route === 'create-note') {
        let db = client.db('notesdb');
        let collection = db.collection('notes');

        // Insertar una nueva nota en la colección de notas
        collection.insertOne({ note: data.note }, (err, result) => {
          if (err) {
            console.log(`Error al insertar nota: ${err}`);
            return;
          }

          // Enviar una respuesta al cliente con el ID de la nota creada
          ws.send(JSON.stringify({
            route: 'create-note',
            id: result.insertedId
          }));
        });
      }

      // Verificar si el mensaje es para leer las notas
      if (data.route === 'read-notes') {
        let db = client.db('notesdb');
        let collection = db.collection('notes');

        // Recuperar todas las notas de la colección de notas
        collection.find({}).toArray((err, result) => {
          if (err) {
            console.log(`Error al recuperar notas: ${err}`);
            return;
          }

          // Enviar una respuesta al cliente con todas las notas
          ws.send(JSON.stringify({
            route: 'read-notes',
            notes: result
          }));
        });
      }
    });
  });

  console.log('Servidor de WebSockets escuchando en el puerto 3000');
});

