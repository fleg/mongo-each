﻿'use strict';

var expect = require('expect.js'),
	MongoClient = require('mongodb').MongoClient,
	Steppy = require('twostep').Steppy,
	each = require('../');

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

	var timeout = function(callback) {
		setTimeout(callback, 1);
	};

	it('iterate over each document', function(done) {
		var count = 0;

		each(collection.find(), function(doc, callback) {
			expect(doc).to.be.ok();
			++count;
			timeout(callback);
		}, {
			concurrency: 50,
			batch: false
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
			timeout(callback);
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	it('pass error from iterator to main callback', function(done) {
		each(collection.find(), function(doc, callback) {
			callback(new Error('foobar'));
		}, function(err) {
			expect(err.message).to.be.eql('foobar');
			done();
		});
	});

	it('pass error from stream to main callback', function(done) {
		var cursor = collection.find(),
			stream = cursor.stream();

		cursor.stream = function() {
			return stream;
		};

		each(cursor, function(doc, callback) {
			callback();
		}, function(err) {
			expect(err.message).to.be.eql('foobar');
			done();
		});

		stream.emit('error', new Error('foobar'));
	});

	it('call main callback just once', function(done) {
		var called = false;

		each(collection.find(), function(doc, callback) {
			callback(new Error('foobar'));
		}, function() {
			if (called) {
				return done(new Error('called more than once'));
			}

			called = true;
			done();
		});
	});


	it('batch iterate when batchSize is multiple of cursor count', function(done) {
		var count = 0,
			batchSize = 10;

		each(collection.find(), function(docs, callback) {
			expect(docs).to.be.an('array');
			expect(docs.length).to.be.eql(batchSize);
			count += docs.length;
			timeout(callback);
		}, {
			concurrency: 1000,
			batch: true,
			batchSize: batchSize
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	it('batch iterate batchSize is not multiple of cursor count', function(done) {
		var count = 0,
			batchSize = 17;

		each(collection.find(), function(docs, callback) {
			expect(docs).to.be.an('array');
			expect(docs.length).to.be.above(0);
			expect(docs.length).to.be.below(batchSize + 1);
			count += docs.length;
			timeout(callback);
		}, {
			concurrency: 1000,
			batch: true,
			batchSize: batchSize
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	it('iterate over each document without dups', function(done) {
		var count = 0,
			hash = {},
			first = true;

		each(collection.find({data: {$gte: 0}}), function(doc, callback) {
			expect(doc).to.be.ok();
			expect(hash).not.have.property(doc._id.toString());
			hash[doc._id.toString()] = true;
			++count;
			if (first) {
				first = false;
				collection.updateOne({_id: doc._id}, {$set: {data: 5000}}, callback);
			} else {
				timeout(callback);
			}
		}, {
			concurrency: 10,
			batch: false
		}, function(err) {
			expect(count).to.be.eql(expectedCount);
			done(err);
		});
	});

	[true, false].forEach(function(value) {
		it('with snapshot = ' + value, function(done) {
			var cursor = collection.find({}, {limit: 1});

			each(cursor, function(doc, callback) {
				timeout(callback);
			}, {
				snapshot: value
			}, function(err) {
				expect(cursor.s.cmd.snapshot).to.be.eql(value);
				done(err);
			});
		});
	});
});
