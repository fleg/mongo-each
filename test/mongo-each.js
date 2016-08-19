'use strict';

var expect = require('expect.js'),
	MongoClient = require('mongodb').MongoClient,
	Steppy = require('twostep').Steppy,
	each = require('../lib/mongo-each.js');

describe('mongo-each test', function() {
	var db, collection,
		expectedCount = 2000;

	before(function(done) {
		Steppy(
			function() {
				MongoClient.connect(
					'mongodb://127.0.0.1:27017/mongo_each_test',
					this.slot()
				);
			},
			function(err, _db) {
				db = _db;
				db.dropDatabase(this.slot());
			},
			function() {
				collection = db.collection('test');

				var batch = collection.initializeUnorderedBulkOp();

				for (var i = 0; i < expectedCount; ++i) {
					batch.insert({data: i});
				}

				batch.execute(this.slot());
				collection.createIndex({data: 1}, this.slot());
			},
			done
		);
	});


	it('iterate over each document', function(done) {
		var count = 0;

		each(collection.find(), {
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

	it('iterate over each document with defaults options', function(done) {
		var count = 0;

		each(collection.find(), function(doc, callback) {
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

		each(collection.find(), function(doc, callback) {
			callback(error);
		}, function(err) {
			expect(err).to.be.eql(error);
			done();
		});
	});


	it('batch iterate when batchSize is multiple of cursor count', function(done) {
		var count = 0,
			batchSize = 10;

		each(collection.find(), {
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
		var count = 0,
			batchSize = 17;

		each(collection.find(), {
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

	it('iterate over each document without dups', function(done) {
		var hash = {},
			first = true;

		each(collection.find({data: {$gte: 0}}), {
			concurrency: 10,
			batch: false
		}, function(doc, callback) {
			expect(doc).to.be.ok();
			expect(hash).not.have.property(doc._id.toString());
			hash[doc._id.toString()] = true;
			if (first) {
				first = false;
				collection.updateOne({_id: doc._id}, {$set: {data: 5000}}, callback);
			} else {
				callback();
			}
		}, done);
	});
});
