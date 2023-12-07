import { config } from 'dotenv';

const envs = () => {
  let env = process.env.NODE_ENV || 'local';

  try {
    config({ path: `./env/${env}.env` });
  } catch (error) {
    console.error('Error loading environment variables:', error.message);
  }
};

export default envs;
