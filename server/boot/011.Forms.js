/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

var form = {};

form.input = function (parent, label, attributes) {
	var label = html.label(label);
	if (attributes.name) label.attr('for', attributes.name);
	else if (attributes.id) label.attr('for', attributes.id);
	parent.append(label);
	
	var input = html.input(attributes);
	parent.append(input);
	return parent;
};

form.text = function (parent, label, attributes) {
	if (!attributes.type) attributes.type = 'text';
	return form.input(parent, label, attributes);
};