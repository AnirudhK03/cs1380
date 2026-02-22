// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").Node} Node
 *
 * @typedef {Object} Groups
 * @property {(config: Config | string, group: Object.<string, Node>, callback: Callback) => void} put
 * @property {(name: string, callback: Callback) => void} del
 * @property {(name: string, callback: Callback) => void} get
 * @property {(name: string, node: Node, callback: Callback) => void} add
 * @property {(name: string, node: string, callback: Callback) => void} rem
 */

/**
 * @param {Config} config
 * @returns {Groups}
 */
function groups(config) {
  const context = {gid: config.gid || 'all'};

  /**
   * @param {Config | string} config
   * @param {Object.<string, Node>} group
   * @param {Callback} callback
   */
  function put(config, group, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'groups', method: 'put'};

    // send [config, group] to every node — each node calls local.groups.put(config, group)
    distribution[context.gid].comm.send([config, group], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  /**
   * @param {string} name
   * @param {Callback} callback
   */
  function del(name, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'groups', method: 'del'};

    // copy from above pretty much
    distribution[context.gid].comm.send([name], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  /**
   * @param {string} name
   * @param {Callback} callback
   */
  function get(name, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'groups', method: 'get'};

    // copy from above pretty much
    distribution[context.gid].comm.send([name], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  /**
   * @param {string} name
   * @param {Node} node
   * @param {Callback} callback
   */
  function add(name, node, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'groups', method: 'add'};

    // copy from above pretty much
    distribution[context.gid].comm.send([name, node], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  /**
   * @param {string} name
   * @param {string} node
   * @param {Callback} callback
   */
  function rem(name, node, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'groups', method: 'rem'};

    // copy from above pretty much
    distribution[context.gid].comm.send([name, node], remote, function(errors, values) {
      callback(errors, values);
    });
  }

  return {
    put, del, get, add, rem,
  };
}

module.exports = groups;
