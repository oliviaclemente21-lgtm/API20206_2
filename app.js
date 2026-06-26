import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fs from 'fs'; 
import clientesRoutes from './routes/clientes.routes.js';
import productosRoutes from './routes/productos.routes.js'; // 💡 NUEVO: Importamos las rutas de productos
import pedidosRoutes from './routes/pedidos.routes.js'; // 🛒 NUEVO: Rutas del carrito / pago

const app = express();
const CLAVE_SECRETA = "FirmaSecretaDeMariaOlivia2026";

// Crear la carpeta 'uploads' si no existe al arrancar la app
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Configuración de CORS y JSON
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], credentials: true }));
app.use(express.json());

// Servir la carpeta 'uploads' de manera estática
app.use('/uploads', express.static('uploads'));

// Login
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;
    if (usuario === "maria" && password === "12345") {
        const token = jwt.sign({ nombre: "Maria Olivia" }, CLAVE_SECRETA, { expiresIn: '2h' });
        return res.json({ token, idUsuario: '1', nombreUsuario: 'Maria' });
    }
    return res.status(401).json({ error: "Credenciales incorrectas" });
});

// Middleware JWT
function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ error: "Acceso denegado" });
    try {
        req.usuario = jwt.verify(token, CLAVE_SECRETA);
        next();
    } catch (error) {
        return res.status(401).json({ error: "Token inválido" });
    }
}

// 💡 RUTAS PROTEGIDAS (Ahora protegen tanto a clientes como a productos con el Token)
app.use('/api', verificarToken, clientesRoutes);
app.use('/api', verificarToken, productosRoutes); // 💡 NUEVO: Activamos las rutas de productos bajo la seguridad del Token
app.use('/api', verificarToken, pedidosRoutes); // 🛒 NUEVO: Activamos las rutas de pedidos (carrito / pago)

// Error 404
app.use((req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

export default app;
