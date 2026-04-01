const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');
const id = distribution.util.id;

const n1 = {ip: '127.0.0.1', port: 7210};
const n2 = {ip: '127.0.0.1', port: 7211};
const n3 = {ip: '127.0.0.1', port: 7212};

const emptyGroup = {};
const singleKeyGroup = {};
const mixedGroup = {};
const nonArrayGroup = {};
const collapseGroup = {};

test('(1 pts) student test', (done) => {
  // Edge case: empty keys array — MR should return empty results
  const mapper = (key, value) => {
    const out = {};
    out[value] = 1;
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  distribution.emptyg.mr.exec({keys: [], map: mapper, reduce: reducer}, (e, v) => {
    try {
      expect(v).toEqual([]);
      done();
    } catch (e) {
      done(e);
    }
  });
});

test('(1 pts) student test', (done) => {
  // Edge case: all mapped values collapse to a single reduce key
  const mapper = (key, value) => {
    const out = {};
    out['same'] = parseInt(value);
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'s1': '10'},
    {'s2': '20'},
    {'s3': '30'},
  ];

  const expected = [{'same': 60}];
  const datasetKeys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.collapseg.mr.exec({keys: datasetKeys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.collapseg.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // Edge case: mapper returns mix of empty and filled results
  const mapper = (key, value) => {
    if (value.length > 10) {
      const out = {};
      out[key] = value.length;
      return [out];
    }
    return [];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'f1': 'short'},
    {'f2': 'this is a longer string value'},
    {'f3': 'tiny'},
    {'f4': 'another long string here too'},
  ];

  const expected = [{'f2': 29}, {'f4': 28}];
  const datasetKeys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.mixedg.mr.exec({keys: datasetKeys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.mixedg.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // Edge case: mapper returns single object (not array)
  const mapper = (key, value) => {
    const out = {};
    out[value.toUpperCase()] = 1;
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'w1': 'hello'},
    {'w2': 'world'},
    {'w3': 'hello'},
  ];

  const expected = [{'HELLO': 2}, {'WORLD': 1}];
  const datasetKeys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.nonarrayg.mr.exec({keys: datasetKeys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.nonarrayg.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(1 pts) student test', (done) => {
  // Edge case: single document — minimal full MR pipeline
  const mapper = (key, value) => {
    const words = value.split(/\s+/);
    const out = [];
    for (let i = 0; i < words.length; i++) {
      const obj = {};
      obj[words[i]] = 1;
      out.push(obj);
    }
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'solo1': 'one fish two fish'},
  ];

  const expected = [{'one': 1}, {'fish': 2}, {'two': 1}];
  const datasetKeys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    const inputBytes = dataset.reduce((sum, o) => sum + Object.values(o)[0].length, 0);
    const start = performance.now();

    distribution.singlekeyg.mr.exec({keys: datasetKeys, map: mapper, reduce: reducer}, (e, v) => {
      const elapsed = performance.now() - start;
      const throughput = (inputBytes / (elapsed / 1000)).toFixed(2);
      console.log(`[singlekeyg mr] latency: ${elapsed.toFixed(0)}ms | input: ${inputBytes} bytes | throughput: ${throughput} bytes/sec`);

      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.singlekeyg.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
    Test setup and teardown
*/

beforeAll((done) => {
  emptyGroup[id.getSID(n1)] = n1;
  emptyGroup[id.getSID(n2)] = n2;
  emptyGroup[id.getSID(n3)] = n3;

  singleKeyGroup[id.getSID(n1)] = n1;
  singleKeyGroup[id.getSID(n2)] = n2;
  singleKeyGroup[id.getSID(n3)] = n3;

  mixedGroup[id.getSID(n1)] = n1;
  mixedGroup[id.getSID(n2)] = n2;
  mixedGroup[id.getSID(n3)] = n3;

  nonArrayGroup[id.getSID(n1)] = n1;
  nonArrayGroup[id.getSID(n2)] = n2;
  nonArrayGroup[id.getSID(n3)] = n3;

  collapseGroup[id.getSID(n1)] = n1;
  collapseGroup[id.getSID(n2)] = n2;
  collapseGroup[id.getSID(n3)] = n3;

  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((e) => {
    startNodes(() => {
      const emptyConfig = {gid: 'emptyg'};
      distribution.local.groups.put(emptyConfig, emptyGroup, (e, v) => {
        distribution.emptyg.groups.put(emptyConfig, emptyGroup, (e, v) => {
          const singleKeyConfig = {gid: 'singlekeyg'};
          distribution.local.groups.put(singleKeyConfig, singleKeyGroup, (e, v) => {
            distribution.singlekeyg.groups.put(singleKeyConfig, singleKeyGroup, (e, v) => {
              const mixedConfig = {gid: 'mixedg'};
              distribution.local.groups.put(mixedConfig, mixedGroup, (e, v) => {
                distribution.mixedg.groups.put(mixedConfig, mixedGroup, (e, v) => {
                  const nonArrayConfig = {gid: 'nonarrayg'};
                  distribution.local.groups.put(nonArrayConfig, nonArrayGroup, (e, v) => {
                    distribution.nonarrayg.groups.put(nonArrayConfig, nonArrayGroup, (e, v) => {
                      const collapseConfig = {gid: 'collapseg'};
                      distribution.local.groups.put(collapseConfig, collapseGroup, (e, v) => {
                        distribution.collapseg.groups.put(collapseConfig, collapseGroup, (e, v) => {
                          done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        if (globalThis.distribution.node.server) {
          globalThis.distribution.node.server.close();
        }
        done();
      });
    });
  });
});