var page = html.html();

page.append(html.body(
		html.p('This is a pen.')
));

var ul = html.ul();
page.append(ul);

var rs = new database.Select('message').execute();
for (var i = 0; i < rs.length; i++) {
	ul.append(html.li(JSON.encode(rs[i])));
}

Response.sendHTML(request, response, page);