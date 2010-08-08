/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */


(function () {
	test.start('$chk');
	
	test.assertFalse('Check should return false when receive null', $chk(null));
	test.assertFalse('Check should return false when receive undefined', $chk(undefined));
	test.assertTrue('Check should return true when receive zero', $chk(0));
	
	test.end();
})();


(function () {
	test.start('$defined');
	
	test.assertFalse('Undefined variable must return false.', $defined(d));
	
	var d = 'defined';
	test.assertTrue('Defined object must return true.', $defined(d));
	
	test.end();
})();

