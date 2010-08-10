/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function () {
	test.start('Database');
	
	var dbName = 'db';
	
	var db = database.addDatabase(dbName, 'org.h2.Driver', 'jdbc:h2:test/database/test', 'sa', 'sa');
	test.assertDefined('Database must have been created.', db);
	
	try {
		db.execute('DROP TABLE TEST');
	} catch (e) {}
	
	db.execute('CREATE TABLE TEST (ID BIGINT, NAME VARCHAR(100))');
	
	var names = ['John', 'Michael', 'Teddy', 'Mary'];
	
	for (var i = 0; i < names.length; i++) {
		db.execute('INSERT INTO TEST (ID, NAME) VALUES (?, ?)', [i, names[i]]);
	}
	
	var countResult = db.execute('SELECT COUNT(*) AS COUNT FROM TEST');
	test.assertEquals('Count must be equals to name array.', names.length, countResult[0].count);
	
	result = db.execute('SELECT * FROM TEST ORDER BY ID');
	for (var i = 0; i < result.length; i++) {
		test.assertEquals('Names must be saved into database.', names[i], result[i].name);
	}
	
	var id = 3;
	var result = db.execute('SELECT * FROM TEST WHERE ID = ?', [id]);
	test.assertEquals('Name must be saved into database.', names[id], result[0].name);
	
	test.end();
})();