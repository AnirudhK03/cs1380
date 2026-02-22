/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const id = distribution.util.id;

jest.spyOn(process, 'exit').mockImplementation(() => {});

const n1 = {ip: '127.0.0.1', port: 7000};
const n2 = {ip: '127.0.0.1', port: 7001};
const n3 = {ip: '127.0.0.1', port: 7002};
const allNodes = [n1, n2, n3];

function startAllNodes(callback) {
  distribution.node.start(() => {
    function startStep(step) {
      if (step >= allNodes.length) {
        callback();
        return;
      }
      distribution.local.status.spawn(allNodes[step], (e, v) => {
        if (e) {
          return callback(e);
        }
        startStep(step + 1);
      });
    }
    startStep(0);
  });
}

function stopAllNodes(callback) {
  const remote = {method: 'stop', service: 'status'};

  function stopStep(step) {
    if (step == allNodes.length) {
      callback();
      return;
    }
    if (step < allNodes.length) {
      remote.node = allNodes[step];
      distribution.local.comm.send([], remote, (e, v) => {
        stopStep(step + 1);
      });
    }
  }

  if (globalThis.distribution.node.server) {
    globalThis.distribution.node.server.close();
  }
  stopStep(0);
}

beforeAll((done) => {
  stopAllNodes(() => {
    startAllNodes(done);
  });
});

afterAll((done) => {
  stopAllNodes(done);
});

// test that a node responds and measure latency + throughput
test('(1 pts) student test', (done) => {
  var times = [];
  var N = 10;
  var count = 0;

  function doRequest(cb) {
    var t = Date.now();
    distribution.local.comm.send(
        ['ip'],
        {node: n1, service: 'status', method: 'get'},
        (e, v) => {
          times.push(Date.now() - t);
          cb(e, v);
        },
    );
  }

  doRequest((e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toEqual(n1.ip);
    } catch (err) {
      return done(err);
    }

    count = 1;
    var start = Date.now();
    function loop() {
      if (count >= N) {
        var elapsed = (Date.now() - start) / 1000;
        var avg = times.reduce((a, b) => a + b, 0) / times.length;
        console.log('avg latency: ' + avg.toFixed(2) + 'ms');
        console.log('throughput: ' + (N / elapsed).toFixed(2) + ' ops/sec');
        done();
        return;
      }
      doRequest(() => { count++; loop(); });
    }
    loop();
  });
});


// create a group and check that the nodes are in it
test('(1 pts) student test', (done) => {
  var myGroup = {};
  myGroup[id.getSID(n1)] = n1;
  myGroup[id.getSID(n2)] = n2;

  distribution.local.groups.put({gid: 'testGroup'}, myGroup, (e, v) => {
    distribution.local.groups.get('testGroup', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v[id.getSID(n1)]).toBeDefined();
        expect(v[id.getSID(n2)]).toBeDefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});


// add a node to a group after it was created
test('(1 pts) student test', (done) => {
  var groupStart = {};
  groupStart[id.getSID(n1)] = n1;
  groupStart[id.getSID(n2)] = n2;

  distribution.local.groups.put({gid: 'dynGroup'}, groupStart, (e, v) => {
    distribution.local.groups.add('dynGroup', n3, (e, v) => {
      distribution.dynGroup.status.get('nid', (e, v) => {
        try {
          expect(Object.values(v)).toContain(id.getNID(n3));
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

// two nodes can have different views of the same group
test('(1 pts) student test', (done) => {
  var viewGroup = {};
  viewGroup[id.getSID(n1)] = n1;
  viewGroup[id.getSID(n2)] = n2;

  distribution.local.groups.put({gid: 'viewGroup'}, viewGroup, (e, v) => {
    distribution.viewGroup.groups.put({gid: 'viewGroup'}, viewGroup, (e, v) => {
      var n1View = {};
      n1View[id.getSID(n2)] = n2;
      distribution.local.comm.send(
          [{gid: 'viewGroup'}, n1View],
          {node: n1, service: 'groups', method: 'put', gid: 'local'},
          (e, v) => {
            distribution.viewGroup.groups.get('viewGroup', (e, v) => {
              try {
                expect(Object.keys(v[id.getSID(n2)])).toContain(id.getSID(n1));
                expect(Object.keys(v[id.getSID(n1)])).not.toContain(id.getSID(n1));
                done();
              } catch (error) {
                done(error);
              }
            });
          },
      );
    });
  });
});

// gossip sends a message to nodes in the group
test('(1 pts) student test', (done) => {
  var gossipGroup = {};
  gossipGroup[id.getSID(n1)] = n1;
  gossipGroup[id.getSID(n2)] = n2;
  gossipGroup[id.getSID(n3)] = n3;

  var config = {gid: 'gossipGroup', subset: (lst) => 1};

  distribution.local.groups.put(config, gossipGroup, (e, v) => {
    distribution.gossipGroup.groups.put(config, gossipGroup, (e, v) => {
      distribution.gossipGroup.groups.put('shared', {}, (e, v) => {
        var newNode = {ip: '127.0.0.1', port: 9999};
        var remote = {service: 'groups', method: 'add'};

        distribution.gossipGroup.gossip.send(['shared', newNode], remote, (e, v) => {
          setTimeout(() => {
            distribution.gossipGroup.groups.get('shared', (e, v) => {
              try {
                expect(v).toBeDefined();
                done();
              } catch (error) {
                done(error);
              }
            });
          }, 500);
        });
      });
    });
  });
});
