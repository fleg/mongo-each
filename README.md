# mongo-each
mongodb queued asynchronous each


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