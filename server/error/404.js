/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

var result = html.html();

// Header
var h = html.head();
h.append(html.title('404 - Request Not Found'));

// Body
var b = html.body();

// Message box
var mBox = html.fieldset(
	html.legend('404 - Request not found.'),
	html.p(
		"Sorry, the page you've requested does not exist.",
		html.br(),
		message)
);

b.append(mBox);

result.append(h);
result.append(b);

Response.sendHTML(request, response, result);