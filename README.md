# mongo-each
[![Build Status](https://travis-ci.org/fleg/mongo-each.svg?branch=master)](https://travis-ci.org/fleg/mongo-each)
[![Coverage Status](https://coveralls.io/repos/fleg/mongo-each/badge.svg?branch=master&service=github)](https://coveralls.io/github/fleg/mongo-each?branch=master)
[![NPM Version](https://img.shields.io/npm/v/mongo-each.svg)](https://www.npmjs.com/package/mongo-each)

Queued asynchronous iterating over mongodb cursor without duplicates

## API

### `each(cursor, iterator, [options], callback)`
* `cursor` - a mongodb cursor
* `iterator` - `function(doc, cb)` - iterator function
* `options` - optional
	* `concurrency` - how many `iterator` functions should be run in parallel (default: `100`)
	* `batch` - batch mode (default: `false`)
	* `batchSize` - batch size (default: `10`)
	* `snapshot` - enable or disable cursor snapshot (default: `true`)
* `callback` - `function(err)` callback which is called when all iterator functions have finished, or an error occurs


## Example

```js
var MongoClient = require('mongodb').MongoClient,
	each = require('mongo-each');

MongoClient.connect('mongodb://127.0.0.1:27017/data', function(err, db) {
	if(err) throw err;

	var collection = db.collection('data'),
		cursor = collection.find();

	each(cursor, function(doc, callback) {
		process.nextTick(function() {
			console.log(doc);
			callback();
		});
	}, {
		concurrency: 50
	}, function(err) {
		console.log('err: ', err);
		console.log('completed');
	});
});
```

## License

MIT
