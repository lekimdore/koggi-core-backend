import axios from 'axios';
import dbConnectionCentral from '../../db/mysql_config.js';
import BackendKoggiCredit from '../../utils/backendKoggiCredit.js';
import { getAuth } from 'firebase/auth';

/**
 * Metodo para obtener datos de accesso para login de cliente
 */
export const getAccessUuidInfo = async (uuid) => {
  try {
    let sql = `SELECT * FROM tbl_accesstoken_ventas WHERE encriptedAccess = '${uuid}' AND tokenExpired = 0;`;
    const con = await dbConnectionCentral();

    return new Promise((resolve, reject) => {
      con.query(sql, async (err, result) => {
        if (err)
          reject({
            success: false,
            message: 'Error obteniendo informacion de acceso con UUID',
            data: null,
            error: err,
            extra: {},
          });
        else {
          if (result.length == 0)
            reject({
              success: false,
              message: 'El UUID ya ha expirado',
              data: null,
              error: true,
            });
          expireSelectedToken(uuid);
          resolve({
            success: true,
            message: 'Informacion de acceso con UUID obtenida con exito',
            data: result[0],
            error: null,
            extra: {},
          });
        }
      });
    });
  } catch (error) {
    console.error('Error obteniendo informacion de acceso con UUID:', error);
    return {
      success: false,
      message: 'Error obteniendo informacion de acceso con UUID',
      data: null,
      error: error,
      extra: {},
    };
  }
};

// Todos los "qs_acc" tienen rutas por proteger a demas de los posibles permisos de botonería
const routesPerms = {
  qs_acc_profiling: '/venta/profiling',
  qs_acc_followup: '/venta/followup',
};

/**
 * Metodo para consultar permisos de usuario
 */
export const getUserPermission = async (userData) => {
  try {
    const userRoleInfo = await getUserRoleByEmail(userData.email, userData.key);
    let user = {
      permission: {},
      role: [],
    };
    const userPerms = await validateExtra(user, userRoleInfo);

    let globalPerms = {
      role: userPerms.role,
      permission: {},
    };

    for (let perm in userPerms.permission) {
      const item = userPerms.permission[perm].p[0];
      const routes = userPerms.routing;
      for (let itmPerm in item) {
        const itemLabel = item[itmPerm].label;
        const rtDta = routes.filter((rtd) => rtd.label == itemLabel);
        const status = item[itmPerm].status;
        if (rtDta.length == 0 && itmPerm.startsWith('qs_acc')) {
          globalPerms.permission[itmPerm] = {
            access_permision: status == 1 ? true : false,
          };
          globalPerms.permission[routesPerms[itmPerm]] = {
            access_permision: status == 1 ? itmPerm : null,
          };
          continue;
        }
        const ruta = rtDta[0].route;
        globalPerms.permission[ruta] = {
          access_permision: status == 1 ? itmPerm : null,
        };
      }
    }
    return {
      success: true,
      message: 'Obtención permisos usuario',
      data: globalPerms,
    };
  } catch (error) {
    console.error('Obtención permisos usuario, Error:', error);
    return {
      success: false,
      message: 'Obtención permisos usuario falló',
      data: null,
      error: error,
      extra: {},
    };
  }
};

/**
 * Metodo para consultar el menú por rol
 */
export const getUserMenyByrol = async (menuData) => {
  try {
    const rolResp = await getMenyByrol(menuData);
    return {
      success: true,
      message: 'Obtención permisos usuario',
      data: rolResp,
    };
  } catch (error) {
    console.error('Obtención permisos usuario, Error:', error);
    return {
      success: false,
      message: 'Obtención permisos usuario falló',
      data: null,
      error: error,
      extra: {},
    };
  }
};

/**
 * Metodo para consultar información de login para local de cliente
 * @param {*} userEmail
 * @returns
 */
export const getUserLoginInfoByEmail = async (userEmail, builderKey) => {
  try {
    /**
     *  'key', 'email', 'roles', 'idUser'
     */
    const sql = `
      SELECT tur.id_role as user_role, tu.email as user_email, tu.id as user_id FROM tbl_user tu
        LEFT JOIN tbl_user_role tur
          ON tu.id = tur.id_user
      WHERE tu.email = '${userEmail}';
    `;

    const requestInfo = {
      body: { sql, builderKey },
      method: 'post',
      endpoint: `/onebank/builder_clients/get-client-role-permissions`,
    };
    const userRolePermissions = await BackendKoggiCredit.sendRequest(
      '',
      userEmail,
      '',
      requestInfo,
    );
    return userRolePermissions.data.data[0];
  } catch (error) {
    console.error('Obtención información de usuario en accesso, Error:', error);
    return {
      success: false,
      message: 'Obtención información de usuario en accesso falló',
      data: null,
      error: error,
      extra: {},
    };
  }
};

// ---------------------- Metodos privados --------------------

// Metodo para expirar token usado
const expireSelectedToken = async (uuid) => {
  try {
    const sql = `UPDATE tbl_accesstoken_ventas SET tokenExpired = 1 WHERE encriptedAccess = '${uuid}';`;
    return new Promise(async (resolve, reject) => {
      const con = await db_connection.dbConnectionCentral();
      con.query(sql, function (err, result) {
        if (err) resolve(false);
        else resolve(true);
      });
    });
  } catch (error) {
    return false;
  }
};

// Metodo para obtener items de menú por rol
const getUserRoleByEmail = async (email, connection) => {
  try {
    const sql = `
      call getUserByToken("${email}");
      SELECT * FROM tbl_modules WHERE access_permision LIKE "%qs_%"
    `;
    const queryBody = {
      entityKey: connection,
      querySql: sql,
    };
    const resultQuer = await queryEntity(queryBody, 'post');
    const result = resultQuer.response.data;
    const newResCero = result[0].filter((item, i) => {
      if (item.access_permision && item.access_permision.startsWith('qs_')) {
        const accessName = item.access_permision;
        const router = result[4].filter(
          (rtItem) => rtItem.access_permision == accessName,
        );
        const routingObj = JSON.parse(router[0].routing);
        result[0][i]['routing'] = routingObj.children;
        return true;
      } else return false;
    });
    return {
      userData: newResCero,
      ips: result[1],
      ips_settings: result[2],
    };
  } catch (err) {
    return err;
  }
};

// Validación de permisos de menú lateral front ventas
const validateExtra = async (user, result) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < result.userData.length; i++) {
        const element = result.userData[i];
        if (element.id_role) {
          const obj = user.role.find((x) => x == element.id_role);
          if (!obj) user.role.push(element.id_role);
        }
        if (element.custom_value && element.route) {
          if (!user.permission[element.route])
            user.permission[element.route] = {
              access_permision: element.access_permision,
              p: [],
            };
          user.permission[element.route].p.push(
            JSON.parse(element.custom_value),
          );
          user.routing = element.routing;
        }
      }
      resolve(user);
    } catch (error) {
      reject(error);
    }
  });
};

// Metodo para obtener los items de menú activos por rol en constructora
const getMenyByrol = async (rolInfo) => {
  try {
    const rol = rolInfo.rol;
    const sql = `SELECT m.routing FROM appdb.tbl_role tr
        INNER JOIN (
          select c.* from tbl_role_custom_module c
                JOIN (
                  select ext0.* from (select id_module,id_rol,max(a.id) as id from appdb.tbl_role_custom_module a
                        join tbl_module_custom b ON a.id_module_custom = b.id 
                      group by id_module,id_rol) ext0
                        JOIN appdb.tbl_modules m1
                        on m1.id = ext0.id_module
                        JOIN tbl_role_custom_module mr0
                        on mr0.id = ext0.id
                        JOIN tbl_module_custom mc0
                        on mc0.id = mr0.id_module_custom
                        and
                        JSON_EXTRACT(mc0.custom_value,CONCAT('$.',m1.access_permision,'.status')) IS TRUE)
                d on c.id = d.id
          ) trcm 
          on trcm.id_rol = tr.id
          and trcm.state = true
        LEFT JOIN appdb.tbl_module_custom mc 
          on mc.id = trcm.id_module_custom
        LEFT JOIN appdb.tbl_modules m
          on m.id = mc.id_module && m.service = 'KV'
        where tr.id = ${rol[0]}
        and m.enable = 1
        order by m.id`;

    const queryBody = {
      entityKey: rolInfo.key,
      querySql: sql,
    };

    const resultQuer = await queryEntity(queryBody, 'post');
    const result = resultQuer.response.data;

    let data = [];
    await result.forEach((element) => {
      data.push(JSON.parse(element.routing));
    });
    return data;
  } catch (err) {
    return err;
  }
};

// Metodo para obtener los items de menú activos por rol en constructora
// const getMenyByrol_old = async (rolInfo) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const con = await db_connection.dbConnection(rolInfo.key)
//       const rol = rolInfo.rol;
//       const sql = `SELECT m.routing FROM appdb.tbl_role tr
//           INNER JOIN (
//             select c.* from tbl_role_custom_module c
//                   JOIN (
//                     select ext0.* from (select id_module,id_rol,max(a.id) as id from appdb.tbl_role_custom_module a
//                           join tbl_module_custom b ON a.id_module_custom = b.id
//                         group by id_module,id_rol) ext0
//                           JOIN appdb.tbl_modules m1
//                           on m1.id = ext0.id_module
//                           JOIN tbl_role_custom_module mr0
//                           on mr0.id = ext0.id
//                           JOIN tbl_module_custom mc0
//                           on mc0.id = mr0.id_module_custom
//                           and
//                           JSON_EXTRACT(mc0.custom_value,CONCAT('$.',m1.access_permision,'.status')) IS TRUE)
//                   d on c.id = d.id
//             ) trcm
//             on trcm.id_rol = tr.id
//             and trcm.state = true
//           LEFT JOIN appdb.tbl_module_custom mc
//             on mc.id = trcm.id_module_custom
//           LEFT JOIN appdb.tbl_modules m
//             on m.id = mc.id_module && m.service = 'KV'
//           where tr.id = ${rol[0]}
//           and m.enable = 1
//           order by m.id`;

//     con.query(sql, async function (err, result, fields) {
//       if (err) throw err;
//       else {
//         let data = []
//         await result.forEach(element => {
//           data.push(JSON.parse(element.routing))
//         });
//         resolve(data);
//       };
//     });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

/**
 * Método general para ejecutar un query
 * @param {*} sql string sql
 * @param {*} params Arrglo de parametros
 * @param {*} dbKey Si = '' o no se envía data conecta a central, de lo contrario enviar key de db
 * @returns
 */
const userGlobalQuery = async (sql, params, builderKey) => {
  const con = await db_connection.dbConnection(builderKey);
  return new Promise((resolve, reject) => {
    con.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const queryEntity = async (body, queryType = 'get') => {
  try {
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    let requestParams = {
      method: queryType,
      url: `${process.env.BACKEND_KOGGI_API}/entity/queryEntity`,
      headers: {
        'content-type': 'application/json',
      },
    };

    if (queryType.toLowerCase() == 'post') requestParams.data = body;

    const queryEntityResponse = await axios(requestParams);
    if (queryEntityResponse.status != 200)
      throw 'Error axios consumiendo endpoint api/entity/queryEntity';
    return { err: false, response: queryEntityResponse.data };
  } catch (e) {
    return { err: true, error: e };
  }
};

// export default {
//   getAccessUuidInfo,
//   getUserPermission,
//   getUserMenyByrol,
//   getUserLoginInfoByEmail,
// };
