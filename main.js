const express = require("express");
const body_parser = require("body-parser");
const path = require("path");
const WebSocket = require('ws');  

const Notes = require("./database");
const updateRouter = require("./update-router");
const app = express();

const server = app.listen(3005);
const wss = new WebSocket.Server({ server });

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use("/updatepage", updateRouter);
app.use((req, res, next) => {
  console.log(req.method + " : " + req.url);
  next();
});

app.get("/", (req, res, next) => {
  res.redirect("/index");
});

app
  .route("/notes-add")
  .get((req, res, next) => {
    res.render("notes-add");
  })
  .post((req, res, next) => {
    console.log(req.body);
    const Note = new Notes({});

    Note.title = req.body.title;
    Note.description = req.body.description;
    //save notes first
    Note.save((err, product) => {
      if (err) console.log(err);
      console.log(product);
    });
    res.redirect("/index");
  });

app.get("/index", (req, res, next) => {
  Notes.find({}).exec((err, document) => {
    if (err) console.log(err);
    let Data = [];
    document.forEach((value) => {
      Data.push(value);
    });
    res.render("view", { data: Data });
  });
});

app.get("/delete/:__id", (req, res, next) => {
  Notes.findByIdAndRemove(
    req.params.__id,
    { useFindAndModify: false },
    (err, document) => {
      if (err) console.log(err);
      console.log(document);
    }
  );
  res.redirect("/index");
});

app.get("/updatepage/:__id", (req, res) => {
  console.log("id for get request: " + req.id);
  Notes.findById(req.id, (err, document) => {
    console.log(document);

    res.render("updatepage", { data: document });
  });
});

app.post("/updatepage", (req, res, next) => {
  console.log("id: " + req.id);
  Notes.findByIdAndUpdate(
    req.id,
    { title: req.body.title, description: req.body.description },
    { useFindAndModify: false },
    (err, document) => {
      console.log("updated");
    }
  );
  res.redirect("/index");
  return next();
});

wss.on('connection', (ws) => {
  console.log('Nuevo cliente conectado');

  ws.on('message', (message) => {
    console.log(`Mensaje recibido: ${message}`);
    const messageData = JSON.parse(message);

  if (messageData.type === 'create_note') {
    const Note = new Notes({});
    Note.title = messageData.title;
    Note.description = messageData.description;
    Note.save((err, product) => {
      if (err) console.log(err);
      console.log(product);
    });

    ws.send(JSON.stringify({ type: 'create_note_success', id: Note._id }));
  }
  else if (messageData.type === 'get_note') {
    Notes.findById(messageData.id, (err, document) => {
      if (err) console.log(err);
      ws.send(JSON.stringify({ type: 'get_note_success', note: document }));
    });
  }
    ws.send(`Mensaje recibido: ${message}`);
  });
});

console.log('Servidor corriendo en el puerto 3005');

const port = process.env.PORT || 3000;
app.listen(port, (arg) => {
  console.log(`Server started @ ${port}.`);
});
