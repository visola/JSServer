/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * Namespace for database related objects, classes and functions.
 */
var database = {};

/**
 * Separated logger for database utility.
 */
database.logger = org.slf4j.LoggerFactory.getLogger('database');

/**
 * Create a new database pool with the specified name.
 * 
 * @param dbName
 *            {String} Name of the database pool.
 * @param driver
 *            {String} JDBC driver name.
 * @param url
 *            {String} JDBC url.
 * @param user
 *            {String} User to be used.
 * @param password
 *            {String} Password for the specified user.
 * @return {database.Database} The newly created database object.
 */
database.addDatabase = function (dbName, driver, url, user, password) {
	return database[dbName] = new database.Database(dbName, driver, url, user, password);
};

/**
 * Return a connection to the pool.
 * 
 * @param conn
 *            {java.sql.Connection} The connection that will be returned.
 */
database.close = function (conn) {
	if (conn != null) {
		conn.close();
	}
};

/**
 * Namespace for <code>java.sql.PreparedStatement</code> utility methods.
 */
database.ps = {};

/**
 * Set a parameter into the prepared statement.
 * 
 * @param ps
 *            {java.sql.PreparedStatement} To set the parameter in.
 * @param sqlType
 *            {Number} The java.sql.Types constant for this parameter.
 * @param index
 *            {Number} The index of the parameter in the prepared
 *            statement.
 * @param param
 *            {Object} The value of the parameter.
 * @return {java.sql.PreaparedStatement} The prepared statement passed in.
 */
database.ps.setParameter = function (ps, sqlType, index, param) {
	database.logger.debug('Setting param, SQL Type: ' + sqlType + ', index: ' + index + ', type: ' + (typeof param) + ', value: ' + JSON.encode(param));
	switch (sqlType) {
		case java.sql.Types.DOUBLE:
			ps.setDouble(index, param);
			break;
			
		case java.sql.Types.FLOAT:
			ps.setFloat(index, param);
			break;
			
		case java.sql.Types.BOOLEAN:
			ps.setBoolean(index, param);
			break;
		
		case java.sql.Types.DATE:
			ps.setDate(index, new java.sql.Date(param.getTime()));
			break;
			
		case java.sql.Types.INTEGER:
		case java.sql.Types.SMALLINT:
			ps.setInt(index, param);
			break;
			
		case java.sql.Types.BIGINT:
			ps.setLong(index, param);
			break;
		
		case java.sql.Types.CHAR:
		case java.sql.Types.VARCHAR:
		case java.sql.Types.LONGVARCHAR:
		default:
			ps.setString(index, param);
	};
};

/**
 * Namespace for <code>java.sql.ResultSet</code> utility methods.
 */
database.rs = {};

/**
 * Read all data from a <code>java.sql.ResultSet</code> and fill an array with
 * objects representing the data. Column names will be transformed from
 * underscored to camel case: PERSON_ID will become personId.
 * 
 * @param resultSet
 *            {java.sql.ResultSet} The result set to read from.
 * @param callback
 *            {Function} Will be called for each row with the object retrieved.
 *            It will be passed the object and the row count (starting from
 *            one).
 * @param fetchCount
 *            {Number} Stop after <code>fetchCount</code> records are read. If
 *            less than zero, all records will be read.
 * @return {Array} An array with all data.
 */ 
database.rs.toArray = function (resultSet, callback, fetchCount) {
	var md = resultSet.getMetaData();
	
	// Fetch column names
	var columnNames = [];
	var columnTypes = [];
	for (var i = 1; i <= md.getColumnCount(); i++) {
		columnNames.push(md.getColumnLabel(i));
		columnTypes.push(md.getColumnType(i));
	}
	
	// Fetch data and add to array
	var result = [];
	var counter = 0;
	while(resultSet.next()) {
		counter++;
		var o = {};
		for (var i = 0; i < columnNames.length; i++) {
			switch (columnTypes[i]) {
				case java.sql.Types.DOUBLE:
				case java.sql.Types.FLOAT:
					o[columnNames[i].camelCase()] = resultSet.getDouble(i + 1);
					break;
					
				case java.sql.Types.BOOLEAN:
					o[columnNames[i].camelCase()] = resultSet.getBoolean(i + 1);
					break;
				
				
				case java.sql.Types.DATE:
				case java.sql.Types.TIME:
				case java.sql.Types.TIMESTAMP:
					o[columnNames[i].camelCase()] = Date(resultSet.getDate(i + 1));
					break;
					
				case java.sql.Types.INTEGER:
				case java.sql.Types.SMALLINT:
				case java.sql.Types.BIGINT:
					o[columnNames[i].camelCase()] = resultSet.getLong(i + 1);
					break;
				
				case java.sql.Types.CHAR:
				case java.sql.Types.VARCHAR:
				case java.sql.Types.LONGVARCHAR:
				default:
					o[columnNames[i].camelCase()] = String(resultSet.getString(i + 1));
			};
		}
		if (callback) callback(o, counter);
		result.push(o);
		
		if (fetchCount > 0 && counter == fetchCount) {
			break;
		}
	}
	
	return result;
};

/**
 * Create a new database object that represent a pool of connections. The
 * created database will not be registered in the <code>database</code>
 * namespace.
 * 
 * @param dbName
 *            {String} Name of the database pool.
 * @param driver
 *            {String} JDBC driver name.
 * @param url
 *            {String} JDBC url.
 * @param user
 *            {String} User to be used.
 * @param password
 *            {String} Password for the specified user.
 * @see {@link database#addDatabase}
 */
database.Database = function (dbName, driver, url, user, password) {
	database.logger.debug('Creating database pool, Driver: ' + driver + ', user: ' + user + ', URL: ' + url);
	
	this.dbName = dbName;
	this.driver = driver;
	this.url = url;
	this.user = user;
	
	// Load user driver
	java.lang.Class.forName(driver);
	
	 // Create the object pool that will manage the connections
	var connectionPool = new org.apache.commons.pool.impl.GenericObjectPool(null);
	
	// Connection factory
	var connectionFactory = new org.apache.commons.dbcp.DriverManagerConnectionFactory(url, user, password);
	
	// Create the connection pool
	var poolableConnectionFactory = new org.apache.commons.dbcp.PoolableConnectionFactory(connectionFactory, connectionPool, null, null, false, true);
	
	// Setup the DBCP driver
	java.lang.Class.forName("org.apache.commons.dbcp.PoolingDriver");
	var driver = java.sql.DriverManager.getDriver("jdbc:apache:commons:dbcp:");

	// Register the database with the default name
	driver.registerPool(dbName, connectionPool);
};

/**
 * <p>
 * Execute a query using a <code>PreparedStatement</code>. The arguments will
 * be set into the statement before running it. Any type of query can be run
 * with this: select, insert, update, create table, etc.
 * </p>
 * 
 * <p>
 * If a <code>select</code> query, it will return an array with all data
 * retrieved. Otherwise, the number of records that were updated.
 * </p>
 * 
 * @param sql
 *            {String} The query to be run. Parameters to be set must be
 *            replaced by question marks without quotes, even when dealing with
 *            strings. Example:
 *            <code>SELECT * FROM PERSON WHERE NAME LIKE ?</code>
 * @param args
 *            {Array|Object} If an array, it will use each stored object as a
 *            parameter (object at position zero, will be set as parameter 1).
 *            If any other type, it will be set directly as the unique
 *            parameter.
 * @returns An array with the data retrieved if <code>sql</code> is a
 *          <code>SELECT</code> statement. An integer representing the update
 *          count otherwise.
 */
database.Database.prototype.execute = function (sql, args) {
	var conn = null;
	database.logger.debug("Executing SQL: " + sql + ", with parameters: " + JSON.encode(args));
	try {
		conn = this.getConnection();
		var ps = conn.prepareStatement(sql);

		if (args != null && args.length > 0) {
			// Parameters metadata
			var pMd = ps.getParameterMetaData();
	
			// Set parameters
			switch ($type(args)) {
				case 'array': 
					// if an array, use numbered parameters
					for (var i = 0; i < args.length; i++) {
						database.ps.setParameter(ps, pMd.getParameterType(i + 1), i + 1, args[i]);
					}
					break;
				
				default:
					// Otherwise set it as parameter
					database.ps.setParameter(ps, pMd.getParameterType(1), 1, args);
			}
		}
		
		var isQuery = ps.execute();
		if (isQuery) {
			return database.rs.toArray(ps.getResultSet(), null, -1);
		} else {
			return ps.getUpdateCount();
		}
	} finally {
		database.close(conn);
	}
};

/**
 * Retrieve a database connection to this database. The connection will be
 * retrieved from the pool.
 * 
 * @return {java.sql.Connection} A connection to the database.
 */
database.Database.prototype.getConnection = function () {
	return java.sql.DriverManager.getConnection('jdbc:apache:commons:dbcp:' + this.dbName);
};

// Try to load default database from application properties
(function () {
	// Connection factory will register itself as a JDBC driver
	var user = APP_PROPS['database.user'];
	var password = APP_PROPS['database.password'];
	var url = APP_PROPS['database.url'];
	var driver = APP_PROPS['database.driver'];
	
	if (user && password && url && driver) {
		database.addDatabase('main', driver, url, user, password);
		
		// Copy main database to database object
		for (var n in database.main) {
			database[n] = database.main[n];
		}
	}
})();
