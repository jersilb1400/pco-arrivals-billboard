function requireEnv(name, env = process.env) {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function loadServerConfig(env = process.env) {
  return {
    apiSecret: requireEnv('API_SECRET', env),
    turnstileSecretKey: requireEnv('TURNSTILE_SECRET_KEY', env)
  };
}

module.exports = {
  requireEnv,
  loadServerConfig
};
