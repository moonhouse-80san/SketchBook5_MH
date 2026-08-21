/*
	mh_category_drill.js
	------------------------------------------------------------
	sketchbook5_MH 게시판 스킨용 - 카테고리 드릴다운 내비게이션
	list.html 에서 $mi->cnb=='cDrill' 일 때 렌더링되는 .mh_cnb_drill 영역을 만든다.

	동작 요약
	1) 처음(아무것도 선택 안 함): 기존 cTab 스타일처럼
	   전체(4)  탁구(6)  테니스(0)  베드민턴(0)  당구(0) 가 그냥 텍스트 링크로 나열됨.
	2) "탁구"를 클릭하면 화면이 바뀐다:
	   전체 > [탁구 ▾ select] > [대구/서울 ▾ select]
	   즉 "전체"는 다시 처음 상태로 돌아가는 링크가 되고,
	   그 뒤로는 1차부터 select 박스가 오른쪽으로 이어진다.
	3) select 값을 바꿀 때마다 그 뒤(오른쪽) select는 다시 그려지고,
	   글목록은 #mh_ajax_target 을 실제 AJAX로 새로 받아와 교체한다
	   (페이지 이동 없음).
*/
(function($){

	function mhCnbDrillInit(){
		var $wraps = $('.mh_cnb_drill');
		if(!$wraps.length) return;

		$wraps.each(function(){
			var $wrap = $(this);
			if($wrap.data('mh_drill_bound')) return; // 중복 초기화 방지
			$wrap.data('mh_drill_bound', true);

			var $dataTag = $wrap.find('script.mh_cnb_data');
			var flat = [];
			try{
				flat = JSON.parse($dataTag.text() || '[]');
			}catch(e){
				flat = [];
			}

			var bySrl = {};
			var childrenOf = {};
			var i, node, p;
			for(i=0; i<flat.length; i++){
				node = flat[i];
				bySrl[node.srl] = node;
				p = node.parent || 0;
				if(!childrenOf[p]) childrenOf[p] = [];
				childrenOf[p].push(node);
			}

			var totalCount = $wrap.attr('data-total_count') || '0';
			var urlTpl = $wrap.attr('data-list_url_tpl') || '';
			var currentCategory = parseInt($wrap.attr('data-current_category'), 10) || 0;
			var previewEnabled = $wrap.attr('data-preview') === 'Y';
			var showCount = $wrap.attr('data-show_count') === 'Y';

			var $levels = $wrap.find('.mh_cnb_levels');
			var $ajaxTarget = $('#mh_ajax_target');

			function ancestorPath(srl){
				var path = [];
				var n = bySrl[srl];
				while(n){
					path.unshift(n);
					n = n.parent ? bySrl[n.parent] : null;
				}
				return path;
			}

			function buildUrl(srl){
				return urlTpl.replace('__MH_CATEGORY__', srl);
			}

			function escText(str){
				return $('<div>').text(str == null ? '' : String(str)).html();
			}

			function labelWithCount(title, count){
				return showCount ? (title + ' (' + count + ')') : title;
			}

			// parentSrl 밑의 자식들을 고르는 select 하나를 만든다.
			function buildSelect(parentSrl, kids, selectedSrl){
				var $select = $('<select></select>').attr('data-level-parent', parentSrl);
				var totalLabel = (parentSrl === 0) ? labelWithCount('전체', totalCount) : '전체';
				$select.append($('<option></option>').attr('value', parentSrl).text(totalLabel));
				for(var k=0; k<kids.length; k++){
					var kid = kids[k];
					$select.append($('<option></option>').attr('value', kid.srl).text(labelWithCount(kid.title, kid.count)));
				}
				$select.val(selectedSrl != null ? selectedSrl : parentSrl);
				return $select;
			}

			function renderFlat(){
				// 아무것도 선택 안 된 초기 상태: 기존 cTab 스타일 텍스트 나열
				$levels.empty();
				var $all = $('<a href="#" class="mh_cnb_flat on"></a>')
					.attr('data-srl', 0)
					.text(labelWithCount('전체', totalCount));
				$levels.append($all);

				var topKids = childrenOf[0] || [];
				for(var t=0; t<topKids.length; t++){
					var tk = topKids[t];
					var $a = $('<a href="#" class="mh_cnb_flat"></a>')
						.attr('data-srl', tk.srl)
						.text(labelWithCount(tk.title, tk.count));
					if(tk.color && tk.color !== 'transparent'){
						$a.css('color', tk.color);
					}

					var grandKids = previewEnabled ? childrenOf[tk.srl] : null;
					if(grandKids && grandKids.length){
						var $preview = $('<div class="mh_cnb_preview"></div>');
						for(var g=0; g<grandKids.length; g++){
							var gk = grandKids[g];
							$preview.append(
								$('<a href="#"></a>')
									.attr('data-srl', gk.srl)
									.text(labelWithCount(gk.title, gk.count))
							);
						}
						var $wrap = $('<span class="mh_cnb_flat_wrap"></span>').append($a).append($preview);
						$levels.append($wrap);
					}else{
						$levels.append($a);
					}
				}
			}

			function renderSelects(path){
				// 1차 이상 선택된 상태: 전체(리셋 링크) > select > select ...
				$levels.empty();

				var $reset = $('<a href="#" class="mh_cnb_reset"></a>').attr('data-srl', 0).text('전체');
				$levels.append($reset);
				$levels.append('<span class="mh_cnb_arrow">›</span>');

				var parentSrl = 0;
				while(true){
					var kids = childrenOf[parentSrl];
					if(!kids || !kids.length) break;

					var chosen = null;
					for(var pi=0; pi<path.length; pi++){
						if(path[pi].parent === parentSrl){ chosen = path[pi]; break; }
					}

					$levels.append(buildSelect(parentSrl, kids, chosen ? chosen.srl : parentSrl));

					if(!chosen) break; // "전체" 선택 상태면 더 이상 하위 select는 안 그림
					parentSrl = chosen.srl;
				}
			}

			function renderAll(path){
				if(!path.length){
					renderFlat();
				}else{
					renderSelects(path);
				}
			}

			function reinitAjaxContent(){
				var bdZine = $ajaxTarget.find('ol.bd_zine');
				if(bdZine.length && bdZine.attr('data-masonry') && $.fn.imagesLoaded && $.fn.masonry){
					bdZine.imagesLoaded(function(){
						bdZine.masonry({ itemSelector:'li', isFitWidth:true });
					});
				}
				if($.fn.imagesLoaded){
					$ajaxTarget.find('.tmb').each(function(){
						var $t = $(this);
						$t.imagesLoaded(function(){
							$t.parent().addClass('fin_load').fadeIn(250);
						});
					});
				}
			}

			function loadList(srl, pushState){
				var url = buildUrl(srl);
				if(!$ajaxTarget.length){
					window.location.href = url;
					return;
				}
				$ajaxTarget.css('opacity', 0.4);
				$.get(url).done(function(html){
					var $doc = $('<div></div>').html(html);
					var $newTarget = $doc.find('#mh_ajax_target');
					if($newTarget.length){
						$ajaxTarget.html($newTarget.html());
					}
					$ajaxTarget.css('opacity', 1);
					reinitAjaxContent();
					if(pushState !== false && window.history && window.history.pushState){
						window.history.pushState({ mh_category: srl }, '', url);
					}
				}).fail(function(){
					$ajaxTarget.css('opacity', 1);
					// 서버 오류 시 전체 페이지 이동시키지 않고 목록 영역에만 안내 문구 표시
					$ajaxTarget.find('#board_list').html('<p class="mh_cnb_error" style="padding:40px 0;text-align:center;color:#999">게시물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>');
				});
			}

			function selectCategory(srl, pushState){
				srl = parseInt(srl, 10) || 0;
				var path = srl ? ancestorPath(srl) : [];
				currentCategory = srl;
				renderAll(path);
				loadList(srl, pushState);
			}

			$levels.on('click', 'a[data-srl]', function(e){
				e.preventDefault();
				selectCategory($(this).attr('data-srl'), true);
			});

			$levels.on('change', 'select', function(){
				selectCategory($(this).val(), true);
			});

			$(window).on('popstate.mhCnbDrill', function(e){
				var state = e.originalEvent ? e.originalEvent.state : null;
				var srl = (state && typeof state.mh_category !== 'undefined') ? state.mh_category : currentCategory;
				var path = srl ? ancestorPath(srl) : [];
				currentCategory = srl;
				renderAll(path);
				loadList(srl, false);
			});

			// 초기 렌더 (현재 선택된 카테고리 기준, 목록은 서버가 이미 그려둔 상태라 재요청 안 함)
			var initPath = currentCategory ? ancestorPath(currentCategory) : [];
			renderAll(initPath);
		});
	}

	$(mhCnbDrillInit);

})(jQuery);
