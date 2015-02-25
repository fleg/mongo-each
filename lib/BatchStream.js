"use strict";

var util = require("util"),
	Writable = require("stream").Writable
	;
	
var BatchStream = function(batchSize) {
	Writable.call(this, { objectMode: true });
	this.batchSize = batchSize || 10;
	this.batch = [ ];
	
	this.on("finish", function() {
		if(this.batch.length) {
			this.emit("data", this.batch);
		}
		this.emit("end");
	});
	
	this.on("pipe", function(src) {
		this.src = src;
	});
}
util.inherits(BatchStream, Writable);

BatchStream.prototype._write = function(data, encoding, cb) {
	if(this.batch.length == this.batchSize) {
		this.emit("data", this.batch);
		this.batch = [ data ];
	}
	else {
		this.batch.push(data);
	}
	cb();
}

BatchStream.prototype.pause = function() {
	this.src.pause();
}

BatchStream.prototype.resume = function() {
	this.src.resume();
}

module.exports = BatchStream;