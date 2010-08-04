/*
 * Tables to be used
 * create table CHAT ( 
 * 		ID BIGINT PRIMARY KEY,
 * 		NAME VARCHAR(100) NOT NULL,
 * 		CREATED BIGINT
 * );
 * 
 * create table PERSON (
 * 		ID BIGINT PRIMARY KEY,
 * 		NAME VARCHAR(255) NOT NULL
 * );
 * 
 * create table PERSON_CHAT (
 * 		CHAT_ID BIGINT,
 * 		PERSON_ID BIGINT
 * );
 * 
 * create table MESSAGE (
 * 		ID BIGINT PRIMARY KEY,
 * 		CHAT_ID BIGINT,
 * 		PERSON_ID BIGINT,
 * 		TEXT VARCHAR(1000),
 *		CREATED BIGINT
 * ); 
 */
var Chat = (function () {
	var chats = [];
	
	var createMessage = function (person, message) {
		var msgObj = {
				personId : person.id,
				person : person.name,
				text : message,
				created : java.lang.System.currentTimeMillis()
			};
		
		database.insert('message', msgObj);
		
		return msgObj; 
	};
	
	var getChat = function (id) {
		for (var i = 0; i < chats.length; i++) {
			if (chats[i].id == id) return chats[i];
		}
		return null;
	};
	
	var getPerson = function (chat, id) {
		for (var i = 0; i < chat.people.length; i++) {
			if (chat.people[i].id == id) return chat.people[i];
		}
		return null;
	};
	
	return {
		addPerson : function (chatId, name) {
			var c = getChat(chatId);
			if (c == null) throw new Error('Chat not found: ' + chatId);
			
			var p = {
				id : java.lang.System.nanoTime(),
				name : name
			};
			
			c.people.push(p);
			
			return p;
		},
		
		create : function (name) {
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
			return chats;
		},
		
		getMessages : function (chatId, after) {
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			if (!after) after = 0;
			
			var messages = [];
			for (var i = 0 ; i < chat.messages.length; i++) {
				var message = chat.messages[i];
				if (message.time > after) messages.push(message);
			}
			return messages;
		},
		
		leaveChat : function (chatId, personId) {
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			for (var i = 0; i < chat.people.length; i++) {
				if (chat.people[i].id == personId) {
					chat.people.splice(i, 1);
					break;
				}
			}
		},
		
		sendMessage : function (chatId, personId, message) {
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