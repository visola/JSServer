var person = ChatDB.addPerson(params.chatId, params.name);

Response.sendJSON(request, response, person);