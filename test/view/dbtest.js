var page = html.html();

page.append(html.body(
		html.p('This is a pen.')
));

Response.sendHTML(request, response, page);