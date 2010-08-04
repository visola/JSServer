var messages = Chat.getMessages(params.chatId, params.after);

Response.sendJSON(request, response, messages);