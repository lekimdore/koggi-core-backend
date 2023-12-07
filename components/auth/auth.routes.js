import { Router } from 'express';
const router = Router();

// Controlador
import {
  getAccessUuidInfo,
  getUserPermission,
  getUserMenyByrol,
  getUserLoginInfoByEmail,
} from './auth.controller.js';

// Endpoint para obtener info de acceso con UUID
router.post('/get-uuid-data', async (req, res) => {
  try {
    let { uuid } = req.body;
    let resultadoUuid = await getAccessUuidInfo(uuid);
    if (resultadoUuid.error) {
      res.status(500).json(resultadoUuid);
    } else {
      res.status(200).json(resultadoUuid);
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// Endpoint para obtener permisos de cliente
router.post('/get-user-permission', async (req, res) => {
  try {
    const userPermission = await getUserPermission(req.body);
    res.status(200).json(userPermission);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo permisos',
      data: { cedula },
      error: error,
      extra: {},
    });
  }
});

// Endpoint para obtener items de menú por rol
router.post('/get-user-meny-byrol', async (req, res) => {
  try {
    const userPermission = await getUserMenyByrol(req.body);
    res.status(200).json(userPermission);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error consultando servicio Sarlaft',
      data: { cedula },
      error: error,
      extra: {},
    });
  }
});

// Endpoint para obtener datos de login y guardarlo en local storage
router.post('/get-useraccess-byemail', async (req, res) => {
  try {
    const userPermission = await getUserLoginInfoByEmail(
      req.body.email,
      req.body.builderKey,
    );
    res.status(200).json(userPermission);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error consultando servicio Sarlaft',
      data: { email: req.body.email },
      error: error,
      extra: {},
    });
  }
});

export default router;
