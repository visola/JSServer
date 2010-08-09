var page = html.html();

var head = html.head(html.title('Test Suit'));
page.append(head);

head.append(html.style(
	'.passed { background : RGB(220, 255, 220); }',
	' ',
	'.failed { background : red; }'	
));

var body = html.body();
page.append(body);

body.append(html.h1('Test Result'));

var r = test.result();

body.append(html.p(
	'Tests run: ' + r.total,
	html.br(),
	'Tests passed: ' + r.passed,
	html.br(),
	'Percentage: ' + r.percentage + '%'
));

body.append(html.h1('Detailed results:'));

var resultList = html.ol();
body.append(resultList);

for (var i = 0; i < test.tests.length; i++) {
	var t = test.tests[i];
	
	var li = html.li();
	resultList.append(li);
	
	li.append(t.name);
	
	var failedList = null;
	
	// Count assertions
	var total = t.assertions.length;
	var passed = 0;
	for (var j = 0; j < total; j++) {
		if (t.assertions[j].passed) {
			passed++;
		} else {
			if (failedList == null) {
				failedList = html.ol();
			}
			var errorItem = html.li();
			failedList.append(errorItem)
			
			errorItem.append("'" + t.assertions[j].message + "', ");
			var stack = t.assertions[j].stack;
			errorItem.append("failed at:");
			errorItem.append(html.br());
			
			for (var k = 0; k < stack.length; k++) {
				errorItem.append(stack[k].fileName + ' (' + stack[k].lineNumber + ')#' + stack[k].methodName);
				errorItem.append(html.br());
			}
		}
	}
	
	li.append(' Passed: ' + passed + ' Total: ' + total + ' ');
	
	if (passed == total) {
		li.attr('class', 'passed');
		li.append('Passed!');
	} else {
		li.attr('class', 'failed');
	}
	
	if (failedList != null) {
		li.append(failedList);
	}
}

Response.sendHTML(request, response, page);