var msgObj = {
	id : java.lang.System.nanoTime(),
	personId : java.lang.System.nanoTime(),
	chatId : java.lang.System.nanoTime(),
	text : 'This is a text.',
	created : java.lang.System.currentTimeMillis()
};

new database.Insert('message', {
	data : msgObj
}).execute();
