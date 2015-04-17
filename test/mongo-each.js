var should = require("should"),
	MongoClient = require("mongodb").MongoClient,
	each = require("../lib/mongo-each.js")
	;

var db, collection,
	cursor, expectedCount,
	populateCount = 10000
	;
	
describe("Connect to mongodb and populate collection", function() {
	
	it("Connect to mongodb", function(done) {
		MongoClient.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/each_test", function(err, connection) {
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
		var batch = collection.initializeUnorderedBulkOp()
			;
		
		for(var i = 0; i < populateCount; ++i) {
			batch.insert({data: i});
		}
	
		batch.execute(function(err) {
			should.not.exist(err);
			done();
		});
		
	});
	
});

describe("Iterate over cursor", function() {
	
	beforeEach(function(done) {
		cursor = collection.find();
		
		cursor.count(function(err, count) {
			if(err) { return done(err); }
			
			expectedCount = count;
			done();
		});
	});
	
	it("Iterate over each document in cursor", function(done) {
		var count = 0;
		each(cursor, {
			concurrency: 1000,
		}, function(doc, cb) {
			doc.should.be.ok;
			
			++count;
			cb();
		}, function(err) {
			should.not.exist(err);
			count.should.be.equal.expectedCount;
			done();
		});
	});
	
	it("Iterate over each document in cursor, with defaults options", function(done) {
		var count = 0;
		each(cursor, function(doc, cb) {
			doc.should.be.ok;
			
			++count;
			cb();
		}, function(err) {
			should.not.exist(err);
			count.should.be.equal.expectedCount;
			done();
		});	
	});
	
	it("Pass error from iterator to main callback", function(done) {
		var cursor = collection.find();
		var error = "i'm an error";
		
		each(cursor, function(doc, cb) {
			cb(error);
		}, function(err) {
			err.should.be.equal(error);
			done();
		});	
	});

	describe("Batch iterate over cursor", function() {
	
		it("batchSize is multiple of cursor count", function(done) {
			var batchSize = 10,
				count = 0
				;
				
			each(cursor, {
				concurrency: 1000,
				batch: true,
				batchSize: batchSize
			}, function(docs, cb) {
				docs.should.be.an.instanceOf(Array).and.have.lengthOf(batchSize);
			
				count += docs.length;
				cb();
			}, function(err) {
				should.not.exist(err);
				count.should.be.equal(expectedCount);
				done();
			});	
		});
		
		it("batchSize isn't multiple of cursor count", function(done) {
			var batchSize = 17,
				count = 0
				;
			
			each(cursor, {
				concurrency: 1000,
				batch: true,
				batchSize: batchSize
			}, function(docs, cb) {
				docs.should.be.an.instanceOf(Array);

				count += docs.length;
				cb();
			}, function(err) {
				should.not.exist(err);
				count.should.be.equal(expectedCount);
				done();
			});	
		});
	
	});
	
});

