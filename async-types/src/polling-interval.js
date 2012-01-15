var sys    = require('sys');
var events = require('events');

module.exports = PollingInterval;

/**
 * Represents an interval that fires every N seconds
 * 
 * Attach the following events: interval, start, stop
 * 
 * @param intervalMs The number of milliseconds. If set, start immediately
 * 
 * @throws Error If an interval is set but it's invalid
 */
function PollingInterval(intervalMs) {
	this.intervalId   = null;
	this.startEmitted = false;
	
	if (intervalMs) {
		this.setInterval(intervalMs);
		this.start();
	}
}
sys.inherits(PollingInterval, events.EventEmitter);

/**
 * Start polling events
 * 
 * @throws Error If already running
 */
PollingInterval.prototype.start = function() {
	if (!this.intervalMs) {
		throw new Error("No interval was set");
	}
	
	this.ensureState(false);

	this.startEmitted = false;

	this.intervalId = setInterval(
		function() { 
			if (!this.startEmitted) {
				this.emit('start');
				this.startEmitted = true;
			}
			this.emit('interval'); 
		}.bind(this),
		this.intervalMs
	);
}

/**
 * Throw an exception if the polling interval is in the wrong running state
 * 
 * @throws Error If the interval is in the wrong state
 */
PollingInterval.prototype.ensureState = function(running) {
	if (this.isRunning() != running) {
		throw new Error(running ? "Not running" : "Already running");
	}
}

/**
 * Return true if the PollingInterval is running
 * 
 * @return bool
 */
PollingInterval.prototype.isRunning = function() {
	return this.intervalId !== null;
}

/**
 * Set the current interval in seconds
 * 
 * @param intervalMs The number of milliseconds between each event
 * 
 * @throws Error If already running
 * @throws Error If interval is invalid
 */
PollingInterval.prototype.setInterval = function(intervalMs) {
	if (!(intervalMs >= 0)) {
		throw new Error("Expected interval to be >= 0 seconds");
	}
	this.ensureState(false);
	this.intervalMs = intervalMs;
}

/**
 * Stop this interval from running
 * 
 * @throws Error If not already running
 */
PollingInterval.prototype.stop = function() {
	this.ensureState(true);
	clearInterval(this.intervalId);
	this.intervalId = null;
	this.emit('stop');
}


	
	
