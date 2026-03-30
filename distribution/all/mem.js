// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 *
 * @typedef {Object} Mem
 * @property {(configuration: SimpleConfig, callback: Callback) => void} get
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} put
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} append
 * @property {(configuration: SimpleConfig, callback: Callback) => void} del
 * @property {(configuration: Object.<string, Node>, callback: Callback) => void} reconf
 */


/**
 * @param {Config} config
 * @returns {Mem}
 */
function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || globalThis.distribution.util.id.naiveHash;

  /**
   * Looks up the group, hashes the key to pick one node,
   * and calls back with that node object.
   * @param {string} key
   * @param {(err: Error | null, node?: Node) => void} callback
   */
  function getTargetNode(key, callback) {
    const distribution = globalThis.distribution;
    const id = distribution.util.id;

    distribution.local.groups.get(context.gid, (err, group) => {
      if (err) return callback(err);
      const nidToNode = {};
      for (const node of Object.values(group)) {
        nidToNode[id.getNID(node)] = node;
      }

      const nids = Object.keys(nidToNode);
      const kid = id.getID(key);
      const targetNID = context.hash(kid, nids);
      callback(null, nidToNode[targetNID]);
    });
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    const key = typeof configuration === 'string' ? configuration
      : (configuration && configuration.key) ? configuration.key : null;

    if (key === null) return callback(new Error('mem.get: no key provided'), null);

    const remoteGid = (configuration && typeof configuration === 'object' && configuration.gid) ? configuration.gid : context.gid;
    getTargetNode(key, (err, targetNode) => {
      if (err) return callback(err, null);
      const remote = {node: targetNode, service: 'mem', method: 'get'};
      globalThis.distribution.local.comm.send([{key, gid: remoteGid}], remote, callback);
    });
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function put(state, configuration, callback) {
    const id = globalThis.distribution.util.id;

    let key = typeof configuration === 'string' ? configuration
      : (configuration && configuration.key) ? configuration.key : null;

    if (key === null) key = id.getID(state);

    const remoteGid = (configuration && typeof configuration === 'object' && configuration.gid) ? configuration.gid : context.gid;
    getTargetNode(key, (err, targetNode) => {
      if (err) return callback(err, null);
      const remote = {node: targetNode, service: 'mem', method: 'put'};
      globalThis.distribution.local.comm.send([state, {key, gid: remoteGid}], remote, callback);
    });
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function append(state, configuration, callback) {
    const id = globalThis.distribution.util.id;

    let key = typeof configuration === 'string' ? configuration
      : (configuration && configuration.key) ? configuration.key : null;

    if (key === null) return callback(new Error('mem.append: no key provided'), null);

    const remoteGid = (configuration && typeof configuration === 'object' && configuration.gid) ? configuration.gid : context.gid;
    getTargetNode(key, (err, targetNode) => {
      if (err) return callback(err, null);
      const remote = {node: targetNode, service: 'mem', method: 'append'};
      globalThis.distribution.local.comm.send([state, {key, gid: remoteGid}], remote, callback);
    });
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function del(configuration, callback) {
    const key = typeof configuration === 'string' ? configuration
      : (configuration && configuration.key) ? configuration.key : null;

    if (key === null) return callback(new Error('mem.del: no key provided'), null);

    const remoteGid = (configuration && typeof configuration === 'object' && configuration.gid) ? configuration.gid : context.gid;
    getTargetNode(key, (err, targetNode) => {
      if (err) return callback(err, null);
      const remote = {node: targetNode, service: 'mem', method: 'del'};
      globalThis.distribution.local.comm.send([{key, gid: remoteGid}], remote, callback);
    });
  }

  /**
   * @param {Object.<string, Node>} configuration
   * @param {Callback} callback
   */
  function reconf(configuration, callback) {
    return callback(new Error('mem.reconf not implemented'));
  }

  return {
    get,
    put,
    append,
    del,
    reconf,
  };
}

module.exports = mem;
