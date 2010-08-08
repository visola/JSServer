/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Namespace to store all test stuff.
 */
var test = {};

/**
 * Test logger.
 */
test.logger = org.slf4j.LoggerFactory.getLogger('test');

/**
 * Store all tests.
 */
test.tests = [];

test.result = function () {
	var r = {
		total : 0,
		passed : 0
	};
	
	for (var i = 0; i < test.tests.length; i++) {
		for (var j = 0; j < test.tests[i].assertions.length; j++) {
			if (test.tests[i].assertions[j].passed) r.passed ++;
			r.total ++;
		}
	}
	
	if (r.total > 0) {
		r.percentage = 100 * r.passed / r.total
	} else {
		r.percentage = 0;
	}
	
	return r;
}

/**
 * Start a new test domain.
 */
test.start = function (name) {
	test.end();
	test.logger.debug('Starting test: ' + name);
	test.active = {
		name : name,
		start : new Date(),
		assertions : []
	}
	
	test.tests.push(test.active);
}

test.end = function () {
	if (!test.active) return;
	test.logger.debug('Test ended: ' + test.active.name);
	test.active.end = new Date();
	test.active = null;
}

test.addAssertion = function (message, passed) {
	if (!test.active) {
		test.start('[UNAMED]');
	}
	var assertion = {
		message : message,
		passed : passed ? true : false
	}
	test.logger.debug('Adding assertion: ' + JSON.encode(assertion) + ', to test: ' + test.active.name);
	test.active.assertions.push(assertion);
}

/**
 * Assert that an expression is true.
 * 
 * @param message
 *            {String} Message to display when a test failed.
 * @param expression
 *            {Boolean} Expression to be checked.
 */
test.assertTrue = function (message, expression) {
	test.addAssertion(message, expression);
}

test.assertFalse = function (message, expression) {
	test.assertTrue(message, ! expression);
}

test.assertEquals = function (message, val1, val2) {
	test.assertTrue(message, val1 == val2);
}

test.assertNotEquals = function (message, val1, val2) {
	test.assertTrue(message, val1 != val2);
}