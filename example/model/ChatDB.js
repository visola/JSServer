/*
 * create table CHAT ( 
 * 		ID BIGINT PRIMARY KEY,
 * 		NAME VARCHAR(100) NOT NULL,
 * 		CREATED BIGINT
 * );
 * 
 * create table PERSON (
 * 		ID BIGINT PRIMARY KEY,
 * 		CHAT_ID BIGINT,
 * 		NAME VARCHAR(255) NOT NULL
 * );
 * 
 * create table MESSAGE (
 * 		ID BIGINT PRIMARY KEY,
 * 		PERSON_ID BIGINT,
 * 		CHAT_ID BIGINT,
 * 		TEXT VARCHAR(1000),
 *		CREATED BIGINT
 * ); 
 */

var ChatDB = (function () {
	var logger = org.slf4j.LoggerFactory.getLogger('chat_db');
	
	var TABLE_CHAT = 'CHAT';
	var TABLE_PERSON = 'PERSON';
	var TABLE_MESSAGE = 'MESSAGE';
	
	var createMessage = function (person, message) {
		logger.debug('Creating message: ' + JSON.encode(message) + ' from ' + JSON.encode(person));
		var msgObj = {
				id : java.lang.System.nanoTime(),
				personId : person.id,
				chatId : person.chatId,
				text : message,
				created : java.lang.System.currentTimeMillis()
			};
		
		if (new database.Insert(TABLE_MESSAGE, {data : msgObj}).execute() == 1) return msgObj;
		
		return null;
	};
	
	var getChat = function (id) {
		logger.debug('Searching chat with ID: ' + id);
		
		var r = new database.Select(TABLE_CHAT).addData({id : id}).execute();
		if (r.length > 0) return r[0];
		
		return null;
	};
	
	var getPerson = function (chat, id) {
		logger.debug('Searching person with ID: ' + id + ' in chat: ' + chat.name);
		
		var r = new database.Select(TABLE_PERSON).addData({id : id, chatId : chat.id}).execute();
		if (r.length > 0) return r[0];
		
		return null;
	};
	
	return {
		addPerson : function (chatId, name) {
			logger.debug('Adding person: ' + name + ' to chat: ' + chatId);
			var c = getChat(chatId);
			if (c == null) throw new Error('Chat not found: ' + chatId);
			
			var p = {
				id : java.lang.System.nanoTime(),
				chatId : chatId,
				name : name
			};
			
			new database.Insert(TABLE_PERSON).addData(p).execute();
			
			// Add a message to the chat to warn everybody
			this.sendMessage(chatId, p.id, name + ' joined chat.');
			return p;
		},
		
		create : function (name) {
			logger.debug('Creating chat room: ' + name);
			
			var c = {
				id : java.lang.System.nanoTime(),
				name: name,
				created : java.lang.System.currentTimeMillis()
			};
			
			new database.Insert(TABLE_CHAT).addData(c).execute();
			
			return c;
		},
		
		getAll : function () {
			logger.debug('Retrieving all chat rooms.');
			return new database.Select(TABLE_CHAT).execute();
		},
		
		getMessages : function (chatId, after) {
			logger.debug('Retrieving messages after ' + after + ' for chat ' + chatId);
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			if (!after) after = 0;
			
			var q = 'SELECT CREATED, TEXT, PERSON_ID, NAME AS PERSON';
			q += ' FROM ';
			q += TABLE_PERSON + ' AS P';
			q += ' JOIN ';
			q += TABLE_MESSAGE + ' AS M';
			q += ' ON P.ID = M.PERSON_ID'
			q += ' WHERE P.CHAT_ID = ? AND CREATED > ?';
			
			return database.execute(q, [chatId, after]); 
		},
		
		leaveChat : function (chatId, personId) {
			logger.debug(personId + ' is leaving chat: ' + chatId);
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			var person = getPerson(chat, personId);
			
			this.sendMessage(chatId, personId, person.name + ' left chat.');
			
			new database.Delete(TABLE_PERSON)
				.addData({chatId : chatId, id : personId})
				.execute();
			
			// Check if there is someone in the chat room
			var r = new database.Select(TABLE_PERSON).addData({chatId:chatId}).execute();
			logger.debug('People left in chat: ' + r.length);
			if (r.length == 0) {
				logger.debug('No one else in the room. Deleting messages.');
				
				// If no one else in the room, delete all messages
				new database.Delete(TABLE_MESSAGE).addData({chatId:chatId}).execute();
			}
		},
		
		sendMessage : function (chatId, personId, message) {
			logger.debug(personId + ' sent message "' + message + '" into chat: ' + chatId); 
			var chat = getChat(chatId);
			if (chat == null) throw new Error('Chat not found: ' + chatId);
			
			var person = getPerson(chat, personId);
			if (person == null) throw new Error('Person not in chat: ' + personId);
			
			return createMessage(person, message);
		}
	}
})();