import SecretManager from '../utils/secretManager';

const secretManager = new SecretManager();

async function getConfigDataBase() {
  const paramsBD = await secretManager.getSecret(process.env.DB_SECRET);
  return paramsBD;
}

export default {
  getConfigDataBase,
};
