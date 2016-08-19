'use strict';

var async = require('async'),
	extend = require('extend');

module.exports = function(cursor, options, iterator, callback) {
	if (typeof options === 'function') {
		callback = iterator;
		iterator = options;
		options = {};
	}

	options = extend({
		concurrency: 100,
		batch: false,
		batchSize: 10
	}, options);

	var queue = async.queue(iterator, options.concurrency),
		stream = cursor.stream(),
		batch;

	var done = function(err) {
		if (err) {
			queue.kill();
			return callback(err);
		}

		stream.resume();
	};

	if (options.batch) {
		cursor.batchSize(options.concurrency * options.batchSize);
		batch = [];
	} else {
		cursor.batchSize(options.concurrency);
		stream = cursor.snapshot(true).stream();
	}

	queue.saturated = function() {
		stream.pause();
	};

	stream.on('data', function(data) {
		if (options.batch && batch.length < options.batchSize) {
			return batch.push(data);
		}

		queue.push(options.batch ? [batch] : data, done);

		if (options.batch && batch.length === options.batchSize) {
			batch = [data];
		}
	});

	stream.on('end', function() {
		if (options.batch) {
			queue.push([batch], done);
		}

		if (queue.idle()) {
			callback();
		} else {
			queue.drain = callback;
		}
	});
};
