import { Router } from 'express';
import { postProducto, putProducto, getProductos } from '../controladores/productosCtrl.js';
import upload from '../middlewares/upload.js';

const router = Router();

router.get('/productos', getProductos);

// 💡 CORREGIDO: El campo se llama 'imagen' igual que en el frontend (productos.page.ts)
router.post('/productos', upload.single('imagen'), postProducto);
router.put('/productos/:id', upload.single('imagen'), putProducto);

export default router;
