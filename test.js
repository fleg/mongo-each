const t = require('tap');
const {MongoClient} = require('mongodb');
const each = require('./');

function delay(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

t.test('mongo-each', async (t) => {
	const db = await MongoClient.connect('mongodb://127.0.0.1:27017/mongo_each_test');
	const collection = db.collection('test');
	const collectionSize = 1000;

	await db.dropDatabase();

	await collection.insertMany(Array(collectionSize).fill().map((v, i) => ({
		data: i + 1
	})));

	await t.test('iterate over each document', async (t) => {
		let count = 0;

		await each(collection.find(), async (doc) => {
			t.ok(doc._id);
			t.ok(doc.data);

			count++;
			await delay(100);
		});

		t.is(count, collectionSize);
	});

	await t.test('catch error from iteratee', async (t) => {
		await t.rejects(
			each(collection.find(), () => Promise.reject(new Error('foobar'))),
			{message: 'foobar'}
		);
	});

	await t.test('catch error from cursor stream', async (t) => {
		const cursor = collection.find();
		const stream = cursor.stream();

		cursor.stream = () => stream;

		const result = each(cursor, () => Promise.resolve());

		stream.emit('error', new Error('foobar'));

		await t.rejects(result, {message: 'foobar'});
	});

	await t.test('batch mode', async (t) => {
		const batchSize = 100;
		let count = 0;

		await each(collection.find(), async (docs) => {
			t.is(docs.length, batchSize);

			count += docs.length;
			await delay(100);
		}, {batch: true, batchSize, concurrency: 5});

		t.is(count, collectionSize);
	});

	await t.test('batch mode', async (t) => {
		const batchSize = 89;
		let count = 0;

		await each(collection.find(), async (docs) => {
			t.ok(
				docs.length === batchSize ||
				docs.length === collectionSize - batchSize * Math.floor(
					collectionSize / batchSize
				)
			);

			count += docs.length;
			await delay(100);
		}, {batch: true, batchSize, concurrency: 5});

		t.is(count, collectionSize);
	});

	await db.close(true);
});
