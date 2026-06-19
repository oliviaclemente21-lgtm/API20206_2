import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { 
    getClientes, 
    getClientesxid, 
    postInsertarCliente, 
    putCliente, 
    patchCliente, 
    deleteCliente 
} from '../controladores/clientesCtrl.js';

const router = Router();

// 1. Configuración de Multer para definir dónde y cómo se guardan las fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista en la raíz de tu proyecto
    },
    filename: (req, file, cb) => {
        // Genera un nombre único: cliente-fecha-numeroAleatorio.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cliente-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro opcional para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo debe ser una imagen válida (jpg, png, etc.)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por imagen
});

// Rutas

// GET no cambia porque solo consulta datos
router.get('/clientes', getClientes);
router.get('/clientes/:id', getClientesxid);

// 2. CORRECCIÓN EN POST: Agregamos el middleware upload.single('foto')
// 'foto' es el nombre de la propiedad (key) que debes enviar desde Postman o tu Frontend
router.post('/clientes', upload.single('foto'), postInsertarCliente);

// 3. CORRECCIÓN EN PUT/PATCH: Si vas a permitir actualizar la foto del cliente, 
// también debes agregar el middleware aquí.
router.put('/clientes/:id', upload.single('foto'), putCliente);
router.patch('/clientes/:id', upload.single('foto'), patchCliente);

router.delete('/clientes/:id', deleteCliente);

export default router;