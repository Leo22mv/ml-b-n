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

// Definir el modelo Producto
const productoSchema = `
  CREATE TABLE IF NOT EXISTS producto (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255),
    descripcion VARCHAR(255),
    urlFoto VARCHAR(255),
    precio DECIMAL(10, 2),
    categoria VARCHAR(255),
    serie VARCHAR(255),
    stock INT
  )
`;

// Crear la tabla Producto si no existe
connection.query(productoSchema, (error, results, fields) => {
  if (error) throw error;
  console.log('Tabla Producto creada o existente');
});

// Endpoints
app.post('/agregar', (req, res) => {
    const producto = req.body;
    const query = 'INSERT INTO producto SET ?';
    connection.query(query, producto, (error, results, fields) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
});

app.get('/productos', (req, res) => {
    const query = 'SELECT * FROM producto';
    connection.query(query, (error, results, fields) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        res.json(results);
      }
    });
});

app.delete(`/productos/:id`, (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM producto WHERE id_producto = ?';
    connection.query(query, id, (error, results, fields) => {
      if (error) {
        console.error(error);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
});

// Users
const userSchema = `
  CREATE TABLE IF NOT EXISTS user (
    id_user INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255),
    username VARCHAR(255),
    password VARCHAR(255)
  )
`;

connection.query(userSchema, (error, results, fields) => {
  if (error) throw error;
  console.log('Tabla user creada o existente');
});

app.post('/registrarse', (req, res) => {
  const user = req.body;

  const query = 'SELECT * FROM user WHERE email = ? OR username = ?';
  connection.query(query, [user.email, user.username], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error en el servidor');
    } else {
      if (results.length > 0) {
        res.status(401).send('Email o usuario existentes');
      } else {
        const query2 = 'INSERT INTO user SET ?';
        connection.query(query2, user, (error, results, fields) => {
          if (error) {
            console.error(error);
            res.sendStatus(500);
          } else {
            res.sendStatus(200);
          }
        });
      }
    }
  });
});  

app.get('/usuarios', (req, res) => {
  const query = 'SELECT * FROM user';
  connection.query(query, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});

app.get('/usuario/:id', (req, res) => {
  const id = req.params.id;
  const query = 'SELECT * FROM user WHERE id_user = ?';
  connection.query(query, id, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      res.json(results);
    }
  });
});


app.post('/login', (req, res) => {
  const loginForm = req.body;

  const query = 'SELECT * FROM user WHERE username = ? AND password = ?';
  connection.query(query, [loginForm.username, loginForm.password], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error en el servidor');
    } else {
      if (results.length > 0) {
        // res.status(200).send('Inicio de sesión exitoso');
        // console.log(results[0].id_user)
        res.json(results[0].id_user);
      } else {
        res.status(401).send('Credenciales inválidas');
      }
    }
  });
});

// Compras

const comprasSchema = `
  CREATE TABLE IF NOT EXISTS compras (
    id_compra INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT,
    total INT,
    FOREIGN KEY (id_user) REFERENCES user(id_user)
  )
`;

const detalles_comprasSchema = `
  CREATE TABLE IF NOT EXISTS detalles_compras (
    id_detalles INT AUTO_INCREMENT PRIMARY KEY,
    id_compra INT,
    id_producto INT,
    cantidad INT,
    FOREIGN KEY (id_compra) REFERENCES compras(id_compra),
    FOREIGN KEY (id_producto) REFERENCES producto(id_producto) ON DELETE CASCADE
  )
`;

connection.query(comprasSchema, (error, results, fields) => {
  if (error) throw error;
  console.log('Tabla compras creada o existente');
});

connection.query(detalles_comprasSchema, (error, results, fields) => {
  if (error) throw error;
  console.log('Tabla detalles_compras creada o existente');
});

app.post('/compra', (req, res) => {
  const cuerpo = req.body; // {user_id:1, total: 10, compra: [{product_id: 1, cantida: 1}]}
  const compra = {id_user: cuerpo.id_user, total: cuerpo.total};
  const query = 'INSERT INTO compras SET ?';
  const query2 = 'INSERT INTO detalles_compras SET ?';
  const details = cuerpo.compra;
  let id = 0;
  connection.query(query, compra, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.sendStatus(500);
    } else {
      console.log("Compra creada correctamente");
      for (let detail of details) {
        const query3 = "SELECT id_compra FROM compras WHERE id_user = ? AND total = ?";
        connection.query(query3, [cuerpo.id_user, cuerpo.total], (error, results, fields) => {
          if (error) {
            console.error(error);
            res.sendStatus(500);
          } else {
            // console.log(results)
            id = results[0].id_compra;
            console.log("Id de compra encontrado correctamente: "+id);

            // console.log(details)
            let values = {id_compra : id, id_producto : detail.id_producto, cantidad: detail.cantidad}
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
  // console.log(req)
  // const id = req;
  // const query = "SELECT * FROM compras WHERE id_user = ?"
  // connection.query(query, id, (error, results, fields) => {
  //   if (error) {
  //     console.error(error);
  //     res.sendStatus(500);
  //   } else {
  //     res.json(results);
  //   }
  // });

  const query = 'SELECT * FROM compras';
  connection.query(query, (error, results, fields) => {
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