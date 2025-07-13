const nodeExternals = require('webpack-node-externals');

/** @type {import('webpack').Configuration} */
module.exports = {
  externals: [
    nodeExternals({
      allowlist: ['@nestjs/microservices'], // deja esto si usas microservicios
      additionalModuleDirs: ['node_modules'],
      // 👇 EXCLUYE sharp del bundle para usar sus binarios nativos
      modulesFromFile: true
    }),
    'sharp', // 👈 importante: ignora `sharp` para usarlo como CommonJS en runtime
  ],
  target: 'node',
};
