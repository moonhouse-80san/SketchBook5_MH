{@
	$oModuleAdminModel = getAdminModel('module');
	$skin_content = $oModuleAdminModel->getModuleSkinHTML($module_info->module_srl);
}

<div id="bd_wizard" <!--@if($grant->manager)--> class="{$_COOKIE['bd_wizard_cookie']}"<!--@else--> class="{$_COOKIE['bd_wizard_cookie']} barrier" title="관리자만 설정할 수 있습니다."<!--@end--> style="left:0"|cond="$_COOKIE['bd_wizard_cookie']=='open'">
	<button type="button" id="bd_wizard_tg" class="ngeb bd_btn" title="{$lang->cmd_setup} {$lang->cmd_open}/{$lang->cmd_close}"><i class="fa fa-cog"></i><b class="blind">Open/Close</b></button>
	<h1 class="ui_font">게시판 설정</h1>
	<div id="bd_wizard_scroll">
		{$skin_content}
	</div>
</div>

<script>
	jQuery(function($){
		var v = $('#bd_wizard');
		$('body').append(v);
		v.find('#bd_wizard_tg,#bd_wizard .tg_close2').click(function(){
			if(v.hasClass('open')){
				v.animate({left:-480},{duration:500,complete:function(){
					jQuery(this).removeClass('open');
				},step:null,queue:false});
				jQuery.removeCookie('bd_wizard_cookie');
			} else {
				v.animate({left:0},{duration:350}).addClass('open');
				jQuery.cookie('bd_wizard_cookie','open');
			}
		});
		setTimeout(function(){
		jQuery('#bd_wizard .message').fadeOut();
		}, 1500);
		v.find('form>.section').eq(0).remove();
		v.find('form>.section').eq(0).hide();

		// 저장된 탭 복원 (없으면 기본 1번)
		var $sections = v.find('form>.section');
		var savedIdx = parseInt(jQuery.cookie('bd_wizard_section'), 10);
		if(isNaN(savedIdx) || savedIdx < 0 || savedIdx >= $sections.length){
			savedIdx = 1;
		}
		$sections.eq(savedIdx).addClass('on');

		v.find('form>.section>h2').click(function(){
			var p = $(this).parent();
			if(p.hasClass('on')){
				p.removeClass('on');
				jQuery.removeCookie('bd_wizard_section');
			} else {
				p.addClass('on').siblings().removeClass('on');
				var idx = $sections.index(p);
				jQuery.cookie('bd_wizard_section', idx);
			}
		});
		v.find('a.x_icon-question-sign').click(function(){
			v.find('p.x_help-block:visible').hide();
			$(this).next('p').show();
			return false;
		});

		// 등록 버튼을 스크롤 영역 밖 하단에 고정
		var $form = v.find('form');
		var $btn = $form.find('.x_btn').last();
		if($btn.length){
			var $footer = $('<div class="bd_wizard_footer show"></div>');
			var $fixedBtn = $btn.clone(true);
			$btn.hide();
			$footer.append($fixedBtn);
			v.append($footer);
			$fixedBtn.on('click', function(e){
				e.preventDefault();
				$form.trigger('submit');
			});
		}
		// 제출 직전 현재 열린 탭 저장
		$form.on('submit', function(){
			var $open = $sections.filter('.on').first();
			if($open.length){
				jQuery.cookie('bd_wizard_section', $sections.index($open));
			}
		});
	});
</script>