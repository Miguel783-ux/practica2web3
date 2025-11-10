const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

// Configuración para MariaDB
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mi_tienda'
});

db.connect((err) => {
    if (err) {
        console.error(' Error conectando a MariaDB:', err.message);
        return;
    }
    console.log(' Conectado a MariaDB - mi_tienda');
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        mensaje: ' API funcionando con MariaDB',
        servidor: 'MariaDB',
        puerto: 3000,
        endpoints: [
            'GET /categorias',
            'POST /categorias',
            'GET /productos',
            'POST /productos',
            'GET /categorias/:id',
            'PUT /categorias/:id',
            'DELETE /categorias/:id',
            'GET /productos/:id',
            'PUT /productos/:id',
            'PATCH /productos/:id/stock'
        ]
    });
});

// GET /categorias ejercicicio2
app.get('/categorias', (req, res) => {
    const query = 'SELECT * FROM categorias ORDER BY fecha_alta DESC';
    db.execute(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos: ' + err.message });
        }
        res.json(results);
    });
});

// POST /categorias  ejercicicio1
app.post('/categorias', (req, res) => {
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const query = 'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)';
    db.execute(query, [nombre, descripcion], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al crear categoría: ' + err.message });
        }
        res.status(201).json({ 
            id: result.insertId, 
            nombre, 
            descripcion,
            mensaje: 'Categoría creada exitosamente'
        });
    });
});

// GET /categorias/:id ejercicio3
app.get('/categorias/:id', (req, res) => {
    const categoriaId = req.params.id;
    
    const query = `
        SELECT c.*, p.id as producto_id, p.nombre as producto_nombre, 
               p.precio, p.stock, p.fecha_alta as producto_fecha_alta
        FROM categorias c
        LEFT JOIN productos p ON c.id = p.categoria_id
        WHERE c.id = ?
    `;
    
    db.execute(query, [categoriaId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener categoría' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        const categoria = {
            id: results[0].id,
            nombre: results[0].nombre,
            descripcion: results[0].descripcion,
            fecha_alta: results[0].fecha_alta,
            fecha_act: results[0].fecha_act,
            productos: results[0].producto_id ? results.map(row => ({
                id: row.producto_id,
                nombre: row.producto_nombre,
                precio: row.precio,
                stock: row.stock,
                fecha_alta: row.producto_fecha_alta
            })) : []
        };

        res.json(categoria);
    });
});

// PUT /categorias/:id ejercicio4
app.put('/categorias/:id', (req, res) => {
    const categoriaId = req.params.id;
    const { nombre, descripcion } = req.body;
    
    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const query = 'UPDATE categorias SET nombre = ?, descripcion = ?, fecha_act = CURRENT_TIMESTAMP WHERE id = ?';
    db.execute(query, [nombre, descripcion, categoriaId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al actualizar categoría' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ mensaje: 'Categoría actualizada exitosamente' });
    });
});

// DELETE /categorias/:id ejercicio5
app.delete('/categorias/:id', (req, res) => {
    const categoriaId = req.params.id;
    
    const query = 'DELETE FROM categorias WHERE id = ?';
    db.execute(query, [categoriaId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error al eliminar categoría' });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ mensaje: 'Categoría y sus productos eliminados exitosamente' });
    });
});

// POST /productos ejercicio6
app.post('/productos', (req, res) => {
    const { nombre, precio, stock, categoria_id } = req.body;
    
    if (!nombre || !precio || !stock || !categoria_id) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar que la categoría existe
    const checkCategoria = 'SELECT id FROM categorias WHERE id = ?';
    db.execute(checkCategoria, [categoria_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar categoría' });
        }
        
        if (results.length === 0) {
            return res.status(400).json({ error: 'La categoría no existe' });
        }

        const query = 'INSERT INTO productos (nombre, precio, stock, categoria_id) VALUES (?, ?, ?, ?)';
        db.execute(query, [nombre, precio, stock, categoria_id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al crear producto' });
            }
            res.status(201).json({ 
                id: result.insertId, 
                nombre, 
                precio, 
                stock, 
                categoria_id,
                mensaje: 'Producto creado exitosamente'
            });
        });
    });
});

// GET /productos ejercicio7
app.get('/productos', (req, res) => {
    const query = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        INNER JOIN categorias c ON p.categoria_id = c.id 
        ORDER BY p.fecha_alta DESC
    `;
    
    db.execute(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener productos: ' + err.message });
        }
        res.json(results);
    });
});

// GET /productos/:id ejercicio8
app.get('/productos/:id', (req, res) => {
    const productoId = req.params.id;
    
    const query = `
        SELECT p.*, c.nombre as categoria_nombre 
        FROM productos p 
        INNER JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.id = ?
    `;
    
    db.execute(query, [productoId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener producto' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(results[0]);
    });
});

// PUT /productos/:id ejercicio9
app.put('/productos/:id', (req, res) => {
    const productoId = req.params.id;
    const { nombre, precio, stock, categoria_id } = req.body;
    
    if (!nombre || !precio || !stock || !categoria_id) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Verificar que la categoría existe
    const checkCategoria = 'SELECT id FROM categorias WHERE id = ?';
    db.execute(checkCategoria, [categoria_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al verificar categoría' });
        }
        
        if (results.length === 0) {
            return res.status(400).json({ error: 'La categoría no existe' });
        }

        const query = 'UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria_id = ?, fecha_act = CURRENT_TIMESTAMP WHERE id = ?';
        db.execute(query, [nombre, precio, stock, categoria_id, productoId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar producto' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }

            res.json({ mensaje: 'Producto actualizado exitosamente' });
        });
    });
});

// PATCH /productos/:id/stock ejercicio10
app.patch('/productos/:id/stock', (req, res) => {
    const productoId = req.params.id;
    const { cantidad } = req.body;
    
    if (cantidad === undefined || cantidad === null) {
        return res.status(400).json({ error: 'La cantidad es obligatoria' });
    }

    // Primero obtenemos el stock actual
    const getStockQuery = 'SELECT stock FROM productos WHERE id = ?';
    db.execute(getStockQuery, [productoId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener producto' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const stockActual = results[0].stock;
        const nuevoStock = stockActual + cantidad;

        // Verificar que el stock no sea negativo
        if (nuevoStock < 0) {
            return res.status(400).json({ error: 'El stock no puede ser negativo' });
        }

        // Actualizar el stock
        const updateQuery = 'UPDATE productos SET stock = ?, fecha_act = CURRENT_TIMESTAMP WHERE id = ?';
        db.execute(updateQuery, [nuevoStock, productoId], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar stock' });
            }

            res.json({ 
                mensaje: 'Stock actualizado exitosamente',
                stock_anterior: stockActual,
                stock_actual: nuevoStock,
                cambio: cantidad
            });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(` Base de datos: MariaDB`);
    console.log(` Database: mi_tienda`);
});