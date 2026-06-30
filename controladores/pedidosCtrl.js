import { conmysql } from '../db.js';

// 1. CREAR UN PEDIDO (con su detalle) - se ejecuta al "pagar" en el carrito
export const postPedido = async (req, res) => {
    const { cli_id, usr_id, detalles } = req.body;

    if (!cli_id) {
        return res.status(400).json({ message: "Debe indicar el cliente (cli_id) del pedido" });
    }
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ message: "El pedido debe tener al menos un producto en el detalle" });
    }

    const conn = await conmysql.getConnection();

    try {
        await conn.beginTransaction();

        // Verificamos stock de cada producto antes de descontar nada
        for (const item of detalles) {
            const [filas] = await conn.query(
                'SELECT prod_stock, prod_nombre FROM productos WHERE prod_id = ? FOR UPDATE',
                [item.prod_id]
            );

            if (filas.length === 0) {
                throw new Error(`El producto con id ${item.prod_id} no existe`);
            }
            if (filas[0].prod_stock < item.det_cantidad) {
                throw new Error(`Stock insuficiente para "${filas[0].prod_nombre}" (disponible: ${filas[0].prod_stock})`);
            }
        }

        const ped_total = detalles.reduce(
            (suma, item) => suma + (Number(item.det_precio) * Number(item.det_cantidad)),
            0
        );

        const [resultadoPedido] = await conn.query(
            'INSERT INTO pedidos (cli_id, usr_id, ped_total, ped_estado) VALUES (?, ?, ?, 1)',
            [cli_id, usr_id || 1, ped_total]
        );

        const ped_id = resultadoPedido.insertId;

        for (const item of detalles) {
            await conn.query(
                'INSERT INTO detalle_pedido (ped_id, prod_id, det_cantidad, det_precio) VALUES (?, ?, ?, ?)',
                [ped_id, item.prod_id, item.det_cantidad, item.det_precio]
            );

            await conn.query(
                'UPDATE productos SET prod_stock = prod_stock - ? WHERE prod_id = ?',
                [item.det_cantidad, item.prod_id]
            );
        }

        await conn.commit();

        return res.status(201).json({
            ped_id,
            ped_total,
            message: "Pedido registrado con éxito"
        });

    } catch (error) {
        await conn.rollback();
        console.error("Error exacto en postPedido:", error);
        return res.status(500).json({ message: error.message || "Error en el servidor al crear el pedido" });
    } finally {
        conn.release();
    }
};

// 2. LISTAR TODOS LOS PEDIDOS (con el nombre del cliente)
export const getPedidos = async (req, res) => {
    try {
        const [filas] = await conmysql.query(`
            SELECT p.*, c.cli_nombre
            FROM pedidos p
            JOIN clientes c ON c.cli_id = p.cli_id
            ORDER BY p.ped_fecha DESC
        `);
        res.json(filas);
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener los pedidos", error: error.message });
    }
};

// 3. VER EL DETALLE (productos) DE UN PEDIDO PUNTUAL
export const getPedidoDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const [detalles] = await conmysql.query(`
            SELECT d.*, pr.prod_nombre, pr.prod_codigo, pr.prod_imagen
            FROM detalle_pedido d
            JOIN productos pr ON pr.prod_id = d.prod_id
            WHERE d.ped_id = ?
        `, [id]);
        res.json(detalles);
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener el detalle del pedido", error: error.message });
    }
};
