import GibberishAES from 'dz-gibberish-aes/dist/gibberish-aes-1.0.0.js';
import SecretManager from '../utils/secretManager.js';
import axios from 'axios';

const secretManager = new SecretManager();

/**
 * Metodo comunicación Rest API con  el Backend Koggi Créditos
 * @param {*} requestInfo.method = 'post', 'get'...
 * @param {*} requestInfo.endpoint = texto despues de /api/{endpoint}
 * @param {*} requestInfo.body = JSON body
 */

const sendRequest = async (idUser, email, keyEntity, requestInfo) => {
  try {
    let requestParams = {
      method: requestInfo.method,
      url: `${process.env.BACKEND_KOGGI_API}${requestInfo.endpoint}`,
      headers: {
        'content-type': 'application/json',
      },
    };

    if (requestInfo.method.toLowerCase() == 'post') {
      requestParams.data = requestInfo.body;
    }

    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    let createProjectResponse = await axios(requestParams);

    // Se obtiene la llave para descifrar la respuesta
    let sendedKey = await secretManager.getSecret(process.env.CIFRADO, false);
    let descripRes = JSON.parse(
      GibberishAES.dec(
        Buffer.from(createProjectResponse.data.data, 'base64').toString(),
        sendedKey,
      ),
    );

    return {
      success: true,
      message: 'Conexión backend Koggi Créditos exitosa',
      error: {},
      data: descripRes,
      extra: {
        statusCode: createProjectResponse.status,
        messageKoggi: descripRes.msg,
      },
    };
  } catch (err) {
    return {
      success: false,
      message:
        'Conexión con backend Koggi Créditos presentó un error inesperado',
      data: null,
      error: err,
      extra: {},
    };
  }
};

export default {
  sendRequest,
};
