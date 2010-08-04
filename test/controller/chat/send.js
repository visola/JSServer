var message = Chat.sendMessage(params.chatId, params.personId, params.message);

Response.sendJSON(request, response, message);