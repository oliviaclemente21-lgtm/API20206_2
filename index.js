import app from './app.js';
import { PORT } from './config.js';

// El index solo debe escuchar el puerto, app.js ya tiene configurado CORS y JSON.
app.listen(PORT, () => {
    console.log('Servidor ejecutando en el puerto', PORT);
});