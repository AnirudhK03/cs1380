/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');

const id = distribution.util.id;

// basic test: put a few things in mem and make sure we can get them back
test('(1 pts) student test', (done) => {
  const user1 = {name: 'alice', age: 21};
  const user2 = {name: 'bob', age: 22};
  const user3 = {name: 'charlie', age: 23};

  distribution.studentgroup.mem.put(user1, 'u1', (e, v) => {
    if (e) {
      done(e);
      return;
    }
    distribution.studentgroup.mem.put(user2, 'u2', (e, v) => {
      if (e) {
        done(e);
        return;
      }
      distribution.studentgroup.mem.put(user3, 'u3', (e, v) => {
        if (e) {
          done(e);
          return;
        }
        // now get them all back and check the values are correct
        distribution.studentgroup.mem.get('u1', (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v).toEqual(user1);
          } catch (err) {
            done(err);
            return;
          }
          distribution.studentgroup.mem.get('u2', (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v).toEqual(user2);
            } catch (err) {
              done(err);
              return;
            }
            distribution.studentgroup.mem.get('u3', (e, v) => {
              try {
                expect(e).toBeFalsy();
                expect(v).toEqual(user3);
                done();
              } catch (err) {
                done(err);
              }
            });
          });
        });
      });
    });
  });
});

// test that del actually removes the key and doesnt break other keys
test('(1 pts) student test', (done) => {
  const val1 = {course: 'cs1380', grade: 'A'};
  const val2 = {course: 'cs0330', grade: 'B'};

  distribution.studentgroup.mem.put(val1, 'course1', (e, v) => {
    if (e) {
      done(e);
      return;
    }
    distribution.studentgroup.mem.put(val2, 'course2', (e, v) => {
      if (e) {
        done(e);
        return;
      }
      distribution.studentgroup.mem.del('course1', (e, v) => {
        if (e) {
          done(e);
          return;
        }
        // course1 is deleted so we should get an error when we try to get it
        distribution.studentgroup.mem.get('course1', (e, v) => {
          try {
            expect(e).toBeTruthy();
            expect(v).toBeFalsy();
          } catch (err) {
            done(err);
            return;
          }
          // course2 should still be there tho
          distribution.studentgroup.mem.get('course2', (e, v) => {
            try {
              expect(e).toBeFalsy();
              expect(v).toEqual(val2);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
      });
    });
  });
});

// if you put something with no key, it should auto generate a key using id.getID
// so we can compute the key ourselves and use it to get the value back
test('(1 pts) student test', (done) => {
  const val = {university: 'brown', department: 'cs'};

  // the key will be the hash of the value
  const autoKey = id.getID(val);

  distribution.studentgroup.mem.put(val, null, (e, v) => {
    if (e) {
      done(e);
      return;
    }
    distribution.studentgroup.mem.get(autoKey, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(val);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});

// same thing but for store (disk backed) instead of mem
test('(1 pts) student test', (done) => {
  const rec1 = {id: 1, data: 'hello world'};
  const rec2 = {id: 2, data: 'distributed systems'};

  distribution.studentgroup.store.put(rec1, 'srec1', (e, v) => {
    if (e) {
      done(e);
      return;
    }
    distribution.studentgroup.store.put(rec2, 'srec2', (e, v) => {
      if (e) {
        done(e);
        return;
      }
      distribution.studentgroup.store.get('srec1', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(rec1);
        } catch (err) {
          done(err);
          return;
        }
        distribution.studentgroup.store.get('srec2', (e, v) => {
          try {
            expect(e).toBeFalsy();
            expect(v).toEqual(rec2);
            done();
          } catch (err) {
            done(err);
          }
        });
      });
    });
  });
});

// this test checks that the hashing actually puts the key on the right node
// basically we compute which node the key should go to ourselves and then
// directly ask that node if it has the value
test('(1 pts) student test', (done) => {
  const key = 'routing-test-key';
  const val = {routed: true, value: 42};

  distribution.studentgroup.mem.put(val, key, (e, v) => {
    if (e) {
      done(e);
      return;
    }

    // get the group so we can figure out which node owns this key
    distribution.local.groups.get('studentgroup', (e, group) => {
      if (e) {
        done(e);
        return;
      }

      // build a map from nid -> node so we can look up the node after hashing
      const nidToNode = {};
      for (const node of Object.values(group)) {
        nidToNode[id.getNID(node)] = node;
      }

      const nids = Object.keys(nidToNode);
      const kid = id.getID(key);
      const targetNID = id.naiveHash(kid, nids);
      const targetNode = nidToNode[targetNID];

      // directly query the specific node that should have our key
      const remote = {node: targetNode, service: 'mem', method: 'get'};
      distribution.local.comm.send([{key: key, gid: 'studentgroup'}], remote, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(val);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});

/*
    setup / teardown boilerplate
*/

const studentgroupGroup = {};

const n1 = {ip: '127.0.0.1', port: 7781};
const n2 = {ip: '127.0.0.1', port: 7782};
const n3 = {ip: '127.0.0.1', port: 7783};

beforeAll((done) => {
  const fs = require('fs');
  const path = require('path');

  fs.rmSync(path.join(__dirname, '../../store'), {recursive: true, force: true});
  fs.mkdirSync(path.join(__dirname, '../../store'));

  studentgroupGroup[id.getSID(n1)] = n1;
  studentgroupGroup[id.getSID(n2)] = n2;
  studentgroupGroup[id.getSID(n3)] = n3;

  // stop nodes in case they were already running
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        distribution.node.start((e) => {
          if (e) {
            done(e);
            return;
          }
          distribution.local.status.spawn(n1, (e, v) => {
            if (e) {
              done(e);
              return;
            }
            distribution.local.status.spawn(n2, (e, v) => {
              if (e) {
                done(e);
                return;
              }
              distribution.local.status.spawn(n3, (e, v) => {
                if (e) {
                  done(e);
                  return;
                }
                const groupConfig = {gid: 'studentgroup'};
                distribution.local.groups.put(groupConfig, studentgroupGroup, (e, v) => {
                  if (e && Object.keys(e).length > 0) {
                    done(e);
                    return;
                  }
                  distribution.studentgroup.groups.put(groupConfig, studentgroupGroup, (e, v) => {
                    if (e && Object.keys(e).length > 0) {
                      done(e);
                      return;
                    }
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
//very colorful ending brackets lol :)

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
