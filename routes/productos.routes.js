import { Router } from 'express';
import { postProducto, putProducto, getProductos } from '../controladores/productosCtrl.js';
import upload from '../middlewares/upload.js';

const router = Router();

router.get('/productos', getProductos);

// 💡 CORREGIDO: ambas rutas usan 'imagen' para coincidir con el frontend
router.post('/productos', upload.single('imagen'), postProducto);
router.put('/productos/:id', upload.single('imagen'), putProducto);

export default router;
