import { conmysql } from '../db.js';

export const postPedido = async (req, res) => {
    // Ajustado para recibir los campos del JSON que enviaste
    const { 
        cli_id, cli_identificacion, cli_nombre, cli_telefono, cli_correo, 
        cli_direccion, cli_pais, cli_ciudad, ped_fecha, usr_id, ped_estado, detalle 
    } = req.body;

    const conn = await conmysql.getConnection();

    try {
        await conn.beginTransaction();

        let idCliente = Number(cli_id);

        // 1. Lógica para crear cliente si es nuevo (cli_id == 0)
        if (idCliente === 0) {
            const [result] = await conn.query(
                `INSERT INTO clientes (cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad) 
                 VALUES (?,?,?,?,?,?,?)`,
                [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad]
            );
            idCliente = result.insertId;
        }

        // 2. Validación de detalle
        if (!detalle || !Array.isArray(detalle) || detalle.length === 0) {
            throw new Error("El pedido debe tener al menos un producto en el detalle");
        }

        // 3. Verificamos stock y calculamos total
        let ped_total = 0;
        for (const item of detalle) {
            const [filas] = await conn.query(
                'SELECT prod_stock, prod_nombre FROM productos WHERE prod_id = ? FOR UPDATE',
                [item.prod_id]
            );

            if (filas.length === 0) throw new Error(`El producto ${item.prod_id} no existe`);
            if (filas[0].prod_stock < item.det_cantidad) {
                throw new Error(`Stock insuficiente para "${filas[0].prod_nombre}"`);
            }
            ped_total += (Number(item.det_precio) * Number(item.det_cantidad));
        }

        // 4. Insertar Pedido
        const [resultadoPedido] = await conn.query(
            'INSERT INTO pedidos (cli_id, usr_id, ped_fecha, ped_estado) VALUES (?, ?, ?, ?)',
            [idCliente, usr_id || 1, ped_fecha, ped_estado || 1]
        );

        const ped_id = resultadoPedido.insertId;

        // 5. Insertar Detalle
        for (const item of detalle) {
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
        res.status(201).json({ ped_id, message: "Pedido registrado con éxito" });

    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ message: error.message });
    } finally {
        conn.release();
    }
};
