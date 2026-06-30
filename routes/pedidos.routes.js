import { Router } from 'express';
// IMPORTANTE: Cambiamos 'postPedido' por 'guardarPedido' para que coincida
import { guardarPedido, getPedidos, getPedidoDetalle } from '../controladores/pedidosCtrl.js';

const router = Router();

router.get('/pedidos', getPedidos);
router.get('/pedidos/:id/detalle', getPedidoDetalle);

// Usamos la nueva función 'guardarPedido' en lugar de 'postPedido'
router.post('/pedidos', guardarPedido);

export default router;
