import { conmysql } from '../db.js';

// 1. OBTENER TODOS LOS PRODUCTOS
export const getProductos = async (req, res) => {
    try {
        const [filas] = await conmysql.query('SELECT * FROM productos');
        res.json(filas);
    } catch (error) {
        return res.status(500).json({ message: "Error al traer los productos", error: error.message });
    }
};

// 2. INSERTAR UN NUEVO PRODUCTO
export const postProducto = async (req, res) => {
    try {
        const { prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo } = req.body;
        const prod_imagen = req.file ? `/uploads/${req.file.filename}` : null;

        // 💡 SEGURIDAD: Convertimos los textos del FormData a números para MySQL
        const stockNumero = parseInt(prod_stock, 10) || 0;
        const precioNumero = parseFloat(prod_precio) || 0.0;
        const activoNumero = prod_activo ? parseInt(prod_activo, 10) : 1;

        // Validar campos obligatorios antes de procesar
        if (!prod_codigo || !prod_nombre) {
            return res.status(400).json({ message: "El código y el nombre son obligatorios" });
        }

        // Validar código repetido
        const [fila] = await conmysql.query('SELECT * FROM productos WHERE prod_codigo = ?', [prod_codigo]);
        if (fila.length > 0) {
            return res.status(400).json({
                id: 0,
                mensaje: 'Producto con código: ' + prod_codigo + ' ya está registrado'
            });
        }

        // 💡 CORREGIDO: Pasamos las variables numéricas procesadas de forma segura
        const [resultado] = await conmysql.query(
            "INSERT INTO productos(prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo, prod_imagen) VALUES (?, ?, ?, ?, ?, ?)",
            [prod_codigo, prod_nombre, stockNumero, precioNumero, activoNumero, prod_imagen]
        );

        // Retornamos un estado 201 (Creado) junto al id para que el frontend lo detecte con éxito
        return res.status(201).json({ prod_id: resultado.insertId, message: "Producto guardado con éxito" });

    } catch (error) {
        // 💡 IMPORTANTE: Esto imprimirá la falla exacta en tu consola de Node.js si algo falla
        console.error("Error exacto en postProducto:", error); 
        return res.status(500).json({ message: "Error en el servidor", error: error.message });
    }
};

// 3. ACTUALIZAR UN PRODUCTO EXISTENTE (PUT)
export const putProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { prod_codigo, prod_nombre, prod_stock, prod_precio, prod_activo } = req.body;
        
        let prod_imagen = req.file ? `/uploads/${req.file.filename}` : null;

        if (!req.file) {
            const [filas] = await conmysql.query(
                'SELECT prod_imagen FROM productos WHERE prod_id = ?',
                [id]
            );

            if (filas && filas.length > 0) {
                prod_imagen = filas[0].prod_imagen;
            } else {
                return res.status(404).json({ mensaje: 'Producto no encontrado' });
            }
        }

        // 💡 SEGURIDAD: Convertimos también aquí para evitar fallas en actualizaciones
        const stockNumero = parseInt(prod_stock, 10) || 0;
        const precioNumero = parseFloat(prod_precio) || 0.0;
        const activoNumero = prod_activo ? parseInt(prod_activo, 10) : 1;

        const [resultado] = await conmysql.query(
            'UPDATE productos SET prod_codigo=?, prod_nombre=?, prod_stock=?, prod_precio=?, prod_activo=?, prod_imagen=? WHERE prod_id=?',
            [prod_codigo, prod_nombre, stockNumero, precioNumero, activoNumero, prod_imagen, id]
        );

        if (resultado.affectedRows <= 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar' });
        }

        const [rows] = await conmysql.query('SELECT * FROM productos WHERE prod_id = ?', [id]);
        return res.json(rows[0]);
        
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: error.message });
    }
};