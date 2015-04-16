# mongo-each
Queued asynchronous iterating over mongodb cursor

## API

### `each(cursor, [options], iterator, callback)`
* `cursor` - a mongodb cursor
* `iterator` - `function(doc, cb)` - iterator function
* `options` - optional
	* `concurrency` - how many `iterator` functions should be run in parallel (default: `100`)
	* `batch` - batch mode (default: `false`)
	* `batchSize` - batch size (default: `10`)
* `callback` - `function(err)` callback which is called when all iterator functions have finished, or an error occurs


## Example

```JavaScript
var MongoClient = require("mongodb").MongoClient,
	each = require("mongo-each")
	;
	
MongoClient.connect("mongodb://127.0.0.1:27017/data", function(err, db) {
	if(err) throw err;

	var collection = db.collection("data"),
		cursor = collection.find();
	
	each(cursor, function(doc, cb) {
		process.nextTick(function() {
			console.log(doc);
			cb();
		});
	}, {
		concurrency: 1000
	}, function(err) {
		console.log("err: ", err);
		console.log("completed");
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
