var stickerConfig = {};
stickerConfig.delayTime = 3000; // 스티커 댓글 작성 후 다시 스티커를 삽입하기까지 시간 제한 설정. 단위 ms.
stickerConfig.setTimeout = false;
//alert(default_url);

/*
 * 댓글 작성시 스티커 토글 : loadStickerList();
 * 대댓글 작성시 : loadStickerList(undefined, parent_comment_srl);
 * 댓글 수정시 : loadStickerList(undefined, false, comment_srl);
*/

function loadStickerList(page, parent_srl, comment_srl){
	var _page = page;
	page = page ? page : 1;
	var $target = jQuery(!parent_srl && !comment_srl ? '.stk_cmt' : '.stk_cmt_reply');


	var alreadyLoadPage = $target.find('.stk_display .sticker_pack').attr('page') || 1;
	if($target.find('.stk_head .sticker_icon').length){
		if(_page === undefined && !$target.find('.stk_display').hasClass('display-toggle')){
			$target.find('.stk_display').addClass('display-toggle');
			return false;
		}

		if(page == alreadyLoadPage){
			$target.find('.stk_display').toggleClass('display-toggle');
			return false;
		}
	}

	exec_json("sticker.getCommentStickerList",{page:page}, function(ret_obj){
		$target.find('.stk_display').hasClass('display-toggle') && $target.find('.stk_display').toggleClass('display-toggle');
		var sticker = ret_obj['sticker'];
		if(page != 1 && !sticker.length){
			return alert('마지막 페이지입니다.'), false;
		}
		var html = '';
		html += '<li style="padding-top:15px">';
		html += '<a href="javascript:;" onclick="'+(page==1 ? 'alert(\'첫 번째 페이지입니다.\')' : ('loadStickerList('+(page-1)+', '+(parent_srl ? parent_srl : 'false')+', '+(comment_srl ? comment_srl : 'false')+')'))  +'">';
		html += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M10.828 12l4.95 4.95-1.414 1.414L8 12l6.364-6.364 1.414 1.414z"/></svg></a></li>';
		var sticker_length = sticker.length;
		for(i in sticker){
			if(sticker[i].sticker_srl) {
			html += '<li class="sticker_image srl">';
			html += '<a href="javascript:;" onclick="loadSticker('+sticker[i].sticker_srl+', '+(parent_srl ? parent_srl : 'false') +', '+(comment_srl ? comment_srl : 'false')+');">'
			html += '<div title="'+sticker[i].title+'">';
			html += '<img src="'+sticker[i].main_image+'" width="30" height="30">';
			html += "</div>";
			html += '</a>';
			html += "</li>";
			}
		}

		//blank
		for(i=2-sticker_length; i>0; i--){
			html += '<li class="sticker_icon srl">';
			html += '</li>';
		}

		// (Lhymix 2.0 짧은주소 조정) 
		html += '<li class="sticker_icon srl1" title="Stick Shop"><a href="'+ default_url+'sticker" target="_blank"><svg class="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M6 9h13.938l.5-2H8V5h13.72a1 1 0 0 1 .97 1.243l-2.5 10a1 1 0 0 1-.97.757H5a1 1 0 0 1-1-1V4H2V2h3a1 1 0 0 1 1 1v6zm0 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm12 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="rgba(255,255,255,1)"/></svg></a></li>'; // (Lhymix 2.0)
		html += '<li class="sticker_icon srl1" title="Buy List"><a href="'+ default_url+'index.php?mid=sticker&act=dispStickerMylist" target="_blank"><svg class="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M11 4h10v2H11V4zm0 4h6v2h-6V8zm0 6h10v2H11v-2zm0 4h6v2h-6v-2zM3 4h6v6H3V4zm2 2v2h2V6H5zm-2 8h6v6H3v-6zm2 2v2h2v-2H5z" fill="rgba(255,255,255,1)"/></svg></a></li>'; // (Lhymix 2.0)
		html += '<li style="padding-top:15px">';
		html += '<a href="javascript:;" onclick="'+(sticker_length < 8 ? 'alert(\'마지막 페이지입니다.\')' : ('loadStickerList('+(page+1)+', '+(parent_srl ? parent_srl : 'false')+', '+(comment_srl ? comment_srl : 'false')+')')) +'">';
		html += '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M13.172 12l-4.95-4.95 1.414-1.414L16 12l-6.364 6.364-1.414-1.414z"/></svg></a></li>';

		$target.find('.stk_display .sticker_pack').html(html).attr({
			page: page,
		});
//		if(page == 1 && _page === undefined){
		if(page == 1 || _page === undefined){
			var first_sticker = $target.find('.stk_display .sticker_pack .sticker_image');
			if(first_sticker.length > 0){
				var sticker_srl = first_sticker.eq(0).find('a').attr('onclick').replace(/.*\(([0-9]+).*/, '$1');
				loadSticker(sticker_srl, (parent_srl ? parent_srl : false), (comment_srl ? comment_srl : false));
			}
		}

	});

}

function loadSticker(sticker_srl, parent_srl, comment_srl){
	if(!sticker_srl){
		return alert('스티커 값이 없습니다.'), false;
	}

	var $target = jQuery(!parent_srl && !comment_srl ? '.stk_cmt' : '.stk_cmt_reply');
	var already_exist = $target.find('.stk_display>.stk_body .sticker_'+sticker_srl);

	if(already_exist.length){
		$target.find('.stk_display>.stk_body>ul').hide();
		already_exist.show();
	} else {
		exec_json('sticker.getStickerElemList', {sticker_srl:sticker_srl}, function(ret_obj){
			var stickerImage = ret_obj.stickerImage;
			var html = '';
			html += '<ul class="sticker_'+sticker_srl+'">';
			for(i in stickerImage){
				var image = stickerImage[i];
				html += '<li>';
				html += '<a href="javascript:;" onclick="insertSticker('+sticker_srl+', '+image.sticker_file_srl+', '+(parent_srl ? parent_srl : 'false')+', '+(comment_srl ? comment_srl : 'false')+')" style="background-image:url('+image.url+');" title="'+image.name+'">';
				html += '</a>';
				html += '</li>';
			}
			html += '</ul>';

			$target.find('.stk_display>.stk_body>ul').hide();
			$target.find('.stk_display>.stk_body').append(html);

		});
	}

}

function insertSticker(sticker_srl, sticker_file_srl, parent_srl, comment_srl){

	if(stickerConfig.setTimeout !== false){
		return alert("너무 빠른 시간동안 이모티콘을 등록할 수 없습니다."), false;
	} else {
		stickerConfig.setTimeout = setTimeout(function(){
			stickerConfig.setTimeout = false;
		}, stickerConfig.delayTime);
	}

	var form = jQuery('.cmt_editor>form');
	var mid = form.find('input[name=mid]').val();
	var document_srl = form.find('input[name=document_srl]').val();
	var comment_srl = comment_srl || 0;
	var parent_srl = parent_srl || 0;
	var content = "{@sticker:"+sticker_srl+"|"+sticker_file_srl+"}";

	var anon = '';
	if(bdLogin.length){
		var editor = jQuery(parent_srl || comment_srl ? '#re_cmt' : '.cmt_editor');
		var nick_name = editor.find('.itx_wrp>input[name=nick_name]').val().trim();
		var password = editor.find('.itx_wrp>input[name=password]').val().trim();

		if(!(nick_name && password)){
			editor.find('form>.edit_opt').slideDown();
		}
		if(!nick_name){
			return alert('닉네임 값은 필수입니다.');
		}
		if(!password){
			return alert('비밀번호 값은 필수입니다.');
		}
		anon += '<nick_name><![CDATA['+nick_name+']]></nick_name><password><![CDATA['+password+']]></password>';
	}

	// (Lhymix 2.0 짧은주소 조정) 
	var tmp_url = default_url+'index.php';
	jQuery.ajax({
		headers: {'Content-Type': 'text/plain'},
		type: 'POST',
		dataType: "text",
		url: tmp_url,
		data: '<?xml version="1.0" encoding="utf-8" ?><methodCall><params><_filter><![CDATA[insert_comment]]></_filter><error_return_url><![CDATA['+window.location.pathname+']]></error_return_url><mid><![CDATA['+mid+']]></mid><document_srl><![CDATA['+document_srl+']]></document_srl>'+(comment_srl ? ('<comment_srl><![CDATA['+comment_srl+']]></comment_srl>') : '')+'<parent_srl><![CDATA['+parent_srl+']]></parent_srl><content><![CDATA['+content+']]></content>'+ anon +'<use_html><![CDATA[Y]]></use_html><module><![CDATA[board]]></module><act><![CDATA[procBoardInsertComment]]></act></params></methodCall>',

		beforeSend : function() {
		},
		success : function(ret_xml) {
			var parseXML = jQuery.parseXML(ret_xml);
			var xml = jQuery(parseXML);

			var error = xml.find('error').text();
			var message = xml.find('message').text();
			var mid = xml.find('mid').text();
			var document_srl = xml.find('document_srl').text();
			var comment_srl = xml.find('comment_srl').text();
			if(!parseInt(error)){
				/******** 스티커 등록 성공 후 실행할 부분********/
				location.reload();
			} else {
				alert(message);
			}
		},
		error : function(request, status, error) {
		},
		complete : function() {
		}
	});


}
