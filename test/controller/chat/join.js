var person = Chat.addPerson(params.chatId, params.name);

Response.sendJSON(request, response, person);