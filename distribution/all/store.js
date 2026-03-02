// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Hasher} Hasher
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */


/**
 * @param {Config} config
 */
function store(config) {
  const context = {
    gid: config.gid || 'all',
    hash: config.hash || globalThis.distribution.util.id.naiveHash,
    subset: config.subset,
  };

  // helper to get the one node responsible for a key
  function getTargetNode(key, callback) {
    var distribution = globalThis.distribution;
    var id = distribution.util.id;

    distribution.local.groups.get(context.gid, function(err, group) {
      if (err) {
        callback(err);
        return;
      }

      // map each node to its NID so we can look it up after hashing
      var nidToNode = {};
      var nodes = Object.values(group);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var nid = id.getNID(node);
        nidToNode[nid] = node;
      }

      var nids = Object.keys(nidToNode);
      var kid = id.getID(key);
      var targetNID = context.hash(kid, nids);
      var targetNode = nidToNode[targetNID];
      callback(null, targetNode);
    });
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    var key;
    if (typeof configuration === 'string') {
      key = configuration;
    } else if (configuration !== null && configuration.key !== null) {
      key = configuration.key;
    } else {
      key = null;
    }

    if (key === null) {
      callback(new Error('store.get: no key provided'), null);
      return;
    }

    getTargetNode(key, function(err, targetNode) {
      if (err) {
        callback(err, null);
        return;
      }
      var remote = {node: targetNode, service: 'store', method: 'get'};
      var message = [{key: key, gid: context.gid}];
      globalThis.distribution.local.comm.send(message, remote, callback);
    });
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function put(state, configuration, callback) {
    var id = globalThis.distribution.util.id;
    var key;

    if (typeof configuration === 'string') {
      key = configuration;
    } else if (configuration !== null && configuration.key !== null) {
      key = configuration.key;
    } else {
      key = null;
    }

    if (key === null) {
      key = id.getID(state);
    }

    getTargetNode(key, function(err, targetNode) {
      if (err) {
        callback(err, null);
        return;
      }
      var remote = {node: targetNode, service: 'store', method: 'put'};
      var message = [state, {key: key, gid: context.gid}];
      globalThis.distribution.local.comm.send(message, remote, callback);
    });
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function append(state, configuration, callback) {
    return callback(new Error('store.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function del(configuration, callback) {
    var key;
    if (typeof configuration === 'string') {
      key = configuration;
    } else if (configuration !== null && configuration.key !== null) {
      key = configuration.key;
    } else {
      key = null;
    }

    if (key === null) {
      callback(new Error('store.del: no key provided'), null);
      return;
    }

    getTargetNode(key, function(err, targetNode) {
      if (err) {
        callback(err, null);
        return;
      }
      var remote = {node: targetNode, service: 'store', method: 'del'};
      var message = [{key: key, gid: context.gid}];
      globalThis.distribution.local.comm.send(message, remote, callback);
    });
  }

  /**
   * @param {Object.<string, Node>} configuration
   * @param {Callback} callback
   */
  function reconf(configuration, callback) {
    return callback(new Error('store.reconf not implemented'));
  }

  /* For the distributed store service, the configuration will
          always be a string */
  return {get, put, append, del, reconf};
}

module.exports = store;
