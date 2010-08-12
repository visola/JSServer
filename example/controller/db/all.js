var allChats = ChatDB.getAll();

var chatRooms = [];
for (var i = 0; i < allChats.length; i++) {
	chatRooms.push({
		id : allChats[i].id,
		name : allChats[i].name
	});
}

Response.sendJSON(request, response, chatRooms);