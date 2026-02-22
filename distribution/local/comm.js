// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

const http = require('node:http');
// const { serialize, deserialize } = require("../util/serialization.js");

/**
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {Node} node
 * @property {string} [gid]
 */

/**
 * @param {Array<any>} message
 * @param {Target} remote
 * @param {(error: Error, value?: any) => void} callback
 * @returns {void}
 */
function send(message, remote, callback) {
  // return callback(new Error('comm.send not implemented'));
  // Steps: 
  // 1. Serialize
  // 2. send PUT
  // 3. read response
  // 4. deserialzie [e,v]
  // 5. calls callback(e,v)

  if (!remote || !remote.node || !remote.node.ip || !remote.node.port) {
    return callback(new Error('Missing remote node configuration'));
  }

  if (!remote.service || !remote.method) {
    return callback(new Error('Missing service or method'));
  }

  //create the HTTP path
  const gid = remote.gid || "local";
  const path = `/${gid}/${remote.service}/${remote.method}`;

  //
  const serialize = globalThis.distribution.util.serialize;
  const deserialize = globalThis.distribution.util.deserialize;
  
  //serialize
  const body = serialize(message);

  //request
  const req = http.request(
    {
      hostname: remote.node.ip,
      port: remote.node.port,
      method: "PUT",
      path: path,
    },
    (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const [e,v] = deserialize(data);
        callback(e,v);
      });
    }
  );

  req.on("error", (e) => callback(e));
  req.write(body);
  req.end();
}

module.exports = {send};
