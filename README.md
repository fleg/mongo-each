# mongo-each
[![Build Status](https://travis-ci.org/fleg/mongo-each.svg?branch=master)](https://travis-ci.org/fleg/mongo-each)
[![Coverage Status](https://coveralls.io/repos/fleg/mongo-each/badge.svg?branch=master&service=github)](https://coveralls.io/github/fleg/mongo-each?branch=master)
[![NPM Version][npm-image]][npm-url]

Queued asynchronous iterating over mongodb cursor

## API

### `each(cursor, [options], iterator, callback)`
* `cursor` - a mongodb cursor
* `options` - optional
	* `concurrency` - how many `iterator` functions should be run in parallel (default: `100`)
	* `batch` - batch mode (default: `false`)
	* `batchSize` - batch size (default: `10`)
* `iterator` - `function(doc, cb)` - iterator function
* `callback` - `function(err)` callback which is called when all iterator functions have finished, or an error occurs


## Example

```JavaScript
var MongoClient = require('mongodb').MongoClient,
	each = require('mongo-each');

MongoClient.connect('mongodb://127.0.0.1:27017/data', function(err, db) {
	if(err) throw err;

	var collection = db.collection('data'),
		cursor = collection.find();

	each(cursor, {
		concurrency: 50
	}, function(doc, callback) {
		process.nextTick(function() {
			console.log(doc);
			callback();
		});
	}, function(err) {
		console.log('err: ', err);
		console.log('completed');
	});
});
```

## Tests
Run:
```sh
npm test
```

Pass mongodb connection string through `MONGODB_URI` variable or use default value `mongodb://127.0.0.1:27017/each_test`

## License

MIT

[npm-image]: https://img.shields.io/npm/v/mongo-each.svg
[npm-url]: https://www.npmjs.com/package/mongo-each
