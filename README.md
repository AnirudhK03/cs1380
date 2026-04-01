# distribution

This is the distribution library. 

## Environment Setup

We recommend using the prepared [container image](https://github.com/brown-cs1380/container).

## Installation

After you have setup your environment, you can start using the distribution library.
When loaded, distribution introduces functionality supporting the distributed execution of programs. To download it:

```sh
$ npm i '@brown-ds/distribution'
```

This command downloads and installs the distribution library.

## Testing

There are several categories of tests:
  *	Regular Tests (`*.test.js`)
  *	Scenario Tests (`*.scenario.js`)
  *	Extra Credit Tests (`*.extra.test.js`)
  * Student Tests (`*.student.test.js`) - inside `test/test-student`

### Running Tests

By default, all regular tests are run. Use the options below to run different sets of tests:

1. Run all regular tests (default): `$ npm test` or `$ npm test -- -t`
2. Run scenario tests: `$ npm test -- -c` 
3. Run extra credit tests: `$ npm test -- -ec`
4. Run the `non-distribution` tests: `$ npm test -- -nd`
5. Combine options: `$ npm test -- -c -ec -nd -t`

## Usage

To try out the distribution library inside an interactive Node.js session, run:

```sh
$ node
```

Then, load the distribution library:

```js
> let distribution = require("@brown-ds/distribution")();
> distribution.node.start(console.log);
```

Now you have access to the full distribution library. You can start off by serializing some values. 

```js
> s = distribution.util.serialize(1); // '{"type":"number","value":"1"}'
> n = distribution.util.deserialize(s); // 1
```

You can inspect information about the current node (for example its `sid`) by running:

```js
> distribution.local.status.get('sid', console.log); // null 8cf1b (null here is the error value; meaning there is no error)
```

You can also store and retrieve values from the local memory:

```js
> distribution.local.mem.put({name: 'nikos'}, 'key', console.log); // null {name: 'nikos'} (again, null is the error value) 
> distribution.local.mem.get('key', console.log); // null {name: 'nikos'}

> distribution.local.mem.get('wrong-key', console.log); // Error('Key not found') undefined
```

You can also spawn a new node:

```js
> node = { ip: '127.0.0.1', port: 8080 };
> distribution.local.status.spawn(node, console.log);
```

Using the `distribution.all` set of services will allow you to act 
on the full set of nodes created as if they were a single one.

```js
> distribution.all.status.get('sid', console.log); // {} { '8cf1b': '8cf1b', '8cf1c': '8cf1c' } (now, errors are per-node and form an object)
```

You can also send messages to other nodes:

```js
> distribution.local.comm.send(['sid'], {node: node, service: 'status', method: 'get'}, console.log); // null 8cf1c
```

Most methods in the distribution library are asynchronous and take a callback as their last argument.
This callback is invoked when the method completes, with the first argument being an error (if any) and the second argument being the result.
The following runs the sequence of commands described above inside a script (note the nested callbacks):

```js
let distribution = require("@brown-ds/distribution")();
// Now we're only doing a few of the things we did above
const out = (cb) => {
  distribution.local.status.stop(cb); // Shut down the local node
};
distribution.node.start(() => {
  // This will run only after the node has started
  const node = {ip: '127.0.0.1', port: 8765};
  distribution.local.status.spawn(node, (e, v) => {
    if (e) {
      return out(console.log);
    }
    // This will run only after the new node has been spawned
    distribution.all.status.get('sid', (e, v) => {
      // This will run only after we communicated with all nodes and got their sids
      console.log(v); // { '8cf1b': '8cf1b', '8cf1c': '8cf1c' }
      // Shut down the remote node
      distribution.local.comm.send([], {service: 'status', method: 'stop', node: node}, () => {
        // Finally, stop the local node
        out(console.log); // null, {ip: '127.0.0.1', port: 1380}
      });
    });
  });
});
```

# Results and Reflections

# M1: Serialization / Deserialization
## Summary
> Summarize your implementation, including key challenges you encountered. Remember to update the `report` section of the `package.json` file with the total number of hours it took you to complete each task of M1 (`hours`) and the lines of code per task.
My implementation comprises 2 software components, totaling 219 lines of code. Key challenges included test cases for latency, intial design for serialization/deserialization, and lastly error handling. The first challenge was the initial design for the serilization and deserilization was difficult to garsp, for exmaple I could have just coped off how it was structured in the library {type: type, value: val}. However, since I built my implemetation around using the JSON.stringfy I chose that instead of adding the type for every primivitive and basic thing that JSON can already do, we only need to add the type for the things JSON cant do, like Date objects and (simplier) NaN. This way the string becomes {"__type":"nan"}. This was simple and we didnt need to add extra deserilization steps for the primivitives (I first wrote out what each string looked like then wrote the code for how it is serilized). Secondly, the next problem was actaully understanding hwo to wrote the latency calculation code, but this was ismple after writing once you could just copy and paste it. Error handling and objects were pain, since I had to rewrite how deserilized (mainly JSON.parse) worked. It was weird because we coudlnt just do the reverse of serialize one to one because when yo run JSON.parse it doesn't have info about its parents node (which conatin the iso value) so I wrote another function that lest JSON.parse completely finish then we go back in and revist how the __type shoudl be handled. 
## Correctness & Performance Characterization
> Describe how you characterized the correctness and performance of your implementation
*Correctness*: I wrote 5 tests; these tests take 1.8secs to execute. This includes objects with literally everything, like nested structures, arrays, base types (strings, numbers, booleans, null, undefined), special numbers (NaN, Infinity, -Infinity), functions, Dates, and Errors.
*Performance*: The latency of various subsystems is described in the `"latency"` portion of package.json. The characteristics of my development machines are summarized in the `"dev"` portion of package.json.

# M2: Actors and Remote Procedure Calls (RPC)
## Summary
My implementation comprises 4 software components, totaling 300 lines of code. Key challenges included 1) error propagation over HTTP — I was wrapping protocol errors in arrays when the receiver expected a bare Error, 2) wiring up the node.js HTTP server to correctly parse URLs, look up services via routes, and call methods, and 3) input validation in comm.send to catch missing ip/port/service/method before making the request.

## Correctness & Performance Characterization
*Correctness*: I wrote 6 tests; these tests take about 4 seconds to execute. They cover status, routes (put/get/rem), comm error handling, and a 1000-request benchmark.

*Performance*: I sent 1000 comm requests in a tight loop. Dev: ~10,800 req/s, avg latency 0.074ms. Full stats in `package.json`.

## Key Feature
> How would you explain the implementation of `createRPC` to someone who has no background in computer science?

Say you have a helper in your office. You want someone in another building to be able to use your helper. So you give them a card that says "mail your request to this address." When they use the card, the letter goes to your office, your helper does the work, and mails back the result. createRPC makes that card — it lets a remote machine call a function that actually runs on your machine, without the remote machine needing to know how it works.

# M3: Node Groups & Gossip Protocols
## Summary
My implementation comprises 5 new software components, totaling 625 added lines of code over the previous implementation. Key challenges included: 1) implementing `comm.send` to fire HTTP requests to all nodes in a group simultaneously and collect responses into a single errors/values map — the tricky part was figuring out how to track completion across N parallel callbacks without a counter getting out of sync (simply just did a equality check); 2) group relativity, where different nodes can have different local views of the same group — I had to realize you can't just use the distributed `groups.put` to override a single node's view, you need to `comm.send` directly to that node's local service; 3) getting `spawn` to register newly started nodes into the `all` group. The fix was simple once I realized the timeout already delayed the callback, so I just added `groups.add('all', configuration, null)` right before calling the user's callback.

## Correctness & Performance Characterization
*Correctness*: I wrote 5 student tests and filled out 4 scenario tests; together they take about 8 seconds to run (mostly from the 500ms gossip delay and node spawn times). The tests cover node liveness, group creation, dynamic membership, group relativity, and gossip propagation.

*Performance*: Spawn time for a remote node is around 500ms (dominated by the fixed wait in `status.spawn`). For gossip, I used a subset function of 1 node per round, so with 3 nodes a message reaches all of them within 1–2 rounds (~500ms delay is enough). The avg latency for a single `comm.send` is about 1.5ms on dev, and throughput is roughly 1666 ops/sec. Full stats in `package.json`.

## Key Feature
The point of gossip is scalability and fault tolerance. If a node just sent the message directly to *all* other nodes in the group, two problems come up: first, it doesn't scale — as the group grows to thousands of nodes, every broadcast becomes an O(n) flood from a single sender, creating a bottleneck. Second, if that one sender crashes mid-send, some nodes get the message and some don't. With gossip, each node only forwards to a small subset (e.g., 1–3 nodes), and those nodes do the same.

# M4: Distributed Storage
## Summary
My implementation adds distributed (and local) `store` and `mem` services with consistent hashing, totaling ~250 lines of new code. The main challenge was correctly routing keys to nodes using `naiveHash`/`consistentHash` on NIDs, and handling `store.get(null)`.

## Correctness & Performance Characterization
*Correctness*: All provided local and distributed store/mem tests pass (I think). Tests take about 10 seconds probably due to the node spawn overhead.

*Performance*: Characterized on 3 AWS t3.micro nodes. Insertion: 43.71 ops/sec, avg latency 22.878 ms. Retrieval: 45.95 ops/sec, avg latency 21.760 ms. Full stats in `package.json`. Honeslty, getting the script working, and connecting to the ec2 instances was the hardest part of this project.

## Key Feature
`reconf` first collects all keys before moving any objects because relocating data immediately risks reading from nodes that have already been partially migrated.


# M5: Distributed Execution Engine

## Summary

My implementation comprises 2 new software components (mr.js and store.append), totaling approximately 150 added lines of code over the previous implementation. Key challenges included:

1. **Variable Block Declaration** — mapper and reducer functions are serialized and sent to remote nodes, so any variables referenced from outer scope (like `const regex = /super/`) are lost. Solved by inlining all dependencies directly inside the mapper/reducer functions.

2. **Testing: Keys From Previous Tests** — since all groups share the same physical nodes, `store.get(null)` returns keys from other tests/groups. Solved by filtering returned keys against the known keys before passing them to `mr.exec`.

3. **The map-shuffle-reduce pipeline** — making sure each phase completes across all nodes before starting the next (it was heard to think about it at first, but once you understand its literally just a glorified for loop it was easy to implement), using callback counting to track when all nodes have finished each step (this was laso hard to wrap head around at first but then it was easy once you understand that the callback just wait until everything is finished).

## Correctness & Performance Characterization

*Correctness*: I wrote 5 tests testing empty key input, all values collapsing to a single reduce key, mixed empty and non-empty mapper output, non-array mapper return values, and single-document minimal MR pipelines. For the scenarios, I implemented the string matching, url extracting, and inverted index.

*Performance*: My MapReduce workflow can process small datasets (5-10 documents) across 3 nodes in under 2 seconds, with the majority of time spent on network communication during the shuffle phase.

## Key Feature

The map phase checks if the mapper output is an array or a single object, and normalizes both into a flat results array before storing. This allows mappers to return either `{key: value}` or `[{key: value}, ...]`.