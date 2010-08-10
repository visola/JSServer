/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

(function () {
	test.start('DB Objects');
	
	var dbName = 'dbobjects';
	var tableName = 'TEST';
	
	var db = database.addDatabase(dbName, 'org.h2.Driver', 'jdbc:h2:test/database/test', 'sa', 'sa');
	
	try {
		db.execute('DROP TABLE ' + tableName);
	} catch (e) {}
	
	db.execute('CREATE TABLE ' + tableName + ' (ID BIGINT, NAME VARCHAR(100))');
	
	var q = new database.Query(tableName);
	test.fail('Query should throw an exception if using abstract type.', function () {
		q.build();
	});
	
	var objects = [
	               {id : 1, name : 'John'}, 
	               {id : 2, name : 'Michael'}, 
	               {id : 3, name : 'Teddy'}, 
	               {id : 4, name : 'Mary'}
	              ];

	// Insert data into database
	var insert = new database.Insert(tableName, {database : db});
	for (var i = 0; i < objects.length; i++) {
		insert.setData(objects[i]);
		insert.execute();
	}
	
	var select = new database.Select(tableName, {database : dbName});
	
	// Should bring all data in the table
	var result = select.execute();
	test.assertEquals('All records should be in the database.', objects.length, result.length);
	
	// Check each object
	for (var i = 0; i < objects.length; i++) {
		test.assertEquals('Record must be in the database.', objects[i].id, result[i].id);
	}
	
	// Filter query
	var id = 1;
	select.addData({id:id});
	result = select.execute();
	
	test.assertEquals('Must have found one record.', 1, result.length);
	test.assertEquals('Must have found the record.', objects[id - 1].name, result[0].name);
	
	test.end();
})();