/** @type {import('pm2').ApplicationDeclaration} */
module.exports = {
  apps: [
    {
      name: 'offmarketdealer',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
