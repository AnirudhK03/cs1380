// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {string} [gid]
 *
 * @typedef {Object} Comm
 * @property {(message: any[], configuration: Target, callback: Callback) => void} send
 */

/**
 * @param {Config} config
 * @returns {Comm}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {any[]} message
   * @param {Target} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    // callback(new Error('comm.send not implemented'));
    var distribution = globalThis.distribution;
    var gid = context.gid;

    // get the list of nodes in this group
    distribution.local.groups.get(gid, function(err, group) {
      if (err) {
        callback(err, null);
        return;
      }

      var nodeIds = Object.keys(group);

      // If the group has no nodes, return an error
      if (nodeIds.length === 0) {
        callback(new Error('comm.send: group is empty'), null);
        return;
      }

      /** @type {Object.<string, Error>} */
      var errors = {};
      /** @type {Object.<string, any>} */
      var values = {};
      var count = 0;
      var total = nodeIds.length;

      // send to every node in the group
      for (let i = 0; i < nodeIds.length; i++) {
        let sid = nodeIds[i];
        let node = group[sid];

        var remote = {
          node: node,
          service: configuration.service,
          method: configuration.method,
          gid: configuration.gid || 'local',
        };

        // collect each response
        distribution.local.comm.send(message, remote, function(e, v) {
          if (e) {
            errors[sid] = e;
          } else {
            values[sid] = v;
          }

          count = count + 1;

          // when all nodes have responded, call the callback
          if (count === total) {
            callback(errors, values);
          }
        });
      }
    });
  }

  return {send};
}

module.exports = comm;
