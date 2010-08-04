(function () {
	var chats = [];
	var chatId = 0;
	var joinedChatId = 0;
	var personId = 0;
	var lastChecked = 0;
	var timerId = -1;
	
	var MIN_INTERVAL = 1000;
	var MAX_INTERVAL = 10000;
	var INCREMENT = 1000;
	var checkInterval = MIN_INTERVAL;
	
	function createChatRoom() {
		var name = prompt("Choose a name:");
		if (!name) return;
		var req = new Request({
			url : 'chat/create.do',
			data : {name : name},
			onSuccess : function (responseText) {
				var resp = eval('(' + responseText + ')');
				if (resp.id) {
					loadChatList();
				}
			}
		}).send(null);
	};
	
	function joinChat() {
		if (chatId == 0) {
			alert('Select chat to join.');
			return;
		}
		
		var name = prompt('What name you want to use?');
		if (!name) return;
		
		var req = new Request({
			url : 'chat/join.do',
			method : 'post',
			data : {chatId : chatId, name : name},
			onSuccess : function (responseText) {
				var resp = eval('(' + responseText + ')');
				if (resp.id) {
					joinedChatId = chatId;
					personId = resp.id;
					loadChatList();
					loadMessages();
					$('chat').setStyle('display', 'block');
					$$('#chatList ul')[0].empty();
				}
			}
		}).send();
	};
	
	function leaveChat () {
		if (joinedChatId == 0 || personId == 0) return;
		new Request({
			url : 'chat/leave.do',
			data : {chatId : chatId, personId : personId},
			onSuccess : function () {
				joinedChatId = 0;
				personId = 0;
				lastChecked = 0;
				$('chat').setStyle('display', 'none').getElement('ul').empty();
				refreshChatList();
			}
		}).send();
	};
	
	function loadChatList() {
		chats = [];
		new Request({
			url : 'chat/all.do',
			onSuccess: function (response) {
				var result = eval('(' + response + ')');
				if (result.length) {
					chats = result;
				}
				refreshChatList();
			}
		}).send();
	};
	
	function loadMessages() {
		new Request({
			url : 'chat/messages.do',
			data : {chatId : chatId, after : lastChecked},
			onSuccess : function (response) {
				var result = eval('(' + response + ')');
				if (result.length) {
					var msgList = $$('#chat ul');
					for (var i = 0; i < result.length; i++) {
						var msgEl = new Element('li',{
							id : result[i].time,
							html : '<span>' + result[i].person + '</span> ' + result[i].text
						});
						if (result[i].personId == personId) {
							msgEl.addClass('me');
						}
						msgList.grab(msgEl);
						lastChecked = result[i].time;
					}
					checkInterval = MIN_INTERVAL;
				} else {
					if (checkInterval < MAX_INTERVAL) {
						checkInterval+= INCREMENT;
					}
				}
				clearTimeout(timerId);
				timerId = setTimeout(loadMessages, checkInterval);
			}
		}).send();
	};
	
	function refreshChatList() {
		var chatList = $$('#chatList ul')[0];
		chatList.empty();
		for (var i = 0; i < chats.length; i++) {
			var chatEl = new Element('li', {
				id : chats[i].id,
				html : chats[i].name
			});
			chatEl.addEvent('click', function () {
				chatList.getChildren().each(function (item) {
					item.removeClass('selected');
				});
				this.addClass('selected');
				chatId = this.get('id');
			});
			if (chats[i].id == joinedChatId) chatEl.addClass('joined');
			chatList.grab(chatEl);
		}
	};
	
	function sendMessage () {
		var messageTxt = $('message'); 
		var message = messageTxt.get('value');
		new Request({
			url : 'chat/send.do',
			data : {chatId : chatId, personId : personId, message : message},
			onSuccess : loadMessages
		}).send();
		messageTxt.set('value', '');
	};
	
	$(document).addEvent('domready', function () {
		loadChatList();
		window.addEvent('unload', leaveChat);
		$('chat').setStyle('display', 'none');
		$('createChat').addEvent('click', createChatRoom);
		$('joinChat').addEvent('click', joinChat);
		$('sendMessage').addEvent('click', sendMessage);
		$('leaveChat').addEvent('click', leaveChat);
		$('messageForm').addEvent('submit', function () {
			sendMessage();
			return false;
		});
	});
})();