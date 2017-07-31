'use strict';

var fastq = require('fastq');

module.exports = function(cursor, iterator, options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	}

	callback = once(callback);

	options.concurrency = options.concurrency || 100;
	options.batch = Boolean(options.batch);
	options.batchSize = options.batchSize || 10;

	var queue = fastq(iterator, options.concurrency),
		stream = cursor.snapshot(true).stream(),
		docs;

	var done = function(err) {
		if (err) {
			stream.close();
			queue.kill();
			return callback(err);
		}

		stream.resume();
	};

	if (options.batch) {
		cursor.batchSize(options.concurrency * options.batchSize);
		docs = [];
	} else {
		cursor.batchSize(options.concurrency);
	}

	queue.saturated = function() {
		stream.pause();
	};

	stream.on('data', function(doc) {
		if (options.batch && docs.length < options.batchSize) {
			return docs.push(doc);
		}

		queue.push(options.batch ? docs : doc, done);

		if (options.batch && docs.length === options.batchSize) {
			docs = [doc];
		}
	});

	stream.on('end', function() {
		if (options.batch) {
			queue.push(docs, done);
		}

		if (queue.idle()) {
			callback();
		} else {
			queue.drain = callback;
		}
	});
};

function once(func) {
	var called = false;

	return function() {
		if (called) {
			return;
		}

		func.apply(this, arguments);
		called = true;
	};
}
