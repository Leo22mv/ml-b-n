// V 1.0



const express = require('express');

// Cors
const cors = require("cors");
const corsOptions = {
    // origin: "http://localhost:3000"
    origin: "https://e-commerce-f.web.app/"
};

// Conexión a la base de datos
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'bxtgjtr3qkl3akl4qpvf-mysql.services.clever-cloud.com',
    user: 'uffbv9ohnafdxmbr',
    password: 'jf27iunjFgsRMGLHVd9S',
    database: 'bxtgjtr3qkl3akl4qpvf',
    port: 3306,
    // host: 'localhost',
    // user: 'root',
    // password: '159753258456Leo',
    // database: 'nakama'
});

connection.connect((error) => {
    if (error) {
      console.error('Error al conectar a la base de datos: ' + error.stack);
      return;
    }
    console.log('Conexión exitosa a la base de datos MySQL.');
});

// App
const app = express();
app.use(cors());
app.use(express.json());


// Compras

const buySchema = `
  CREATE TABLE IF NOT EXISTS buy (
    id_buy INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    total INT,
    FOREIGN KEY (username) REFERENCES user(username)
  )
`;

const buy_detailsSchema = `
  CREATE TABLE IF NOT EXISTS buy_details (
    id_details INT AUTO_INCREMENT PRIMARY KEY,
    id_buy INT,
    id_product INT,
    quantity INT,
    FOREIGN KEY (id_buy) REFERENCES buy(id_buy),
    FOREIGN KEY (id_product) REFERENCES product(id_product) ON DELETE CASCADE
  )
`;

connection.query(buySchema, (error, results, fields) => {
  if (error) throw error;
  console.log('Tabla compras creada o existente');
});

connection.query(buy_detailsSchema, (error, results, fields) => {
  if (error) throw error;
  console.log('Tabla detalles_compras creada o existente');
});

app.post('/compra', (req, res) => {
  const cuerpo = req.body; // {user_id:1, total: 10, compra: [{product_id: 1, cantida: 1}]}
  const compra = {username: cuerpo.username, total: cuerpo.total};
  const query = 'INSERT INTO buy SET ?';
  const query2 = 'INSERT INTO buy_details SET ?';
  const details = cuerpo.buy;
  let id = 0;
  connection.query(query, compra, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      console.log("Compra creada correctamente");
      for (let detail of details) {
        const query3 = "SELECT id_buy FROM buy WHERE username = ? AND total = ?";
        connection.query(query3, [cuerpo.username, cuerpo.total], (error, results, fields) => {
          if (error) {
            console.error(error);
            res.sendStatus(500);
          } else {
            // console.log(results)
            id = results[0].id_buy;
            console.log("Id de compra encontrado correctamente: "+id);

            // console.log(details)
            let values = {id_buy : id, id_product : detail.id_product, quantity: detail.quantity}
            connection.query(query2, values, (error, results, fields) => {
              if (error) {
                console.error(error);
                // res.sendStatus(500);
              } else {
                console.log("Detalle creado correctamente");
              }
            });
          }
        })

        
      }
      res.sendStatus(200);
    }
  });
});

app.get("/compras", (req, res) => {
  const query = 'SELECT * FROM buy';
  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
})

app.get("/compras/:username", (req, res) => {
    console.log(req)
    const id = req.params.username;
    const query = "SELECT * FROM buy WHERE username = ?"
    connection.query(query, id, (error, results, fields) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        res.json(results);
      }
    });
})

// Despliegue
const port = 3000;

app.listen(port, () => {
  console.log(`Servidor API escuchando en http://localhost:${port}`);
});