# mongo-each
[![Build Status](https://travis-ci.org/fleg/mongo-each.svg?branch=master)](https://travis-ci.org/fleg/mongo-each)
[![Coverage Status](https://coveralls.io/repos/fleg/mongo-each/badge.svg?branch=master&service=github)](https://coveralls.io/github/fleg/mongo-each?branch=master)
[![NPM Version](https://img.shields.io/npm/v/mongo-each.svg)](https://www.npmjs.com/package/mongo-each)

Queued asynchronous iterating over mongodb cursor

## API

### `each(cursor, iteratee, [options])`
* `cursor` - a mongodb cursor
* `iteratee` - `function(doc)` - iteratee function, should return promise
* `options` - optional
	* `concurrency` - how many `iteratee` functions should be run in parallel (default: `100`)
	* `batch` - batch mode (default: `false`)
	* `batchSize` - batch size (default: `10`)

Returns promise which is resolves when all iteratee functions have finished, or rejects if an error occurs


## Example

```js
const {MongoClient} = require('mongodb');
const each = require('mongo-each');

async function main() {
	const db = await MongoClient.connect('mongodb://127.0.0.1:27017/mongo-each');
	const collection = db.collection('data');
	const cursor = collection.find();

	await each(collection.find(), async (doc) => {
		console.log(doc)

		await delay(100);
	}, {concurrency: 50});
}

function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

main();
```

## License

MIT
