/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

/*****************************************************
 * HTML Builder                                       *
 * Based on Jaml from:                                *
 * http://github.com/edspencer/jaml                   *
 *****************************************************/
logger.info('Creating html builder...');

var html = {};

/**
 * The Node class is used to create each instance of an
 * HTML node that can be rendered to generate the resulting
 * page.
 *
 * @param tag {String}	The tag that will be created: 'html', 'body', etc.
 */
html.Node = function (tag) {
	this.tag = tag;
	this.parent = null;
	this.attributes = [];
	this.children = [];
	this.data = {};
};

/**
 * Add an attribute to the node instance.
 * 
 * @param name {String}	The name of the attribute.
 * @param value {String}	The value of the attribute.
 * @return {Node}	The node instance.
 */
html.Node.prototype.attr = function (name, value) {
	this.attributes.push({
		name : name,
		value : value
	});
	return this;
};

/**
 * Append a child node or text to this node.
 *
 * @param child {String|Node}	The child to add.
 * @return {Node}	The node instance.
 */
html.Node.prototype.append = function (child) {
	if (child == null) return this;
	if (child instanceof html.Node) child.parent = this;
	this.children.push(child);
	return this;
};

/**
 * Put some data into this node. Data is used to render
 * the node, replacing mathing "${}" with variable names
 * or its children. Example:
 *
 * <pre>
 * var p = html.p('${p.firstName} ${p.lastName}');
 * var data = {firstName : 'John', lastName : 'Doe'};
 * p.put('p', data);
 * var result = p.render(); // -> result = &lt;p&gt;John Doe&lt;/p&gt;
 * </pre>
 * 
 * @param name {String}	The name of the property as it will be referenced.
 * @param data {String|Object}	The object or string that will represent the
 *								value.
 * @return {Node}	The node instance.
 */
html.Node.prototype.put = function (name, data) {
	if (typeof name != 'string') throw new Error('Name must be a string: ' + JSON.encode(name));
	this.data[name] = data;
	return this;
};

/**
 * Return the value for a specified data path. Example:
 *
 * <pre>
 * var p = html.p('${p.firstName} ${p.lastName}');
 * var data = {name : 'John Doe'};
 * p.put('p', data);
 * var name = p.getDataValue('p.name'); // -> name = 'John Doe'
 * </pre>
 *
 * This is a recursive function and will search for data 
 * inside parent nodes, if not found inside this one.
 *
 * @param pathToProperty {String}	Path to the data wanted.
 * @return {anything}	The data found. Anything can be stored inside a 
 *						node, including: objects, functions, numbers, etc.
 */
html.Node.prototype.getDataValue = function (pathToProperty) {
	var result = null;
	
	var indexOf = pathToProperty.indexOf(".");
	var propName = pathToProperty.substring(0, indexOf);
	
	var obj = this.data[propName];
	
	// If not here, try parent
	if (obj == null) {
		if (this.parent != null) {
			result = this.parent.getDataValue(pathToProperty);
		}
		
	// If found here, than process it
	} else {
		// If string, return it
		if (typeof obj == 'string') {
			result = obj;
		} else {
			result = JSON.getValue(obj, pathToProperty.substring(propName.length + 1));
		}
	}
	
	return result;
};

html.Node.prototype.render = function () {
	var result = '<' + this.tag;
	for (var i = 0; i < this.attributes.length; i++) {
		result += ' ' + this.attributes[i].name + '="' + this.attributes[i].value + '"';
	}
	
	if (this.children.length == 0 && !['script', 'textarea', 'ul'].contains(this.tag)) {
		result += ' />';
	} else {
		result += '>';
	
		for (var i = 0; i < this.children.length; i++) {
			var child = this.children[i];
			if (child instanceof html.Node) {
				result += child.render();
			} else if (typeof child == 'string') {
				var node = this;
				result += child.replace((/\\?\$\{([^{}]+)\}/g), function(match, name){
					var data = node.getDataValue(name);
					
					if ($type(data) == 'function') return data();
					if ($type(data) == 'object') return JSON.encode(data);
					if ($type(data) == 'number') return data + '';
					
					return (data ? data : '');
				});
			} else {
				result += child + '';
			}
		}
		result += '</' + this.tag + '>';
	}
	
	return result;
};

html.Node.prototype.css = function (url) {
	var stylesheet = html.link({
		type : 'text/css',
		rel : 'stylesheet'
	});
	
	stylesheet.attr('href', url);
	this.append(stylesheet);
};

html.Node.prototype.script = function (url) {
	var script = html.script({
		type : 'text/javascript'
	});
	
	script.attr('src', url);
	this.append(script);
};

html.tags = [
	"html", "head", "body", "script", "meta", "title", "link", "style",
	"div", "p", "span", "a", "img", "br", "hr",
	"table", "tr", "th", "td", "thead", "tbody",
	"ul", "ol", "li",
	"dl", "dt", "dd",
	"h1", "h2", "h3", "h4", "h5", "h6", "h7",
	"form", "input", "label", "textarea",
	"fieldset", "legend"
];

html.tags.each(function (tagName) {
	logger.debug('Creating tag: ' + tagName);
	html[tagName] = function () {
		var node = new html.Node(tagName);
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i] instanceof html.Node) {
				node.append(arguments[i]);
			} else if (typeof arguments[i] == 'object') {
				for (var n in arguments[i]) {
					node.attr((n == 'cls' ? 'class' : n), arguments[i][n]);
				}
			} else {
				node.append(arguments[i]);
			}
		}
		
		return node;
	};
});

logger.info('HtmlBuilder ready.');
 

 /*****************************************************
 * End of HTML Builder                                *
 *****************************************************/