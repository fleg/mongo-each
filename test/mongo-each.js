var should = require("should"),
	MongoClient = require("mongodb").MongoClient,
	each = require("../lib/mongo-each.js")
	;

var db, collection;
	
describe("Connect to mongodb and populate collection", function() {
	
	it("Connect to mongodb", function(done) {
		MongoClient.connect("mongodb://127.0.0.1:27017/each_test", function(err, connection) {
			should.not.exist(err);
			db = connection;
			collection = db.collection("test");
			done();
		});
	});
	
	it("Drop collection", function(done) {
		collection.remove(function(err) {
			should.not.exist(err);
			done();
		})
	});
	
	it("Populate collection", function(done) {
		var docs = [ ],
			count = 10000
			;
			
		for(var i = 0; i < count; ++i) {
			docs.push({data: i});
		}
	
		collection.insert(docs, { safe: true }, function(err) {
			should.not.exist(err);
			done();
		});
		
	});
	
});

describe("Iterate over cursor", function() {

	it("Iterate over each document in cursor", function(done) {
		var cursor = collection.find();
		
		cursor.count(function(err, expectedCount) {
			should.not.exist(err);
			
			var count = 0;
			each(cursor, function(doc, cb) {
				doc.should.be.an.Object;
				
				++count;
				process.nextTick(cb);
			}, {
				concurrency: 1000,
			}, function(err) {
				should.not.exist(err);
				count.should.be.equal.expectedCount;
				done();
			});
		});	
	});
	
	it("Iterate over each document in cursor, with defaults options", function(done) {
		var cursor = collection.find();
		
		cursor.count(function(err, expectedCount) {
			should.not.exist(err);
			
			var count = 0;
			each(cursor, function(doc, cb) {
				doc.should.be.an.Object;
				
				++count;
				process.nextTick(cb);
			}, function(err) {
				should.not.exist(err);
				count.should.be.equal.expectedCount;
				done();
			});
		});	
	});
	
	it("Pass error from iterator to main callback", function(done) {
		var cursor = collection.find();
		
		cursor.count(function(err, expectedCount) {
			should.not.exist(err);
			
			var count = 0;
			each(cursor, function(doc, cb) {
				++count;
				process.nextTick(function() {
					cb("i'm an error");
				});
			}, {
				concurrency: 1000,
			}, function(err) {
				err.should.be.equal("i'm an error");
				done();
			});
		});	
	});

	describe("Batch iterate over cursor", function() {
	
		it("batchSize is multiple of cursor count", function(done) {
			var cursor = collection.find(),
				batchSize = 10
				;
			
			cursor.count(function(err, expectedCount) {
				should.not.exist(err);
				
				var count = 0;
				each(cursor, function(docs, cb) {
					docs.should.be.an.Array;
				
					count += docs.length;
					process.nextTick(cb);
				}, {
					concurrency: 1000,
					batch: true,
					batchSize: batchSize
				}, function(err) {
					should.not.exist(err);
					count.should.be.equal(expectedCount);
					done();
				});
			});	
		});
		
		it("batchSize isn't multiple of cursor count", function(done) {
			var cursor = collection.find(),
				batchSize = 17
				;
			
			cursor.count(function(err, expectedCount) {
				should.not.exist(err);
				
				var count = 0;
				each(cursor, function(docs, cb) {
					docs.should.be.an.Array;
					
					count += docs.length;
					process.nextTick(cb);
				}, {
					concurrency: 1000,
					batch: true,
					batchSize: batchSize
				}, function(err) {
					should.not.exist(err);
					count.should.be.equal(expectedCount);
					done();
				});
			});	
		});
	
	});
	
});

