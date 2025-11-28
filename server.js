import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "modulo_alumno"
});

// Probar conexión
db.connect(err => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
  } else {
    console.log("Conectado a la base de datos MySQL");
  }
});

app.get("", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "gestor_alumno.html"));
});

// Obtener todos los alumnos
app.get("/alumno", (req, res) => {
  db.query("SELECT * FROM alumno", (err, results) => {
    if (err) {
      console.error("Error al consultar:", err);
      res.status(500).json({ error: "Error al obtener los datos" });
    } else {
      res.json(results);
    }
  });
});

// Obtener un alumno por ID
app.get("/alumno/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM alumno WHERE id_alumno = ?", [id], (err, results) => {
    if (err) {
      console.error("Error al consultar:", err);
      res.status(500).json({ error: "Error al obtener el alumno" });
    } else {
      res.json(results[0]);
    }
  });
});

// Crear un nuevo alumno
app.post("/alumno", (req, res) => {
  const { nombre, apellido, dni, email, telefono, fecha_nacimiento, direccion, id_curso } = req.body;
  const query = `
    INSERT INTO alumno 
    (nombre, apellido, dni, email, telefono, fecha_nacimiento, direccion, id_curso)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [nombre, apellido, dni, email, telefono, fecha_nacimiento, direccion, id_curso], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al guardar el alumno" });
    }
    res.status(201).json({ message: "Alumno agregado correctamente" });
  });
});

// Actualizar un alumno
app.put("/alumno/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, dni, email, telefono, fecha_nacimiento, direccion, id_curso } = req.body;

  const query = `
    UPDATE alumno
    SET nombre = ?, apellido = ?, dni = ?, email = ?, telefono = ?, fecha_nacimiento = ?, direccion = ?, id_curso = ?
    WHERE id_alumno = ?
  `;
  db.query(query, [nombre, apellido, dni, email, telefono, fecha_nacimiento, direccion, id_curso, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar:", err);
      res.status(500).json({ error: "Error al actualizar el alumno" });
    } else {
      res.json({ message: "Alumno actualizado correctamente" });
    }
  });
});

// Eliminar un alumno
app.delete("/alumno/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM alumno WHERE id_alumno = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar:", err);
      res.status(500).json({ error: "Error al eliminar el alumno" });
    } else {
      res.json({ message: "Alumno eliminado correctamente" });
    }
  });
});


// ------------------ ASISTENCIA ------------------

// Insertar asistencia sin joins ni datos adicionales
app.post("/asistencia", (req, res) => {
    const { fecha, estado, id_alumno, id_curso } = req.body;

    const query = `
        INSERT INTO asistencia (fecha, estado, id_alumno, id_curso)
        VALUES (?, ?, ?, ?)
    `;

    db.query(query, [fecha, estado, id_alumno, id_curso], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Error al guardar la asistencia" });
        }

        // Retornamos solo la información insertada
        res.status(201).json({
            id_asistencia: result.insertId,
            fecha,
            estado,
            id_alumno,
            id_curso
        });
    });
});



// Obtener todas las asistencias
app.get("/asistencia", (req, res) => {
  const { id_curso } = req.query; // opcional para filtrar por curso
  let query = `
    SELECT a.*, al.nombre AS alumno_nombre, al.apellido AS alumno_apellido
    FROM asistencia a
    LEFT JOIN alumno al ON a.id_alumno = al.id_alumno
  `;
  const params = [];
  if (id_curso) {
    query += " WHERE a.id_curso = ?";
    params.push(id_curso);
  }
  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Error al obtener asistencias:", err);
      return res.status(500).json({ error: "Error al obtener asistencias" });
    }
    res.json(results);
  });
});


// Crear nueva asistencia
app.post("/asistencia", (req, res) => {
  const { fecha, estado, id_alumno, id_curso } = req.body;
  const query = `
    INSERT INTO asistencia (fecha, estado, id_alumno, id_curso)
    VALUES (?, ?, ?, ?)
  `;
  db.query(query, [fecha, estado, id_alumno, id_curso], (err, result) => {
    if (err) {
      console.error("Error al guardar asistencia:", err);
      return res.status(500).json({ error: "Error al guardar asistencia" });
    }
    res.status(201).json({ message: "Asistencia registrada correctamente" });
  });
});


// Actualizar asistencia
app.put("/asistencia/:id", (req, res) => {
  const { id } = req.params;
  const { fecha, estado, id_alumno, id_curso } = req.body;
  const query = `
    UPDATE asistencia
    SET fecha=?, estado=?, id_alumno=?, id_curso=?
    WHERE id_asistencia=?
  `;
  db.query(query, [fecha, estado, id_alumno, id_curso, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar asistencia:", err);
      return res.status(500).json({ error: "Error al actualizar asistencia" });
    }
    res.json({ message: "Asistencia actualizada correctamente" });
  });
});

// Eliminar asistencia
app.delete("/asistencia/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM asistencia WHERE id_asistencia = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar asistencia:", err);
      return res.status(500).json({ error: "Error al eliminar asistencia" });
    }
    res.json({ message: "Asistencia eliminada correctamente" });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// ------------------ CALIFICACIONES ------------------

// Obtener todas las calificaciones con nombre del alumno y materia
app.get("/calificaciones", (req, res) => {
  const query = `
    SELECT 
      c.id_calificacion,
      c.fecha,
      c.nota,
      c.materia,
      c.observaciones,
      c.id_alumno,
      CONCAT(al.nombre, ' ', al.apellido) AS alumno_nombre_completo
    FROM calificacion c
    LEFT JOIN alumno al ON c.id_alumno = al.id_alumno
    ORDER BY c.fecha DESC, c.materia ASC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener calificaciones:", err);
      return res.status(500).json({ error: "Error al obtener calificaciones" });
    }
    res.json(results);
  });
});

// Obtener una calificación por ID
app.get("/calificaciones/:id", (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      c.*, 
      CONCAT(al.nombre, ' ', al.apellido) AS alumno_nombre_completo
    FROM calificacion c
    LEFT JOIN alumno al ON c.id_alumno = al.id_alumno
    WHERE c.id_calificacion = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener calificación:", err);
      return res.status(500).json({ error: "Error al obtener calificación" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Calificación no encontrada" });
    }
    res.json(results[0]);
  });
});

// Crear nueva calificación
app.post("/calificaciones", (req, res) => {
  const { fecha, nota, materia, observaciones, id_alumno } = req.body;

  // Validación básica
  if (!fecha || !nota || !materia || !id_alumno) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const query = `
    INSERT INTO calificacion 
      (fecha, nota, materia, observaciones, id_alumno) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [fecha, nota, materia, observaciones || null, id_alumno], (err, result) => {
    if (err) {
      console.error("Error al crear calificación:", err);
      return res.status(500).json({ error: "Error al guardar calificación" });
    }
    res.status(201).json({ 
      message: "Calificación registrada correctamente",
      id_calificacion: result.insertId 
    });
  });
});

// Actualizar calificación
app.put("/calificaciones/:id", (req, res) => {
  const { id } = req.params;
  const { fecha, nota, materia, observaciones, id_alumno } = req.body;

  const query = `
    UPDATE calificacion 
    SET fecha = ?, nota = ?, materia = ?, observaciones = ?, id_alumno = ?
    WHERE id_calificacion = ?
  `;

  db.query(query, [fecha, nota, materia, observaciones || null, id_alumno, id], (err, result) => {
    if (err) {
      console.error("Error al actualizar calificación:", err);
      return res.status(500).json({ error: "Error al actualizar calificación" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Calificación no encontrada" });
    }
    res.json({ message: "Calificación actualizada correctamente" });
  });
});

// Eliminar calificación
app.delete("/calificaciones/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM calificacion WHERE id_calificacion = ?", [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar calificación:", err);
      return res.status(500).json({ error: "Error al eliminar calificación" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Calificación no encontrada" });
    }
    res.json({ message: "Calificación eliminada correctamente" });
  });
});