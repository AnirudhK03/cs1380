// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 *
 * @typedef {Object} Routes
 * @property {(service: object, name: string, callback: Callback) => void} put
 * @property {(configuration: string, callback: Callback) => void} rem
 */

/**
 * @param {Config} config
 * @returns {Routes}
 */
function routes(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {object} service
   * @param {string} name
   * @param {Callback} callback
   */
  function put(service, name, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'routes', method: 'put'};

    // same thing
    distribution[context.gid].comm.send([service, name], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  /**
   * @param {string} configuration
   * @param {Callback} callback
   */
  function rem(configuration, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'routes', method: 'rem'};

    // sam thing
    distribution[context.gid].comm.send([configuration], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  return {put, rem};
}

module.exports = routes;
