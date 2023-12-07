import { createPool as _createPool, createConnection } from 'mysql';
import moment from 'moment-timezone';

import SecretManager from '../utils/secretManager.js';
const secretManager = new SecretManager();

const TIMETOUTQUERYS = 7000;
var pools = {};

const dbConnectionCentral = async () => {
  try {
    return await condition('one-group');
  } catch (e) {
    throw e;
  }
};

const dbConnection = async (key, ignoreInactive = true) => {
  try {
    return await condition(key, ignoreInactive);
  } catch (e) {
    throw e;
  }
};

const dbConnectionByPool = async (key) => {
  const pool = await condition(key);
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connect_) => {
      if (err) {
        reject(err);
      }
      resolve(connect_);
    });
  });
};

condition = (key, ignoreInactive = true) => {
  let pool_obj = pools[key];
  if (pool_obj) {
    const revision = pool_obj.created;
    if (
      moment().tz('America/Bogota').isAfter(moment(revision).add(10, 'minutes'))
    ) {
      deletePool(key);
      pool_obj = undefined;
    }
  }
  return new Promise(async (resolve, reject) => {
    if (!pool_obj) {
      createPool(key, ignoreInactive).then(
        (con) => {
          pools[key] = {
            con: con,
            created: moment().tz('America/Bogota'),
            conexiones: 0,
          };
          try {
            // if (process.env.MICROSERVICIOS) return resolve(con);
            con.query(
              'SELECT table_name FROM information_schema.tables LIMIT 1;',
              [],
              (err, result, fields) => {
                if (err) {
                  console.log('error_conexion_BD ' + key + ' ' + err);
                  return reject(err);
                }
                resolve(con);
              },
            );
          } catch (e) {
            console.log(e);
            console.log('conexiones vivas ' + pools[key].conexiones);
            return reject(e);
          }
        },
        (error) => {
          reject(error);
        },
      );
    } else {
      if (process.env.MICROSERVICIOS) return resolve(pool_obj.con);
      pool_obj.con.query(
        'SELECT table_name FROM information_schema.tables LIMIT 1;',
        [],
        (err, result, fields) => {
          if (err) {
            console.log('conexiones vivas ' + pool_obj.conexiones);
            console.log('error_conexion_BD ' + key + ' ' + err);
            return reject(err);
          }
          return resolve(pool_obj.con);
        },
      );
    }
  });
};

deletePool = (key) => {
  const c = pools[key];
  delete pools[key];
  c.con.end();
};

createPool = async (key, ignoreInactive = true) => {
  if (process.env.CLOUD) {
    if (process.env.NODE_ENV === 'prod') {
      const credentials = await secretManager.getSecret(
        process.env.CENTRAL_CONNECTION,
      );
      credentials['connectionLimit'] = 50;
      credentials['multipleStatements'] = true;
      credentials['acquireTimeout'] = TIMETOUTQUERYS;
      credentials['debug'] = true;
      return _createPool(credentials);
    }
  }

  let entity = await getDataBaseConnection(key, ignoreInactive);
  let credentials = await secretManager.getSecret(entity.data.connection);

  credentials['connectionLimit'] = 50;
  credentials['multipleStatements'] = true;
  credentials['acquireTimeout'] = TIMETOUTQUERYS;
  credentials['debug'] = true;
  // var credentials = getCredentialTemp(entity.data.connection);

  if (!process.env.CLOUD) {
    if (process.env.NODE_ENV === 'qa') {
      switch (key) {
        case 'one-group':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3307;
          break;
        case 'uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3308;
          break;
        case 'amarilo':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3309;
          break;
        case 'bank-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3310;
          break;
        case 'bank-dos':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3311;
          break;
        case 'koggiconst':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3318;
          break;
        case 'cajacb-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3320;
          break;
        case 'cajacc-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3320;
          break;
        case 'build-tres':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3323;
          break;
        case 'bank-tres':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3324;
          break;
      }
    } else if (process.env.NODE_ENV === 'dev') {
      switch (key) {
        case 'one-group':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3312;
          break;
        case 'buil-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3313;
          break;
        case 'buil-dos':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3314;
          break;
        case 'bank-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3315;
          break;
        case 'bank-dos':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3316;
          break;
        case 'koggiconst':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3317;
          break;
        case 'cajacb-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3319;
          break;
        case 'cajacc-uno':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3319;
          break;
        case 'buil-tres':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3321;
          break;
        case 'bank-tres':
          credentials['host'] = '127.0.0.1';
          credentials['port'] = 3322;
          break;
      }
    }
    delete credentials['socketPath'];
  }
  pool = _createPool(credentials);
  return pool;
};

getDataBaseConnection = async (key_connection, ignoreInactive = true) => {
  let sql;
  if (ignoreInactive) sql = `call get_database_connection(?);`;
  else sql = `call get_database_all_connection(?);`;
  let params = [key_connection];

  const credentials = await secretManager.getSecret(
    process.env.CENTRAL_CONNECTION,
  );

  if (!process.env.CLOUD) {
    if (process.env.NODE_ENV === 'qa') {
      credentials['host'] = '127.0.0.1';
      credentials['port'] = 3307;
    } else if (process.env.NODE_ENV === 'dev') {
      credentials['host'] = '127.0.0.1';
      credentials['port'] = 3312;
    }
    delete credentials['socketPath'];
  }
  const con = createConnection(credentials);

  return new Promise((resolve, reject) => {
    con.query(sql, params, (err, result) => {
      con.end();
      if (err) {
        console.log(err);
        reject(err);
      } else {
        //console.log('aqui', result);
        resolve({
          error: false,
          data: JSON.parse(JSON.stringify(result[0]))[0],
        });
      }
    });
  });
};

export default {
  dbConnectionCentral,
  dbConnection,
  dbConnectionByPool,
};
