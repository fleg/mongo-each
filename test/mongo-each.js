var expect = require('expect.js'),
	MongoClient = require('mongodb').MongoClient,
	Steppy = require('twostep').Steppy,
	each = require('../lib/mongo-each.js');

describe('mongo-each test', function() {
	var db, collection, cursor, count,
		expectedCount = 2000;

	before(function(done) {
		Steppy(
			function() {
				MongoClient.connect(
					process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/each_test',
					this.slot()
				);
			},
			function(err, _db) {
				db = _db;
				collection = db.collection('test');

				collection.remove(this.slot());
			},
			function(err) {
				var batch = collection.initializeUnorderedBulkOp();

				for (var i = 0; i < expectedCount; ++i) {
					batch.insert({data: i});
				}

				batch.execute(this.slot());
			},
			done
		);
	});

	beforeEach(function() {
		cursor = collection.find();
		count = 0;
	});

	it('iterate over each document in cursor', function(done) {
		each(cursor, {
			concurrency: 50,
			batch: false
		}, function(doc, callback) {
			expect(doc).to.be.ok();
			++count;
			callback();
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	it('iterate over each document in cursor, with defaults options', function(done) {
		each(cursor, function(doc, callback) {
			expect(doc).to.be.ok();
			++count;
			callback();
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	it('pass error from iterator to main callback', function(done) {
		var error = 'i am an error';

		each(cursor, function(doc, callback) {
			callback(error);
		}, function(err) {
			expect(err).to.be.eql(error);
			done();
		});
	});


	it('batch iterate when batchSize is multiple of cursor count', function(done) {
		var batchSize = 10;

		each(cursor, {
			concurrency: 1000,
			batch: true,
			batchSize: batchSize
		}, function(docs, callback) {
			expect(docs).to.be.an('array');
			expect(docs.length).to.be.eql(batchSize);
			count += docs.length;
			callback();
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	it('batch iterate batchSize is not multiple of cursor count', function(done) {
		var batchSize = 17;

		each(cursor, {
			concurrency: 1000,
			batch: true,
			batchSize: batchSize
		}, function(docs, callback) {
			expect(docs).to.be.an('array');
			expect(docs.length).to.be.above(0);
			expect(docs.length).to.be.below(batchSize + 1);
			count += docs.length;
			callback();
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});
});
