import { Router } from 'express';
import { postPedido, getPedidos, getPedidoDetalle } from '../controladores/pedidosCtrl.js';

const router = Router();

router.get('/pedidos', getPedidos);
router.get('/pedidos/:id/detalle', getPedidoDetalle);
router.post('/pedidos', postPedido); // <--- Coincide con 'postPedido' en el controlador

export default router;
