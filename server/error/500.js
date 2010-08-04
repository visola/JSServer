/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

var page = html.html();

// Header
var h = html.head();
h.append(html.title('500 - Internal Server Error'));

// Body
var b = html.body();

// Message box
var mBox = html.fieldset(
	html.legend('500 - Internal Server Error'),
	html.p(message)
);

b.append(mBox);

page.append(h);
page.append(b);

Response.sendHTML(request, response, page);