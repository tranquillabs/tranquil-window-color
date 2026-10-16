// This package's settings keys, built from package.json: the package's name and its
// configSchema. A renamed or misspelled setting throws here instead of silently reading
// undefined.
const { name, configSchema } = require('../package.json');

function setting(key) {
  if (!Object.prototype.hasOwnProperty.call(configSchema, key)) {
    throw new Error(`${name}: "${key}" is not a setting in package.json configSchema`);
  }
  return `${name}.${key}`;
}

module.exports = { PACKAGE: name, setting };
