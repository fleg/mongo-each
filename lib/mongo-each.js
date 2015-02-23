"use strict";

var async = require("async"),
	extend = require("extend"),
	BatchStream = require("./BatchStream")
	;
	
var each = module.exports = function(cursor, iterator, options, callback) {
	if(typeof options == "function") {
		callback = options;
		options = { }
	}
	
	options = extend({
		concurrency: 100,
		batch: false,
		batchSize: 10,
		rewind: true
	}, options);
	
	var queue = async.queue(iterator, options.concurrency),
		stream
		;
	
	if(options.rewind) {
		cursor.rewind();
	}
	
	if(options.batch) {
		cursor.batchSize(options.concurrency * options.batchSize);
		stream = new BatchStream(options.batchSize);
		cursor.stream().pipe(stream);
	}
	else {
		cursor.batchSize(options.concurrency);
		stream = cursor.stream();
	}
	
	queue.saturated = function() {
		stream.pause();
	}
	
	stream.on("data", function(data) {
		queue.push(options.batch ? [ data ] : data, function(err) {
			if(err) {
				queue.kill();
				return callback(err);
			}
			stream.resume();
		});
	});
	
	stream.on("end", function() {
		if(queue.idle()) {
			callback();
		}
		else {
			queue.drain = callback;
		}
	});
}