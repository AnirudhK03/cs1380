// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */

const groups = {};
/**
 * @param {string} name
 * @param {Callback} callback
 */
function get(name, callback) {
  // return callback(new Error('groups.get not implemented'));
  if (groups[name]) {
    callback(null, groups[name]);
  } else {
    callback(new Error(`groups.get: group '${name}' not found`), null);
  }
}

/**
 * @param {Config | string} config
 * @param {Object.<string, Node>} group
 * @param {Callback} callback
 */
function put(config, group, callback) {
  // return callback(new Error('groups.put not implemented'));
  let name = "";
  if (typeof config === "string") {
    name = config;
  } else if (config && typeof config === "object") {
    name = config.gid || "";
  }

  if (!name) {
    callback(new Error("groups.put: missing group name"));
    return;
  }

  const distribution = globalThis.distribution;

  const newGroup = {};
  if (group && typeof group === "object") {
    const keys = Object.keys(group);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const node = group[k];
      if (!node) continue;
      
      newGroup[k] = node;
    }
  }

  groups[name] = newGroup;

  if (distribution) {
    if (!distribution[name]) {
      distribution[name] = {};
    }
  

    const t = distribution.templates;
    if (t) {
      // pass the full config (not just gid) so services get the hash function too
      const serviceConfig = (typeof config === 'object' && config !== null) ? config : {gid: name};
      if (t.comm) distribution[name].comm = t.comm(serviceConfig);
      if (t.groups) distribution[name].groups = t.groups(serviceConfig);
      if (t.status) distribution[name].status = t.status(serviceConfig);
      if (t.routes) distribution[name].routes = t.routes(serviceConfig);
      if (t.gossip) distribution[name].gossip = t.gossip(serviceConfig);
      if (t.mem) distribution[name].mem = t.mem(serviceConfig);
      if (t.store) distribution[name].store = t.store(serviceConfig);
      if (t.mr) distribution[name].mr = t.mr(serviceConfig);
    }
  }

  callback(null, newGroup);
}

/**
 * @param {string} name
 * @param {Callback} callback
 */
function del(name, callback) {
  // return callback(new Error('groups.del not implemented'));
  if (!groups[name]) {
    callback(new Error(`groups.del: group '${name}' not found`), null);
    return;
  }

  const saved = groups[name];
  delete groups[name];

  const distribution = globalThis.distribution;
  if (distribution && name !== "local" && name !== "all") {
    if (distribution[name]) {
      delete distribution[name];
    }
  }

  callback(null, saved);
}

/**
 * @param {string} name
 * @param {Node} node
 * @param {Callback} callback
 */
function add(name, node, callback) {
  // return callback(new Error('groups.add not implemented'));
  if (!groups[name]) {
    if (typeof callback === 'function') {
      callback(new Error(`groups.add: group '${name}' not found`), null);
    }
    return;
  }

  const distribution = globalThis.distribution;
  const sid = distribution.util.id.getSID(node);
  groups[name][sid] = node;

  if (typeof callback === 'function') {
    callback(null, groups[name]);
  }
};

/**
 * @param {string} name
 * @param {string} node
 * @param {Callback} callback
 */
function rem(name, node, callback) {
  // return callback(new Error('groups.rem not implemented'));
  if (!groups[name]) {
    callback(new Error(`groups.rem: group '${name}' not found`), null);
    return;
  }

  delete groups[name][node];
  callback(null, true);
};

// Initialize built-in groups with the local node
(function initBuiltinGroups() {
  const dist = globalThis.distribution;
  if (dist && dist.node && dist.util && dist.util.id) {
    const localNode = dist.node.config;
    const localSid = dist.util.id.getSID(localNode);
    groups['all'] = {[localSid]: localNode};
    groups['local'] = {[localSid]: localNode};
  }
})();

module.exports = {get, put, del, add, rem};
