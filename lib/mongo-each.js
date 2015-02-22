"use strict";

var async = require("async"),
	extend = require("extend")
	;
	
var each = function(cursor, iterator, options, callback) {
	if(typeof options == "function") {
		callback = options;
		options = { }
	}
	
	options = extend({
		concurrency: 100
	}, options);
	
	var queue = async.queue(iterator, options.concurrency),
		stream = cursor.stream(),
		streamDone = false
		;
	
	queue.saturated = function() {
		stream.pause();
	}
	
	queue.drain = function() {
		streamDone && cb();
	}
	
	stream.on("data", function(data) {
		queue.push(data, function(err) {
			stream.resume();
		});
	});
	
	stream.on("end", function() {
		streamDone = true;
	});
}