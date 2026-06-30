import { conmysql } from '../db.js';

// 1. GUARDAR PEDIDO (Con inserción de cliente si id = 0)
export const guardarPedido = async (req, res) => {
    const conexion = await conmysql.getConnection();

    try {
        await conexion.beginTransaction();
        const {
            cli_id, cli_identificacion, cli_nombre, cli_telefono,
            cli_correo, cli_direccion, cli_pais, cli_ciudad,
            ped_fecha, usr_id, ped_estado, detalle
        } = req.body;

        if (!detalle || detalle.length === 0) {
            throw new Error("El pedido no tiene productos.");
        }

        let idCliente = Number(cli_id);

        // Lógica de Cliente nuevo
        if (idCliente === 0) {
            const [cliente] = await conexion.query(
                `INSERT INTO clientes (cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad) 
                 VALUES (?,?,?,?,?,?,?)`,
                [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad]
            );
            idCliente = cliente.insertId;
        }

        // Registro de Pedido
        const [pedido] = await conexion.query(
            `INSERT INTO pedidos (cli_id, ped_fecha, usr_id, ped_estado) VALUES (?,?,?,?)`,
            [idCliente, ped_fecha, usr_id || 1, ped_estado]
        );
        const ped_id = pedido.insertId;

        // Registro de Detalle
        for (const item of detalle) {
            const [producto] = await conexion.query("SELECT prod_id FROM productos WHERE prod_id=?", [item.prod_id]);
            if (producto.length === 0) throw new Error(`El producto ${item.prod_id} no existe.`);
            
            await conexion.query(
                `INSERT INTO pedidos_detalle (prod_id, ped_id, det_cantidad, det_precio) VALUES (?,?,?,?)`,
                [item.prod_id, ped_id, item.det_cantidad, item.det_precio]
            );
        }

        await conexion.commit();
        res.status(201).json({ ok: true, mensaje: "Pedido registrado correctamente.", ped_id, cli_id: idCliente });

    } catch (error) {
        await conexion.rollback();
        res.status(500).json({ ok: false, mensaje: error.message });
    } finally {
        conexion.release();
    }
};

// 2. LISTAR PEDIDOS
export const getPedidos = async (req, res) => {
    try {
        const [filas] = await conmysql.query(`SELECT p.*, c.cli_nombre FROM pedidos p JOIN clientes c ON c.cli_id = p.cli_id ORDER BY p.ped_fecha DESC`);
        res.json(filas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. VER DETALLE DE PEDIDO (Asegúrate que este export esté aquí)
export const getPedidoDetalle = async (req, res) => {
    try {
        const { id } = req.params;
        const [detalles] = await conmysql.query(`
            SELECT d.*, pr.prod_nombre, pr.prod_codigo, pr.prod_imagen
            FROM pedidos_detalle d
            JOIN productos pr ON pr.prod_id = d.prod_id
            WHERE d.ped_id = ?
        `, [id]);
        res.json(detalles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
