var page = html.html();

var head = html.head(html.title("Chat Application"));
head.script('script/lib/mootools.js');
head.append(html.script('var context = "db"'));
head.script('script/main.js');
head.css('style/main.css');

page.append(head);

page.append(html.body(
		html.div(
			{id : 'chatList'},
			html.input({type : 'button', value : 'Create', id : 'createChat'}),
			html.input({type : 'button', value : 'Join', id : 'joinChat'}),
			html.input({type : 'button', value : 'Leave', id : 'leaveChat'}),
			html.ul()
		),
		html.div(
			{id : 'chat'},
			html.ul(),
			html.form(
				{id : 'messageForm'},
				html.input({type : 'text', id : 'message'}),
				html.input({type : 'button', value : 'Send', id : 'sendMessage'})
			)
		)
));

response.writer.print(page.render());