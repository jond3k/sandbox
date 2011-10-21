var assert = require('assert');

var AsyncIterator = require('../src/async-iterator');

module.exports = [
	testIKnowHowDeleteWorks,
	testIteratesArrays,
	testIteratesDictionaries,
	testMultipleInstances,
	testBatchesArrays,
	testBatchesDictionaries,
	testMultipleBatches,
	testMegaBatch
]

var testArrays = [
	[1],
	[1, 2, 3],
	[1, 2],
	[0],
	[undefined],
	[null],
	[],
	[{'a':12}, {'b':14}]
];

var testObjs = [
	{1:1},
	{1:1, 2:2, 3:3},
	{'a':1, 'b':2},
	{0:0},
	{0:undefined},
	{0:null},
	{undefined:true},
	{'a':{'a':12},'b':{'b':14}}
];

/**
 * Well I had to make sure
 */
function testIKnowHowDeleteWorks() {
	
	var x = [12,13,14];
	var y = [];
	for(var i in x) {
		y[i] = x[i];
	}
	assert.deepEqual(y, x);
	delete y[1];
	assert.equal(y[1], undefined);
	assert.equal(x[1], 13);
}

/**
 * 
 */
function testIteratesArrays() {
	
	for(var i in testArrays) {
		_testIterate(testArrays[i])
	}
}

/**
 * 
 */
function testIteratesDictionaries() {
	
	for(var i in testObjs) {
		_testIterate(testObjs[i]);
	}
}

/**
 * 
 */
function testMultipleInstances() {
	
	testIteratesArrays();
	testIteratesDictionaries();
	testIteratesArrays();
	testIteratesDictionaries();
}

/**
 *
 */
function testBatchesArrays() {
	
	for(var i in testArrays) {
		_testBatch(testArrays[i]);
	}
}

/**
 * 
 */
function testBatchesDictionaries() {
	
	for(var i in testObjs) {
		_testBatch(testObjs[i]);
	}
}

/**
 * Test multiple batches.
 * 
 * Makes sure we don't deface the original data
 */
function testMultipleBatches() {
	
	testBatchesArrays();
	testBatchesDictionaries();
	testBatchesArrays();
	testBatchesDictionaries();
}

/**
 * Test a large batch
 */
function testMegaBatch() {
	
	var megaBatch = {};
	for(var i=0; i<1000; i++) {
		
		megaBatch["key" + i] = {
			'value': 'value' + i,
			'value+1': 'value' + (i+1)
		}
	}

	_testBatch(megaBatch);
	
}


/**
 * Determine what kind of batches we should get from iterating some data
 */
function _getExpectedBatches(data, batchSize) {

	if (!(batchSize>0)) {
		batchSize = 1;
	}
		
	var expected = [];
	
	var i = 0;
	for(var k in data) {

		var v = data[k];
		var batch = parseInt(i/batchSize);
		
		if (!expected[batch]) {
			expected[batch] = {};
		}
		
		expected[batch][k] = v;
		
		i++;
	}
	
	return expected;
}

/**
 * Get the expected items we should be given from the 'next' event
 */
function _getExpectedItems(data) {

	var expected = {};
	
	for(var k in data) {
		expected[k] = data[k];
	}
	
	return expected;
}

/**
 * Test batching operations with a range of batch sizes
 */
function _testBatch(data) {
	for(var i=-1; i < 10; i++) {
		_testIterate(data, i);
	}
}

/**
 * The main iterator tester: asserts end, next and batch events
 */
function _testIterate(data, batchSize, sut) {

	if (!sut) {
		sut      = new AsyncIterator(batchSize);
	}
	
	var expectedItems   = _getExpectedItems(data);
	var expectedBatches = _getExpectedBatches(data, batchSize);

	var actualItems   = {};
	var actualBatches = [];

	sut.iterate(data);

	sut.on('next', function(k,v) {
		actualItems[k] = v;
	});

	sut.on('batch', function(batch) {
		actualBatches.push(batch);
	});

	sut.on('end', function() {
		assert.deepEqual(
			actualItems, 
			expectedItems
		);
		assert.deepEqual(
			actualBatches, 
			expectedBatches
		);
	});	
}
