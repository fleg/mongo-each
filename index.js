const fastq = require('fastq');
const {callbackify} = require('util');

module.exports = (cursor, iteratee, {
	concurrency = 100,
	batch = false,
	batchSize = 10
} = {}) => new Promise((resolve, reject) => {
	const queue = fastq(callbackify(iteratee), concurrency);
	const stream = cursor.stream();
	let docs;

	function done(err) {
		if (err) {
			stream.close();
			queue.kill();
			return reject(err);
		}

		stream.resume();
	}

	stream.on('error', (err) => {
		queue.kill();
		reject(err);
	});

	if (batch) {
		cursor.batchSize(concurrency * batchSize);
		docs = [];
	} else {
		cursor.batchSize(concurrency);
	}

	queue.saturated = () => {
		stream.pause();
	};

	stream.on('data', (doc) => {
		if (batch && docs.length < batchSize) {
			return docs.push(doc);
		}

		queue.push(batch ? docs : doc, done);

		if (batch && docs.length === batchSize) {
			docs = [doc];
		}
	});

	stream.on('end', () => {
		if (batch && docs.length > 0) {
			queue.push(docs, done);
		}

		if (queue.idle()) {
			resolve();
		} else {
			queue.drain = resolve;
		}
	});
});
