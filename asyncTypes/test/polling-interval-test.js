var PollingInterval = require('../src/polling-interval');

module.exports = [
	testInstantiate,
	testEagerStart,
	testOnInterval,
	testOnStop,
	testRestartable,
	testThrowWhenNoInterval,
	testThrowWhenDoubleStart,
	testThrowWhenDoubleStop
];


/**
 * Ensure we can instantiate the poller 
 */
function testInstantiate(beforeExit, assert) {
	var interval = new PollingInterval;
	assert.ok(interval instanceof PollingInterval);
}

/**
 * Test the poller needs to be manually started when not passed a ctor time
 */
function testLazyStart(beforeExit, assert) {
	
	var interval = new PollingInterval;
	var started  = false;
	
	assert.ok(!interval.isRunning());
	
	interval.setInterval(100);
	interval.start();
	
	interval.on('start', function() {
		assert.ok(this.isRunning());
		started = true;
	}.bind(interval));
	
	setTimeout(function() {
		interval.stop();
	}, 400);
	
	beforeExit(function() {
		assert.ok(!interval.isRunning());
		assert.ok(started);
	});
}

/**
 * Test the poller automatically stars when a time is passed in
 */
function testEagerStart(beforeExit, assert) {
	
	var interval = new PollingInterval(1000);
	var started  = false;
	
	interval.on('start', function() {
		assert.ok(this.isRunning());
		started = true;
	}.bind(interval));
	
	setTimeout(function() {
		interval.stop();
	}, 1500);
	
	beforeExit(function() {
		assert.ok(!interval.isRunning());
		assert.ok(started);
	});
}

/**
 * Test the interval event is fired
 */
function testOnInterval(beforeExit, assert) {
	
	var interval  = new PollingInterval(100);
	var intervals = 0;
	
	interval.on('interval', function() {
		intervals++;
	});
	
	setTimeout(function() {
		interval.stop();
	}, 1000);
	
	beforeExit(function() {
		assert.ok(!interval.isRunning());
		// ideally it'll be 10 but we can't gaurantee that 
		assert.ok(intervals >= 4);
	});
}

/**
 * Test the on stop event is fired
 */
function testOnStop(beforeExit, assert) {
	
	var interval  = new PollingInterval(100);
	var intervals = 0;
	var onStop    = false;
	
	interval.on('interval', function() {
		intervals++;
	});
	
	setTimeout(function() {
		interval.stop();
	}, 300);

	interval.on('stop', function() {
		assert.ok(!interval.isRunning());
		assert.ok(intervals > 0);
		onStop = true;
	});
	
	beforeExit(function() {
		assert.ok(!interval.isRunning());
		assert.ok(onStop);
	});
}

/**
 * Test we can restart a poller
 */
function testRestartable(beforeExit, assert) {
	
	var interval  = new PollingInterval(100);
	var starts    = 0;
	var stops     = 0;
	var intervals = 0;
	
	interval.on('start', function() {
		starts++;
	});
	
	interval.on('stop', function() {
		stops++;
	});
	
	interval.on('interval', function() {
		intervals++;
	});
	
	setTimeout(function() {
		interval.stop();
		setTimeout(function() {
			interval.start();
			setTimeout(function() {
				interval.stop();
			}, 300);
		}, 100);
	}, 300);
	
	beforeExit(function() {
		assert.ok(!interval.isRunning());
		assert.ok(starts == 2);
		assert.ok(stops == 2);
		assert.ok(intervals >= 2);
	});
	
}

function testThrowWhenNoInterval(beforeExit, assert) {
	
}

function testThrowWhenDoubleStop(beforeExit, assert) {
	
}

function testThrowWhenDoubleStart(beforeExit, assert) {
	
}
