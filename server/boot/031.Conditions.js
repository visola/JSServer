/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

/**
 * <p>
 * <code>Condition</code>s can be added to Query objects to restrict the
 * results using a <code>WHERE</code> clause. The options accepted by this
 * class are:
 * </p>
 * 
 * <ul>
 * <li>operator - (Required) The operator to be used for this condition.
 * Defaults to <code>=</code>.</li>
 * <li>field - (Required) The field that will be used to restrict the query.</li>
 * <li>value - (Required) The value expected in the field.</li>
 * </ul>
 * 
 * <p>
 * A condition can also be built passing two or three arguments.
 * </p>
 * 
 * @param optionOrField
 *            {Object|String} If only one argument is provided, it will be
 *            assumed as being the options for this condition. If more than one
 *            argument is provided the first argument is assumed to be the
 *            field.
 * @param value
 *            {String} (Optional) If more than one argument is provided the
 *            second argument is assumed to be the value.
 * @param operator
 *            {String} (Optional) If more than two arguments are provided, the
 *            third will be assumed as the operator.
 */
database.Condition = new Class({
	Implements : Options,
	options : {
		operator : '='
	},
	initialize : function () {
		var options = {};
		switch (arguments.length) {
			// If one argument, must be the options
			case 1:
				options = arguments[0];
				break;
			
			/* Two or Three arguments:
			 * 0 - Field
			 * 1 - Value
			 * 2 - Operator
			 */
			case 3:
				options.operator = arguments[2];
			case 2:
				options.field = arguments[0];
				options.value = arguments[1];
				break;
		}
		
		this.setOptions(options);
	}
});

/**
 * Return an array containing all values for this <code>Condition</code>.
 * When the condition is built, values are set as placeholders to be set using a
 * <code>java.sql.PreparedStatement</code>. This method should return the
 * values in the same position as their placeholders.
 * 
 * @return {Array} The values to be set in the <code>PreparedStatement</code>.
 *         This will throw an error if value is not set.
 * @see database#Condition#prototype#validate
 */
database.Condition.prototype.getValues = function () {
	this.validate();
	return [this.options.value];
}

/**
 * Validate if this condition has all three elements necessary: field, value and
 * operator. If one of them is missing, then an error will be thrown.
 * 
 * @return {database.Condition} The condition where this method was called.
 */
database.Condition.prototype.validate = function () {
	if (this.options.field === null || this.options.field === undefined) {
		throw new Error('Field not set.');
	}
	if (this.options.value === null || this.options.value === undefined) {
		throw new Error('Value not set.');
	}
	if (this.options.operator === null || this.options.operator === undefined) {
		throw new Error('Operator not set.');
	}
	return this;
}

/**
 * Build this condition using the configured field, value and operator.
 * 
 * @return {String} The condition built.
 */
database.Condition.prototype.build = function () {
	this.validate();
	var r = this.options.field;
	r += ' ';
	r += this.options.operator;
	r += ' ?';
	return r;
}

database.Condition.Equals = new Class({
	Extends : database.Condition,
});

database.Condition.Greater = new Class({
	Extends : database.Condition,
	options : {
		operator : '>'
	}
});

database.Condition.Less = new Class({
	Extends : database.Condition,
	options : {
		operator : '<'
	}
});

database.Condition.GreaterOrEquals = new Class({
	Extends : database.Condition,
	options : {
		operator : '>='
	}
});

database.Condition.LessOrEquals = new Class({
	Extends : database.Condition,
	options : {
		operator : '>='
	}
});

database.Condition.Between = new Class({
	Extends : database.Condition,
	options : {
		operator : 'BETWEEN'
	},
	initialize : function () {
		// If three arguments, the third will be considered the second value
		if (arguments.length == 3) {
			this.options.field = arguments[0];
			this.options.value = arguments[1];
			this.options.value2 = arguments[2];
		} else {
			// Call parent constructor
			this.parent.apply(this, arguments);
		}
	}
});

database.Condition.Between.prototype.validate = function () {
	if (this.options.field === null || this.options.field === undefined) {
		throw new Error('Field not set.');
	}
	if (this.options.value === null || this.options.value === undefined) {
		throw new Error('Value not set.');
	}
	if (this.options.value2 === null || this.options.value2 === undefined) {
		throw new Error('Second value not set.');
	}
	return this;
}

database.Condition.Between.prototype.build = function () {
	this.validate();
	var r = this.options.field;
	r += ' BETWEEN ? AND ?';
	return r;
};

database.Condition.Between.prototype.getValues = function () {
	this.validate();
	return [this.options.value, this.options.value2];
}

/**
 * <p>
 * Concatenate two or more conditions using the <code>OR</code> logical
 * operator.
 * </p>
 * 
 * <p>
 * If one parameter is passed in the constructor, it will be assumed as options.
 * If more than one parameters are passed in, they will be added as Conditions
 * using the addCondition method.
 * </p>
 * 
 * <ul>Options supported:
 * <li>conditions - (Optional) the conditions to concatenate</li>
 * </ul>
 */
database.Condition.Or = new Class({
	Implements : Options,
	options : {
		conditions : []
	},
	initialize : function () {
		switch (arguments.length) {
			case 0:
				break;
			case 1:
				this.setOptions(arguments[0]);
				break;
			default:
				for (var i = 0; i < arguments.length; i++) {
					this.addCondition(arguments[i]);
				}
				break;
		}
	}
});

/**
 * Concatenate all conditions into one expression using the <code>OR</code>
 * operator.
 * 
 * @return {String}	The generated condition.
 */
database.Condition.Or.prototype.build = function () {
	var r = '(';
	for (var i = 0; i < this.options.conditions.length; i++) {
		r += this.options.conditions.build();
		if (i != this.options.conditions.length - 1) r += ' OR ';
	}
	return r + ')';
}

/**
 * Add a condition to be concatenated.
 * 
 * @param conditions
 *            {database.Condition} The condition to be added.
 * @return {database.Condition} This.
 */
database.Condition.Or.prototype.addCondition = function (condition) {
	this.options.conditions.push(condition);
	return this;
};