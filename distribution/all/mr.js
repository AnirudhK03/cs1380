// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../util/id.js").NID} NID
 */

const id = require('../util/id.js');

/**
 * Map functions used for mapreduce
 * @callback Mapper
 * @param {string} key
 * @param {any} value
 * @returns {object[]}
 */

/**
 * Reduce functions used for mapreduce
 * @callback Reducer
 * @param {string} key
 * @param {any[]} value
 * @returns {object}
 */

/**
 * @typedef {Object} MRConfig
 * @property {Mapper} map
 * @property {Reducer} reduce
 * @property {string[]} keys
 *
 * @typedef {Object} Mr
 * @property {(configuration: MRConfig, callback: Callback) => void} exec
 */


/*
  Note: The only method explicitly exposed in the `mr` service is `exec`.
  Other methods, such as `map`, `shuffle`, and `reduce`, should be dynamically
  installed on the remote nodes and not necessarily exposed to the user.
*/

/**
 * @param {Config} config
 * @returns {Mr}
 */
function mr(config) {
  const context = {
    gid: config.gid || 'all',
  };

  /**
   * @param {MRConfig} configuration
   * @param {Callback} callback
   * @returns {void}
   */
  function exec(configuration, callback) {
    const mrID = id.getID(`${configuration}${Date.now()}`);
    const serviceName = 'mr-' + mrID;

    /*
      MapReduce steps:
      1) Setup: register a service `mr-<id>` on all nodes in the group. The service implements the map, shuffle, and reduce methods.
      2) Map: make each node run map on its local data and store them locally, under a different gid, to be used in the shuffle step.
      3) Shuffle: group values by key using store.append.
      4) Reduce: make each node run reduce on its local grouped values.
      5) Cleanup: remove the `mr-<id>` service and return the final output.

      Note: Comments inside the stencil describe a possible implementation---you should feel free to make low- and mid-level adjustments as needed.
    */
    const mrService = {
      mapper: configuration.map,
      reducer: configuration.reduce,

      map: function(
          /** @type {string[]} */ keys,
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Map should read the node's local keys under the gid and write mapped results to local store under `mrID_map`.
        // Expected output: array of objects with a single key per object.
        const self = this;
        if (keys.length === 0) {
          globalThis.distribution.local.store.put([], mrID + '_map', function(err, v) {
            callback(null, []);
          });
          return;
        }

        const results = [];
        let count = 0;
        for (const key of keys) {
          globalThis.distribution[gid].store.get(key, function(err, value) {
            const mapped = self.mapper(key, value);
            if (Array.isArray(mapped)) {
              for (const item of mapped) {
                results.push(item);
              }
            } else {
              results.push(mapped);
            }
            count++;
            if (count === keys.length) {
              globalThis.distribution.local.store.put(results, mrID + '_map', function(putErr, v) {
                callback(putErr, results);
              });
            }
          });
        }
      },

      shuffle: function(
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Fetch the mapped values from the local store.
        // Shuffle groups values by key (via mem.append on the distributed group mem).
        globalThis.distribution.local.store.get(mrID + '_map', function(err, mapped) {
          if (err) {
            callback(err, {});
            return;
          }
          if (mapped.length === 0) {
            callback(null, mapped);
            return;
          }
          let count = 0;
          for (const obj of mapped) {
            const key = Object.keys(obj)[0];
            globalThis.distribution[gid].mem.append(obj[key], {key: key, gid: gid}, function(appendErr, v) {
              count++;
              if (count === mapped.length) {
                callback(null, mapped);
              }
            });
          }
        });
      },

      reduce: function(
          /** @type {string} */ gid,
          /** @type {string} */ mrID,
          /** @type {Callback} */ callback,
      ) {
        // Fetch grouped values from local mem, apply reducer, and return final output.
        const self = this;
        globalThis.distribution.local.mem.get({key: null, gid: gid}, function(err, keys) {
          if (err || keys.length === 0) {
            callback(null, null);
            return;
          }
          const results = [];
          let count = 0;
          for (const key of keys) {
            globalThis.distribution.local.mem.get({key: key, gid: gid}, function(getErr, values) {
              const result = self.reducer(key, values);
              if (Array.isArray(result)) {
                for (const item of result) {
                  results.push(item);
                }
              } else {
                results.push(result);
              }
              count++;
              if (count === keys.length) {
                callback(null, results);
              }
            });
          }
        });
      },
    };

    // Setup: register the mr service on all nodes in the group, then execute map -> shuffle -> reduce.
    globalThis.distribution[context.gid].routes.put(mrService, serviceName, function(routeErr, routeV) {
      if (routeErr && Object.keys(routeErr).length > 0) {
        callback(routeErr);
        return;
      }

      // Get the group so we can assign keys to nodes by naiveHash
      globalThis.distribution.local.groups.get(context.gid, function(groupErr, group) {
        if (groupErr) {
          callback(groupErr);
          return;
        }

        const nodeIds = Object.keys(group);

        // Distribute keys to nodes using naiveHash (same as all.store uses)
        const keysByNode = {};
        for (const sid of nodeIds) {
          keysByNode[sid] = [];
        }

        const keys = configuration.keys;
        for (const key of keys) {
          const kid = id.getID(key);
          const targetNID = id.naiveHash(kid, nodeIds);
          keysByNode[targetNID].push(key);
        }

        // send each node its slice of keys
        let mapCount = 0;
        const mapTotal = nodeIds.length;
        for (const sid of nodeIds) {
          const node = group[sid];
          const nodeKeys = keysByNode[sid];
          const remote = {node: node, service: serviceName, method: 'map'};
          const message = [nodeKeys, context.gid, mrID];
          globalThis.distribution.local.comm.send(message, remote, function(mapErr, mapV) {
            mapCount++;
            if (mapCount === mapTotal) {
              // Shuffle — tell all nodes to shuffle their map output
              const shuffleRemote = {service: serviceName, method: 'shuffle'};
              globalThis.distribution[context.gid].comm.send([context.gid, mrID], shuffleRemote, function(shuffleErr, shuffleV) {
                // Reduce — tell all nodes to run reduce on their grouped values
                const reduceRemote = {service: serviceName, method: 'reduce'};
                globalThis.distribution[context.gid].comm.send([context.gid, mrID], reduceRemote, function(reduceErr, reduceV) {
                  // Collect all reduce results into a flat array
                  const finalResults = [];
                  for (const nodeResult of Object.values(reduceV)) {
                    if (nodeResult !== null) {
                      for (const item of nodeResult) {
                        finalResults.push(item);
                      }
                    }
                  }

                  // Cleanup: remove the mr service from all nodes
                  globalThis.distribution[context.gid].routes.rem(serviceName, function(remErr, remV) {
                    callback(null, finalResults);
                  });
                });
              });
            }
          });
        }
      });
    });
  }

  return {exec};
}

module.exports = mr;
