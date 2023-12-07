/**
 * @Description   : En este archivo se gestionan las rutas de entrada de los APIs expuestos por el backend
 * @Author        : Koggi
 * @Fecha         : 01/08/2023
 * @Observaciones :
 */

import authRouter from './auth/auth.routes';

const registerApiRoutes = (app) => {
  app.use('/api/auth', authRouter);
};

export default registerApiRoutes;
