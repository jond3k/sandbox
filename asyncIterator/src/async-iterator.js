var sys    = require('sys');
var events = require('events');

/**
 * Asynchronously iterates over an object
 * 
 * This was created to solve the issue of O(n) iterations eventually taking
 * enough time to delay other events.
 * 
 * It fixes this problem by splitting the iteration of an object up in to
 * multiple ticks. Each tick will iterate a specified number of items.
 * 
 * The biggest limitation is that the iterator is not aware of changes in the
 * data. For this reason, ensure that you check the validity of objects that are
 * iterated.
 * 
 * @param int batchSize The number of items to process per event. (default=1)
 */
function AsyncIterator(batchSize)
{
	if (!this instanceof AsyncIterator) {
		throw new Error("constructor");
	}

	if (!(batchSize > 0)) {
		batchSize = this.DEFAULT_PER_EVENT;
	}
	this.batchSize = batchSize;
	this.data     = null;
}
sys.inherits(AsyncIterator, events.EventEmitter);

/**
 * The default number of iterations to make per asynchronous event
 * 
 * @const int
 */
AsyncIterator.prototype.DEFAULT_PER_EVENT = 1;

/**
 * Begin iterating over some data
 * 
 * The first bunch of iterations will happen in the next tick
 */
AsyncIterator.prototype.iterate = function(data) {

	if (this.isIterating()) {
		throw new Error("Already iterating");
	}
	
	//if (data == undefined) {
	//	throw new Error("Unexpected: " + data);
	//}

	this.data = this._shallowCopy(data);
	this._queueNextTick();

}

/**
 * Are we iterating?
 * 
 * This is important as it's impossible to use the same iterator object twice
 * at the same time. You will have to use the end event to trigger the next
 * iteration if you wish to cycle through the same data periodically.
 */
AsyncIterator.prototype.isIterating = function() {
	return this.data !== null;
}

/**
 * Create a shallow copy of an object
 * 
 * We can do anything we want with the returned object without worrying about
 * affecting the original data source.
 */
AsyncIterator.prototype._shallowCopy = function(data) {
	// create a shallow copy of the input data. this allows us to maintain
	// keys throughout the async iteration process and means we can do whatever
	// we like with it (e.g. delete so we can keep track of our progress)
	var copy = {};

	for(var key in data) {
		copy[key] = data[key];
	}

	return copy;
}

/**
 * Prepare the next part of the iteration
 */
AsyncIterator.prototype._queueNextTick = function() {
	process.nextTick(this._nextTick.bind(this));
}

/**
 * Process the next bunch of items
 */
AsyncIterator.prototype._nextTick = function() {
	var i = 0;
	
	var batch = {};

	for(var key in this.data) {
		
		var value = this.data[key];
		batch[key] = value;
		this.emit('next', key, value);	

		// Sadly we don't have access to SpiderMonkey's Iterator object.
		// instead we remember our position in the object by deleting each 
		// reference when we've finished with it. This means the next iteration
		// will begin with something that hasn't been processed yet.
		delete this.data[key];
		i++;

		if (i >= this.batchSize) {
			break;
		}
	}

	// If we never iterated anything then we must have reached the end
	// This might mean scheduling a redundant tick but I'm not sure if that's
	// any slower than checking the length, but it is more reliable
	if (!i) {
		this.data = null;
		this.emit('end');
	}
	else {
		this.emit('batch', batch);
		this._queueNextTick();
	}
}

module.exports = AsyncIterator;