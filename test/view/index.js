var page = html.html();

page.append(html.head(html.title('Test Suit')));

var b = html.body();
page.append(b);

b.append(html.h1('Test Result'));

var r = test.result();
logger.debug(JSON.encode(r));

b.append(html.p(
	'Tests run: ' + r.total,
	html.br(),
	'Tests passed: ' + r.passed,
	html.br(),
	'Percentage: ' + r.percentage + '%'
));

Response.sendHTML(request, response, page);