import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

class SecretManager {
  constructor() {
    this.client = new SecretManagerServiceClient();
  }

  async getSecret(name, object = true) {
    try {
      const [secret] = await this.client.accessSecretVersion({
        name,
      });
      let data = secret.payload.data.toString();
      // La información de algunas secret esta almacenada con JSON y otras como texto(object usar false para estos casos)
      return object ? JSON.parse(data) : data;
    } catch (error) {
      throw {
        message: 'Error leyendo la información del secreto: ' + name,
        error,
      };
    }
  }

  async addSecretVersion(parent, payload) {
    const [version] = await this.client.addSecretVersion({
      parent,
      payload: {
        data: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    });
    return version;
  }
}

export default SecretManager;
