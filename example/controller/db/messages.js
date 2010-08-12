var messages = ChatDB.getMessages(params.chatId, params.after);

Response.sendJSON(request, response, messages);