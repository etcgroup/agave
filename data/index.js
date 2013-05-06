$(window).load(setup);
var user = null;
var previous_messages;

function setup() {
	$('#set_user').click(connect);
	$('#chat_user').keyup(launch);
	$('messages').scrollTop($('messages')[0].scrollHeight);
	previous_messages = $("message").length; 
	setInterval(refresh, 2000);
}

function launch(e) {
	if(e.keyCode == 13 && user == null) {
		connect();
		return false;
	}
}

function connect() {
	user = $('#chat_user').val();
	$('userinfo').slideUp();
	$('messageinput').slideDown();
	$('chattitle').text('Now chatting as \'' + user + '\'');
	$('#set_user').unbind('click');
	$('#send_message').click(sendMessage);
	$('#chat_message').keyup(enterSend).focus();
	$('#chat_user').unbind('keyup');
}

function enterSend(e) {
	if(e.keyCode == 13 && !e.shiftKey) {
		e.stopPropagation();
		sendMessage();
		return true;
	}
}

function sendMessage() {
	var text = $('#chat_message').val().trim();
	if(text.length > 0) {
		$('#chat_message').val('');
		$.post('message.php', {type : "send", message : text, user : user}, updateMessages);
	}
}

function updateMessages(data) {
	$('messages').html(data);
	
	updateHeight();
	
}

function updateHeight() {

	$('messages').scrollTop($('messages')[0].scrollHeight);
}

function refresh() {
	$('messages').load('message.php', function() { 
	var current_messages =  $("message").length; 
	if(current_messages != previous_messages){

		previous_messages = current_messages;
		updateHeight();
	}
		 });
}
