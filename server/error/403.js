/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */

var result = html.html();

// Header
var h = html.head();
h.append(html.title('403 - Forbidden'));

// Body
var b = html.body();
b.append(html.p(message));

result.append(h);
result.append(b);

Response.sendHTML(request, response, result);