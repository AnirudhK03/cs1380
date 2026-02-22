// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").Node} Node
 *
 * @typedef {Object} Status
 * @property {(configuration: string, callback: Callback) => void} get
 * @property {(configuration: Node, callback: Callback) => void} spawn
 * @property {(callback: Callback) => void} stop
 */

/**
 * @param {Config} config
 * @returns {Status}
 */
function status(config) {
  const context = {};
  context.gid = config.gid || 'all';

  /**
   * @param {string} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    var distribution = globalThis.distribution;
    var remote = {service: 'status', method: 'get'};

    // ask every node in the group for this status value
    distribution[context.gid].comm.send([configuration], remote, function(errors, values) {
      // errir handle
      if (Object.keys(values).length === 0) {
        callback(errors, values);
        return;
      }

      // get all results differently depending on what was asked for
      if (configuration === 'nid' || configuration === 'sid') {
        // a plain array of all the values
        callback(errors, Object.values(values));
      } else if (configuration === 'heapTotal') {
        // add all heap sizes together into one number
        var total = 0;
        var allValues = Object.values(values);
        for (var i = 0; i < allValues.length; i++) {
          total = total + allValues[i];
        }
        callback(errors, total);
      } else {
        // for everything else 
        callback(errors, values);
      }
    });
  }

  /**
   * @param {Node} configuration
   * @param {Callback} callback
   */
  function spawn(configuration, callback) {
    var distribution = globalThis.distribution;
    var gid = context.gid;

    // start the new node process on this machine
    distribution.local.status.spawn(configuration, function(e, v) {
      if (e) {
        callback(e, null);
        return;
      }

      // tell every existing node in the group to add the new node
      // each node will call local.groups.add(gid, newNode) on itself
      var remote = {service: 'groups', method: 'add'};
      distribution[gid].comm.send([gid, configuration], remote, function(errors, values) {
        callback(errors, values);
      });
    });
  }

  /**
   * @param {Callback} callback
   */
  function stop(callback) {
    var distribution = globalThis.distribution;
    var gid = context.gid;

    // figure out which node is thid node so we can skip ourselves
    var localSid = distribution.util.id.getSID(distribution.node.config);

    // get all nodes currently in this group
    distribution.local.groups.get(gid, function(err, group) {
      if (err) {
        callback(err, null);
        return;
      }

      // build a list of all nodes except ourselves
      var nodeIds = Object.keys(group);
      var remoteNodeIds = [];
      for (var i = 0; i < nodeIds.length; i++) {
        if (nodeIds[i] !== localSid) {
          remoteNodeIds.push(nodeIds[i]);
        }
      }

      // if there are no remote nodes, nothing to do
      if (remoteNodeIds.length === 0) {
        callback(null, {});
        return;
      }

      /** @type {Object.<string, Error>} */
      var errors = {};
      /** @type {Object.<string, any>} */
      var values = {};
      var count = 0;
      var total = remoteNodeIds.length;

      // stop signal to every remote node
      for (let i = 0; i < remoteNodeIds.length; i++) {
        let sid = remoteNodeIds[i];
        let node = group[sid];

        var remote = {node: node, service: 'status', method: 'stop'};

        distribution.local.comm.send([], remote, function(e, v) {
          if (e) {
            errors[sid] = e;
          } else {
            values[sid] = v;
          }
          count = count + 1;
          if (count === total) {
            callback(errors, values);
          }
        });
      }
    });
  }

  return {get, stop, spawn};
}

module.exports = status;
