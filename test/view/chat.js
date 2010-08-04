var page = html.html();

page.append(html.head(
		html.title("Chat Application"),
		html.script({src : 'script/lib/mootools.js'}),
		html.script({src : 'script/chat/main.js'}),
		html.link({href : 'style/chat/main.css', rel : 'stylesheet', type : 'text/css'})
));

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