(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);


// ------cookie decode
function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var user = JSON.parse(getCookie('user'));
var sender_id = user._id;
let receiver_id;
var global_group_id;
var socket = io('/user-namespace', {
	auth: {
		token: user._id
	}
});


$(document).ready(function () {
	$('.user-list').click(function () {
		receiver_id = $(this).attr('data-id');



		$('.start-head').hide();
		$('.chat-section').show();

		socket.emit('loadOldChats', { sender_id: sender_id, receiver_id: receiver_id })
	})
})

socket.on('getOnlineUser', function (data) {
	$('#' + data.user_id + '-status').text('Online')
	$('#' + data.user_id + '-status').removeClass('offline-status')
	$('#' + data.user_id + '-status').addClass('online-status')
});
socket.on('getOfflineUser', function (data) {
	$('#' + data.user_id + '-status').text('Offline')
	$('#' + data.user_id + '-status').addClass('offline-status')
	$('#' + data.user_id + '-status').removeClass('online-status')
});

$('#chat-form').submit(function (event) {
	event.preventDefault();

	var message = $('#message').val();

	$.ajax({
		url: "/save-chat",
		type: "POST",

		data: JSON.stringify({
			sender_id: sender_id,
			receiver_id: receiver_id,
			message: message
		}),
		contentType: "application/json; charset=utf-8",
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				$('#message').val("");
				let chat = responseData.data.message;
				let html = `
              <div class="current-user-chat"  id = '`+ responseData.data._id + `'>
                <h5> `+ chat + ` 
                       <i class="fa fa-trash" aria-hidden="true" data-id = '`+ responseData.data._id + `' ></i>
                </h5> 
              </div>
            `;
				$('#chat-container').append(html);
				socket.emit('newChat', responseData.data);

				scrollChat();
			} else {
				alert(responseData.message)
			}
		},
		error: function (error) {
			console.log("AJAX error:", error);
		}
	});

})

socket.on('loadNewChat', function (data) {
	if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
		let html = `
              <div class="distance-user-chat" id= '`+ data._id + `'>
                <h5> `+ data.message + ` </h5> 
              </div>
            `;
		$('#chat-container').append(html);
		scrollChat();
	}
}); 
socket.on('loadChats', function (data) {

	$('#chat-container').html('');
	var chats = data.chats;
	let html = '';
	for (let x = 0; x < chats.length; x++) {
		let addClass = '';
		if (chats[x]['sender_id'] == sender_id) {
			addClass = 'current-user-chat';
		} else {
			addClass = 'distance-user-chat';
		}

		html += `
            <div class='`+ addClass + `' id= '` + chats[x]['_id'] + `'>
                <h5> `+ chats[x]['message'] + ``;
		if (chats[x]['sender_id'] == sender_id) {
			html += `   <i class="fa fa-trash" aria-hidden="true" data-id = '` + chats[x]['_id'] + `' ></i>`;
		}
		html += `
                    </h5> 
              </div>
            `;
	}

	$('#chat-container').append(html);
	scrollChat();
});
socket.on('deleteChatMessage', function (id) {
	$('#' + id).remove();
})
$(document).on('click', '.fa-trash', function (event) {
	event.preventDefault();

	var id = $(this).attr('data-id');

	$.ajax({
		url: "/delete-chat",
		type: "POST",

		data: {
			id: id
		},
		// contentType: "application/json; charset=utf-8" ,
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				$('#' + id).remove();
				socket.emit('chatDeleted', id);
			} else {
				alert(responseData.msg)
			}
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});

})
//scroll to last 
function scrollChat() {
	$('#chat-container').animate({
		scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
	}, 0);
}

$('.addMember').click( function (event) {
	var id = $(this).attr('data-id');
	var limit =  $(this).attr('data-limit');
	$('#group_id').val(id);
	$('#limit').val(limit);
	$.ajax({
		url: "/get-members",
		type: "POST",
		data: {
			group_id: id
		},
		// contentType: "application/json; charset=utf-8" ,
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				let users = responseData.data;
				console.log("USER _____________ ", users)
				let html = '';
				for(let i =0; i<users.length; i++){
					let isMemberofGroup = users[i]['member'].length>0? true:false;
					html+=`
					<tr>
					<td>
					<input type="checkbox" `+(isMemberofGroup?'checked':'')+` name="members[]" value="`+users[i]['_id']+`" />
					</td>
					   <td>`+ users[i]['name']+` </td>
					</tr>
					`;
				  }
				  $('.addMemberinTable').html(html);

			} else {
				alert(responseData.msg)
			}
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});

})

$('#add-member-form').submit( function (event) {
	event.preventDefault();
	var formData = $(this).serialize();

	$.ajax({
		url: "/add-members",
		type: "POST",
		data: formData,
		// contentType: "application/json; charset=utf-8" ,
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				
				  $('#memberModal').modal('hide');
				  $('#add-member-form')[0].reset();
				  alert(responseData.msg)

			} else {
				$('#add-member-error').text(responseData.msg);
				setTimeout(()=>{
					$('#add-member-error').text('');
				},3000);
			}
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});

})


$('.deleteGroup').click( function (event) {
	var id = $(this).attr('data-id');
	var name =  $(this).attr('data-name');
	console.log("-----------gp---", name, id);
	$('#delete_group_id').val(id);
	$('#delete_group_name').text(name);

})

$('#deleteChatGroupform').submit( function (event) {
	event.preventDefault();
	var formData = $(this).serialize();

	$.ajax({
		url: "/delete-chat-group",
		type: "POST",
		data: formData,
		// contentType: "application/json; charset=utf-8" ,
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				
				  location.reload();
				

			} 
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});

});
// group chatt

function scrollGroupChat() {
	$('#group-chat-container').animate({
		scrollTop: $('#group-chat-container').offset().top + $('#group-chat-container')[0].scrollHeight
	}, 0);
}
$('.group-list').click( function (event) {
	
	$('.group-start-head').hide();
	$('.group-chat-section').show();
    global_group_id = $(this).attr('data-id')
	loadGroupChats()
})


$('#group-chat-form').submit(function (event) {
	event.preventDefault();

	var message = $('#group-message').val();

	$.ajax({
		url: "/group-chat-save",
		type: "POST",

		data: JSON.stringify({
			sender_id: sender_id,
			group_id: global_group_id,
			message: message
		}),
		contentType: "application/json; charset=utf-8",
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				$('#group-message').val("");
				console.log('response data -----', responseData)
				let message = responseData.chat.message;
				let html = `
              <div class="current-user-chat"  id = '`+ responseData.chat._id + `'>
                <h5> 
				    <span>`+ message + ` </span>
                       
                </h5> 
              </div>
            `;
				$('#group-chat-container').append(html);
				socket.emit('newGroupChat', responseData.chat);

				scrollGroupChat();
			} else {
				alert(responseData.message)
			}
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});

})

socket.on('loadNewGroupChat', function (data) {
	if (global_group_id == data.group_id) {
		let html = `
              <div class="distance-user-chat" id= '`+ data._id + `'>
                <h5> `+ data.message + ` </h5> 
              </div>
            `;
		$('#group-chat-container').append(html);
		scrollGroupChat();
	}
});

function loadGroupChats(){

	$.ajax({
		url: "/load-group-chats",
		type: "POST",

		data: JSON.stringify({
			
			group_id: global_group_id,
		
		}),
		contentType: "application/json; charset=utf-8",
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				$('#group-message').val("");
				console.log('response data -----', responseData)
				let chats = responseData.chats;
				let html = '';
				for (let x = 0; x < chats.length; x++) {
					let addClass = '';
					if (chats[x]['sender_id'] == sender_id) {
						addClass = 'current-user-chat';
					} else {
						addClass = 'distance-user-chat';
					}

				html += `
            <div class='`+ addClass + `' id= '` + chats[x]['_id'] + `'>
                <h5> `+ chats[x]['message'] + ``;

					if (chats[x]['sender_id'] == sender_id) {
						html += ` <i class="fa fa-trash" aria-hidden="true" data-id = '` + chats[x]['_id'] + `' ></i>`;
					}

					html += `
                </h5> 
              </div>
            `;
				}

				$('#group-chat-container').append(html);
				scrollGroupChat();
			} else {
				alert(responseData.message)
			}
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});
}


//search 

$(document).ready(function () {
	$('#searchButton').click(function () {
		const query = $('#searchInput').val();
		// Make an AJAX request to the server to perform the search
		$.ajax({
			url: '/search-group',
			method: 'POST',
			data: { search: query },
			success: function (data) {
				let html;
				console.log("0-----0-0-0-0-0-",data);
				let groups = data.groups;
				console.log("0-----0-0-0-0-0-",groups);
				if (groups.length > 0) {
					for (let i = 0; i < groups.length; i++) {
						html += `
							<tr>
								<td>${i + 1}</td>
								<td><img src="http://127.0.0.1:3000/${groups[i]['image']}" alt="${groups[i]['image']}"></td>
								<td>${groups[i]['name']}</td>
								<td>${groups[i]['limit']}</td>
								<td><a class="cursor-pointer searchaddMember" data-id="${groups[i]['_id']}" data-limit="${groups[i]['limit']}" data-toggle="modal" data-target="#memberModal">Members</a></td>
								<td><a class="deleteGroup" data-id="${groups[i]['_id']}" data-name="${groups[i]['name']}" data-toggle="modal" data-target="#deleteGroupModal"><i class="fa fa-trash"></i></a></td>
							</tr>
						`;
					}
				} else {
					html += `
						<tr>
							<td colspan="6">No group Found</td>
						</tr>
					`;
				}
				
			
				// Handle the search results and update the #searchResults container
				$('#searchResults').html(html);
			},
			error: function (error) {
				console.error('Error:', error);
			}
		});
	});
});


$('.searchaddMember').click( function (event) {
	var id = $(this).attr('data-id');
	var limit =  $(this).attr('data-limit');
	$('#group_id').val(id);
	$('#limit').val(limit);
	$.ajax({
		url: "/get-members",
		type: "POST",
		data: {
			group_id: id
		},
		// contentType: "application/json; charset=utf-8" ,
		success: function (responseData) {
			// Process responseData here
			if (responseData.success) {
				let users = responseData.data;
				console.log("USER _____________ ", users)
				let html = '';
				for(let i =0; i<users.length; i++){
					let isMemberofGroup = users[i]['member'].length>0? true:false;
					html+=`
					<tr>
					<td>
					<input type="checkbox" `+(isMemberofGroup?'checked':'')+` name="members[]" value="`+users[i]['_id']+`" />
					</td>
					   <td>`+ users[i]['name']+` </td>
					</tr>
					`;
				  }
				  $('.addMemberinTable').html(html);

			} else {
				alert(responseData.msg)
			}
		},
		error: function (error) {
			console.error("AJAX error:", error);
		}
	});

})