import { conmysql } from '../db.js';

// Usamos 'postPedido' para mantener compatibilidad con tu router
export const postPedido = async (req, res) => {
    const { 
        cli_id, cli_identificacion, cli_nombre, cli_telefono, cli_correo, 
        cli_direccion, cli_pais, cli_ciudad, ped_fecha, usr_id, ped_estado, detalle 
    } = req.body;

    // Validación permitiendo cli_id 0 para clientes nuevos
    if (cli_id === undefined || cli_id === null) {
        return res.status(400).json({ message: "Debe indicar el cliente (cli_id) del pedido" });
    }

    if (!detalle || !Array.isArray(detalle) || detalle.length === 0) {
        return res.status(400).json({ message: "El pedido debe tener al menos un producto en el detalle" });
    }

    const conn = await conmysql.getConnection();

    try {
        await conn.beginTransaction();

        let idCliente = Number(cli_id);

        if (idCliente === 0) {
            const [result] = await conn.query(
                `INSERT INTO clientes (cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad) 
                 VALUES (?,?,?,?,?,?,?)`,
                [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad]
            );
            idCliente = result.insertId;
        }

        // ... lógica de inserción de pedido y detalle ...
        const [resultadoPedido] = await conn.query(
            'INSERT INTO pedidos (cli_id, usr_id, ped_fecha, ped_estado) VALUES (?, ?, ?, ?)',
            [idCliente, usr_id || 1, ped_fecha, ped_estado || 1]
        );
        const ped_id = resultadoPedido.insertId;

        for (const item of detalle) {
            await conn.query(
                'INSERT INTO detalle_pedido (ped_id, prod_id, det_cantidad, det_precio) VALUES (?, ?, ?, ?)',
                [ped_id, item.prod_id, item.det_cantidad, item.det_precio]
            );
        }

        await conn.commit();
        res.status(201).json({ ped_id, message: "Pedido registrado con éxito" });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};

export const getPedidos = async (req, res) => {
    try {
        const [filas] = await conmysql.query(`SELECT p.*, c.cli_nombre FROM pedidos p JOIN clientes c ON c.cli_id = p.cli_id`);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPedidoDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const [detalles] = await conmysql.query(`SELECT d.*, pr.prod_nombre FROM detalle_pedido d JOIN productos pr ON pr.prod_id = d.prod_id WHERE d.ped_id = ?`, [id]);
        res.json(detalles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
