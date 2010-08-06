/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * <p>
 * Abstract query object. The options that can be provided to this object are:
 * </p>
 * 
 * <ul>
 * <li>table (required) - name of the table to execute this query. May also be
 * provided separately, example:
 * <code>var q = new database.QueryImplementation('tableName', options);</code></li>
 * <li>database - the name of the database to be used to execute this query.
 * Default: 'main'</li>
 * <li>columns - can be used for queries that need to specify what data needs
 * to be selected, just like a Select statement. When the data is returned, it
 * will be returned as an array of objects and the properties that these objects
 * contain are the column names in the column array. If an alias is needed,
 * instead of a <code>String</code> the column array can also contain an
 * object with two properties: column and alias. For example:
 * <code>{column : 'COUNT(*)', alias : 'count'}</code>.</li>
 * <li>conditions - an array of conditions objects.</li>
 * <li>data - an object that will be used for parameterized queries like update
 * and insert statements. The pairs <code>property = value</code> from this
 * object will be used to create these kind of statements. For example:
 * <code>{id : 10, name : 'John Doe'}</code> would create the following insert
 * statement: <code>INSERT INTO table (id, name) VALUES (?,?)</code> and the
 * question marks would be replaced by the <code>10</code> and
 * <code>John Doe</code> respectively.</li>
 * </ul>
 */
database.Query = new Class({
	Implements : Options,
	options : {
		columns : [],
		conditions : [],
		data : {},
		database : 'main',
		table : null
	},
	initialize : function () {
		var options = {};
		switch (arguments.length) {
			// If one argument, it can be options or a table name
			case 1:
				switch ($type(arguments[0])) {
					case 'string':
						options.table = arguments[0];
						break;
					default:
						options = arguments[0];
						break;
				}
				break;
				
			// If two arguments, the first will be the table name
			case 2:
				options = arguments[1];
				options.table = arguments[0];
				break;
		}
		
		this.setOptions(options);
		
		// Check for table
		if (! this.options.table ) {
			throw new Error('Query needs a table name.');
		}
	}
});

/**
 * Execute the query in the specified database.
 * 
 * @return {Number|Array} The number of records updated or an array containing
 *         the selected records.
 */
database.Query.prototype.execute = function () {
	return database[this.options.database].execute(this.build(), this.getValues());
}

/**
 * Add a column to the list of columns.
 * 
 * @param column
 *            {String} Name of the column to add.
 * @return {database.Query} The query object.
 */
database.Query.prototype.addColumn = function (column) {
	if (!this.options.columns) this.options.columns = [];
	this.options.columns.push(column);
	return this;
}

/**
 * All queries must implement the build method. This method must return the SQL
 * code that represents the query. It will be passed to the execute method.
 * 
 * @return {String} SQL that represents this query.
 */
database.Query.prototype.build = function () {
	throw new Error('Build not implemented.');
}

/**
 * Create an array with all the values for the parameters that this query needs
 * to run.
 * 
 * @return {Array} An array with all parameters, or an empty array if none.
 */
database.Query.prototype.getValues = function () {
	var r = [];
	// Data values
	for (var n in this.options.data) {
		r.push(this.options.data[n]);
	}
	// Condition values
	if (this.options.conditions) {
		for (var i = 0; i < this.options.conditions.length; i++) {
			var v = this.options.conditions[i].getValues(); 
			for (var j = 0; j < v.length; j++) {
				r.push(v[j]);
			}
		}
	}
	return r;
}

/**
 * Add data to this query. If an array with the field names is provided, then
 * only the properties that match will be added to the query object.
 * 
 * @param obj
 *            {Object} (Required) An object that will be used to add field/value
 *            pairs to this query.
 * @param fields
 *            {Array} An array of <code>String</code>s that will be used to
 *            filter the properties that will be added to this query.
 * @return {database.Query} The query object.
 */
database.Query.prototype.addData = function (obj, fields) {
	if (!this.options.data) this.options.data = {};
	for (var n in obj) {
		if ($type(obj[n]) == 'function') continue;
		if (!fields || fields.contains(n)) {
			this.options.data[n] = obj[n];
		}
	}
	return this;
}

/**
 * Set the data that this query will use, it will replace all other data added
 * before. If an array with the field names is provided, then only the
 * properties that match will be added to the query object.
 * 
 * @param obj
 *            {Object} (Required) An object that will be used to add field/value
 *            pairs to this query.
 * @param fields
 *            {Array} An array of <code>String</code>s that will be used to
 *            filter the properties that will be added to this query.
 * @return {database.Query} The query object.
 */
database.Query.prototype.setData = function(data, fields) {
	this.options.data = {};
	return this.addData(data, fields);
}

/**
 * Add a condition that will be added to the <code>WHERE</code> clause of this
 * query.
 * 
 * @param condition {database.Condition}
 *            The condition to be added.
 * @return {database.Query} The query object.
 */
database.Query.prototype.addCondition = function (condition) {
	if (!this.options.conditions) this.options.conditions = [];
	this.options.conditions.push(condition);
	return this;
}

/**
 * Set the conditions that will be added to the <code>WHERE</code> clause of
 * this query.
 * 
 * @param conditions
 *            {Array} The conditions to set to.
 * @return {database.Query} The query object.
 */
database.Query.prototype.setConditions = function (conditions) {
	this.options.conditions = conditions;
}

/**
 * Check if this query has conditions to be added to a <code>WHERE</code>
 * clause.
 * 
 * @return {Boolean} True if this query has conditions and needs to build a
 *         <code>WHERE</code> clause.
 */
database.Query.prototype.hasConditions = function () {
	return this.options.conditions && this.options.conditions.length > 0;
}

/**
 * Build a <code>String</code> with all the conditions for this query.
 * 
 * @return {String} The conditions that can be added to the <code>WHERE</code>
 *         clause of this query.
 */
database.Query.prototype.buildConditions = function () {
	var q = '';
	
	if (this.options.conditions && this.options.conditions.length > 0) {
		for (var i = 0; i < this.options.conditions.length; i++) {
			q += i == 0 ? ' ' : ' AND ';
			q += this.options.conditions[i].build();
		}
	}
	return q;
}

/**
 * Insert query. This query builds an <code>INSERT</code> statement.
 */
database.Insert = new Class({
	Extends : database.Query,
	initialize : function () {
		this.parent.apply(this, arguments);
	},
	build : function () {
		// Create the fields and parameters from data object
		var fields = '(';
		var params = '(';
		var data = this.options.data;
		for (var n in data) {
			fields += n + ',';
			params += '?,';
		}
		
		// Remove trailing commas
		fields = fields.substring(fields.length - 1) + ')';
		params = params.substring(params.length - 1) + ')';
		
		var q = 'INSERT INTO ';
		q += this.options.table;
		q += ' ';
		q += fields;
		q += ' VALUES ';
		q += params;
		return q;
	}
});

/**
 * Select query. This query builds an <code>SELECT</code> statement.
 */
database.Select = new Class({
	Extends : database.Query,
	initialize : function () {
		this.parent.apply(this, arguments);
	},
	build : function () {
		var q = 'SELECT ';
		
		var columns = this.options.columns;
		
		// Set columns
		if (!columns || columns.length == 0) {
			q += ' * ';
		} else {
			for (var i = 0; i < columns.length; i++) {
				switch ($type(columns[i])) {
					// If an object, expect 
					case 'object':
						q += columns[i].column;
						q += ' AS ';
						q += columns[i].alias;
						break;
					case 'string':
						q += columns[i];
						break;
					default:
						throw new Error('Invalid column type: ' + $type(columns[i]) + ', Columns: ' + JSON.encode(columns));
				}
				if (i != columns.length - 1) q += ',';
			}
		}
		
		q += ' FROM ';
		q += this.options.table;
		
		if (this.hasConditions()) {
			q += ' WHERE ';
			q += this.buildConditions();
		}
		
		return q;
	}
});

/**
 * Update query. This query builds an <code>UPDATE</code> statement.
 */
database.Select = new Class({
	Extends : database.Query,
	initialize : function () {
		this.parent.apply(this, arguments);
	},
	build : function () {		
		var q = 'UPDATE ';
		q += this.options.table;
		q += ' SET ';
		
		if (!this.data) {
			throw new Error('No data set for the update query.');
		} 
			
		// Set data to be updated
		var counter = 0;
		for (var n in data) {
			counter ++;
			q += n;
			q += ' = ?,';
		}
		
		// Remove trailing commas
		q = q.substring(q.length - 1) + ' ';
		
		if (counter == 0) {
			throw new Error('No data set for the update query.');
		}
		
		if (this.hasConditions()) {
			q += ' WHERE ';
			q += this.buildConditions();
		}
		
		return q;
	}
});