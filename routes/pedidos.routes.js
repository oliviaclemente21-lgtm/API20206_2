import { Router } from 'express';
// IMPORTANTE: Aquí cambiamos 'postPedido' por 'guardarPedido'
import { guardarPedido, getPedidos, getPedidoDetalle } from '../controladores/pedidosCtrl.js';

const router = Router();

router.get('/pedidos', getPedidos);
router.get('/pedidos/:id/detalle', getPedidoDetalle);

// Usamos la función 'guardarPedido' que acabamos de definir en el controlador
router.post('/pedidos', guardarPedido);

export default router;
