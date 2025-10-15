#!/usr/bin/env node

import('../dist/index.js').then(module => {
  module.main(process.argv);
}).catch(error => {
  console.error('Error starting Websolut CLI:', error);
  process.exit(1);
});
