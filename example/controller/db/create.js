var chat = ChatDB.create(params.name);

Response.sendJSON(request, response, chat);