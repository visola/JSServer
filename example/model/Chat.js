var Chat = (function () {
	var logger = org.slf4j.LoggerFactory.getLogger('chat'); 
	var chats = [];
	
	var createMessage = function (person, message) {
		logger.debug('Creating message: ' + JSON.encode(message) + ' from ' + JSON.encode(person));
		var msgObj = {
				personId : person.id,
				person : person.name,
				text : message,
				created : java.lang.System.currentTimeMillis()
			};
		
		return msgObj; 
	};
	
	var getChat = function (id) {
		logger.debug('Searching chat with ID: ' + id);
		for (var i = 0; i < chats.length; i++) {
			if (chats[i].id == id) return chats[i];
		}
		return null;
	};
	
	var getPerson = function (chat, id) {
		logger.debug('Searching person with ID: ' + id + ' in chat: ' + chat.name);
		for (var i = 0; i < chat.people.length; i++) {
			if (chat.people[i].id == id) return chat.people[i];
		}
		return null;
	};
	
	return {
		addPerson : function (chatId, name) {
			logger.debug('Adding person: ' + name + ' to chat: ' + chatId);
			var c = getChat(chatId);
			if (c == null) throw new Error('Chat not found: ' + chatId);
			
			var p = {
				id : java.lang.System.nanoTime(),
				name : name
			};
			
			c.people.push(p);
			
			this.sendMessage(chatId, p.id, name + ' joined chat.');
			
			return p;
		},
		
		create : function (name) {
			logger.debug('Creating chat room: ' + name);
			var c = {
				id : java.lang.System.nanoTime(),
				name: name,
				created : java.lang.System.currentTimeMillis(),
				people : [],
				messages : []
			};
			chats.push(c);
			return c;
		},
		
		getAll : function () {
			logger.debug('Retrieving all chat rooms.');
			return chats;
		},
		
		getMessages : function (chatId, after) {
			logger.debug('Retrieving messages after ' + after + ' for chat ' + chatId);
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			if (!after) after = 0;
			
			var messages = [];
			for (var i = 0 ; i < chat.messages.length; i++) {
				var message = chat.messages[i];
				if (message.created > after) messages.push(message);
			}
			return messages;
		},
		
		leaveChat : function (chatId, personId) {
			logger.debug(personId + ' is leaving chat: ' + chatId);
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			for (var i = 0; i < chat.people.length; i++) {
				if (chat.people[i].id == personId) {
					chat.people.splice(i, 1);
					break;
				}
			}
			
			this.sendMessage(chatId, personId, name + ' left chat.');
		},
		
		sendMessage : function (chatId, personId, message) {
			logger.debug(personId + ' sent message "' + message + '" into chat: ' + chatId); 
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			var person = getPerson(chat, personId);
			if (person == null) throw new Error('Person not in chat: ' + personId);
			
			var message = createMessage(person, message);
			chat.messages.push(message);
			
			return message;
		}
	}
})();