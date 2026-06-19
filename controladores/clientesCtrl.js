import { conmysql } from '../db.js';

// Consultar todos los clientes
export const getClientes = async (req, res) => {
    try {
        const [result] = await conmysql.query(
            'SELECT * FROM clientes'
        );
        res.json(result);
    } catch (error) {
        console.error("Error exacto en getClientes:", error);
        return res.status(500).json({
            message: "Error al consultar clientes",
            error_mysql: error.message,
            codigo_error: error.code
        });
    }
};

// Consultar cliente por ID
export const getClientesxid = async (req, res) => {
    try {
        const [result] = await conmysql.query(
            'SELECT * FROM clientes WHERE cli_id = ?',
            [req.params.id]
        );

        if (result.length <= 0) {
            return res.json({
                cantidad: 0,
                message: "Cliente no encontrado"
            });
        }

        res.json({
            cantidad: result.length,
            informacion: result[0]
        });

    } catch (error) {
        console.error("Error exacto en getClientesxid:", error);
        return res.status(500).json({
            message: "Error en el servidor",
            error_mysql: error.message
        });
    }
};

// Insertar cliente SIN foto obligatoria
export const postInsertarCliente = async (req, res) => {
    try {
        const { cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad } = req.body;

        // La foto es OPCIONAL: si viene se guarda, si no se guarda NULL
        const cli_foto = req.file ? req.file.path : null;

        const [result] = await conmysql.query(
            `INSERT INTO clientes(cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad, cli_foto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cli_identificacion,
                cli_nombre,
                cli_telefono,
                cli_correo,
                cli_direccion,
                cli_pais,
                cli_ciudad,
                cli_foto
            ]
        );

        res.json({
            cli_id: result.insertId,
            message: "Cliente registrado correctamente"
        });

    } catch (error) {
        console.error("Error exacto en postInsertarCliente:", error);
        return res.status(500).json({
            message: "Error en el servidor al insertar",
            error_mysql: error.message
        });
    }
};

// Actualizar cliente (PUT) - la foto es OPCIONAL
export const putCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad } = req.body;

        // Si viene foto nueva se actualiza, si no se conserva la actual
        let query;
        let params;

        if (req.file) {
            const cli_foto = req.file.path;
            query = `UPDATE clientes
                SET cli_identificacion=?,
                    cli_nombre=?,
                    cli_telefono=?,
                    cli_correo=?,
                    cli_direccion=?,
                    cli_pais=?,
                    cli_ciudad=?,
                    cli_foto=?
                WHERE cli_id=?`;
            params = [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad, cli_foto, id];
        } else {
            query = `UPDATE clientes
                SET cli_identificacion=?,
                    cli_nombre=?,
                    cli_telefono=?,
                    cli_correo=?,
                    cli_direccion=?,
                    cli_pais=?,
                    cli_ciudad=?
                WHERE cli_id=?`;
            params = [cli_identificacion, cli_nombre, cli_telefono, cli_correo, cli_direccion, cli_pais, cli_ciudad, id];
        }

        const [result] = await conmysql.query(query, params);

        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.json({
            message: "Cliente actualizado correctamente"
        });

    } catch (error) {
        console.error("Error exacto en putCliente:", error);
        return res.status(500).json({
            message: "Error en el servidor al actualizar (PUT)",
            error_mysql: error.message
        });
    }
};

// Actualización parcial (PATCH)
export const patchCliente = async (req, res) => {
    try {
        const { id } = req.params;

        let datosActualizar = { ...req.body };

        if (req.file) {
            datosActualizar.cli_foto = req.file.path;
        }

        const [result] = await conmysql.query(
            'UPDATE clientes SET ? WHERE cli_id = ?',
            [datosActualizar, id]
        );

        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.json({
            message: "Cliente actualizado parcialmente"
        });

    } catch (error) {
        console.error("Error exacto en patchCliente:", error);
        return res.status(500).json({
            message: "Error en el servidor al actualizar (PATCH)",
            error_mysql: error.message
        });
    }
};

// Eliminar cliente
export const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await conmysql.query(
            'DELETE FROM clientes WHERE cli_id=?',
            [id]
        );

        if (result.affectedRows <= 0) {
            return res.status(404).json({
                message: "Cliente no encontrado"
            });
        }

        res.json({
            message: "Cliente eliminado correctamente"
        });

    } catch (error) {
        console.error("Error exacto en deleteCliente:", error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                message: "No se puede eliminar el cliente porque tiene pedidos asociados"
            });
        }

        return res.status(500).json({
            message: error.message
        });
    }
};
