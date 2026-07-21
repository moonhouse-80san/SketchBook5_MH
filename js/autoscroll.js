(function($) {
	$(function() {
		// 다이얼 출력 여부(관리자 설정, 기본값 출력함)
		const showSpeedDial = window.xe_autoscroll_show_speed_dial !== 'N';

		const speedDialHtml = showSpeedDial ?
			'<div class="aqm-speed" id="autoscroll-speed-dial">' +
				'<svg class="aqm-speed-svg" viewBox="0 0 36 36">' +
					'<circle class="aqm-speed-track" cx="18" cy="18" r="14"></circle>' +
					'<circle class="aqm-speed-fill" id="aqm-speed-fill" cx="18" cy="18" r="14"></circle>' +
					'<circle class="aqm-speed-handle" id="aqm-speed-handle" cx="18" cy="4" r="3.5"></circle>' +
				'</svg>' +
				'<div class="aqm-speed-value" id="aqm-speed-value">0.9x</div>' +
			'</div>' : '';

		// 퀵메뉴 박스(Top / 자동 스크롤 라벨 / Start,Stop 토글)를 body 바로 밑으로 강제 이동 (레이아웃 틀어짐 방지)
		$('<div id="autoscroll-quickmenu" class="autoscroll-quickmenu">' +
			'<div id="quick-top-btn" class="aqm-top">▲ Top</div>' +
			'<div id="autoscroll-drag-handle" class="aqm-label">자동<br>스크롤</div>' +
			speedDialHtml +
			'<button id="scroll-toggle-btn" class="aqm-toggle">▶ Start</button>' +
		'</div>').appendTo('body');

		const $box = $('#autoscroll-quickmenu');

		// 게시판 본문 우측 끝 기준으로 퀵메뉴 박스 위치를 계산/적용
		// 관리자 설정(content_selector)이 없어도, 흔히 쓰이는 본문 래퍼 후보들을 순서대로 자동 탐지한다.
		// 관리자가 값을 입력하면 그 값을 최우선으로 먼저 시도하고, 실패하면 아래 내장 후보로 넘어간다.
		const BUILTIN_CONTENT_SELECTORS = ['.rd', '#bd_content', '.xe_content', '#container', '.zbxe_content', '.board_content', '#content'];

		function resolveContentSelectors() {
			const custom = (window.xe_autoscroll_content_selector || '')
				.split(',')
				.map(function(s) { return s.trim(); })
				.filter(function(s) { return s.length > 0; });
			return custom.concat(BUILTIN_CONTENT_SELECTORS);
		}

		function findContentWrap() {
			const selectors = resolveContentSelectors();
			for (let i = 0; i < selectors.length; i++) {
				try {
					const el = document.querySelector(selectors[i]);
					if (el) return el;
				} catch (err) {
					continue; // 잘못된 셀렉터는 건너뛰고 다음 후보 시도
				}
			}
			return null;
		}

		// 드래그로 옮긴 적이 있으면 저장된 leftOffset(본문 우측 끝에서 떨어진 거리)을 사용,
		// 없으면 기본 간격(16px)만큼 떨어뜨려 배치 -> 창 크기가 바뀌어도 항상 본문 옆에 붙음
		function positionQuickMenu() {
			const wrap = findContentWrap();
			const boxWidth = $box.outerWidth() || 55;

			let leftOffset = 16; // 기본 간격(px)
			let top = 90; // 기본 top(px, CSS 기본값과 동일)

			const savedPos = localStorage.getItem('autoscrollBoxPos');
			if (savedPos) {
				try {
					const pos = JSON.parse(savedPos);
					if (typeof pos.leftOffset === 'number') leftOffset = pos.leftOffset;
					if (typeof pos.top === 'number') top = pos.top;
				} catch (e) {}
			}

			if (!wrap) return; // 본문 요소를 하나도 못 찾으면 CSS 기본값(화면 우측 상단 고정)을 그대로 둠

			const rect = wrap.getBoundingClientRect();
			const left = rect.right + leftOffset;

			if (left + boxWidth > window.innerWidth) {
				// 화면이 좁아 우측에 붙일 공간이 없으면(모바일 등) 화면 우측 상단 고정으로 되돌림
				$box.css({ left: 'auto', right: '16px', top: top + 'px' });
			} else {
				$box.css({ left: left + 'px', right: 'auto', top: top + 'px' });
			}
		}

		positionQuickMenu();
		$(window).on('resize', positionQuickMenu);

		// 자동 스크롤 라벨(드래그 핸들)을 눌러서 박스 위치를 자유롭게 이동
		(function enableDrag() {
			const handle = document.getElementById('autoscroll-drag-handle');
			const box = document.getElementById('autoscroll-quickmenu');
			if (!handle || !box) return;

			let dragging = false;
			let startX = 0, startY = 0, startTop = 0, startLeft = 0;

			function getPoint(e) {
				if (e.touches && e.touches.length) {
					return { x: e.touches[0].clientX, y: e.touches[0].clientY };
				}
				return { x: e.clientX, y: e.clientY };
			}

			function onDragStart(e) {
				dragging = true;
				const rect = box.getBoundingClientRect();
				const p = getPoint(e);
				startX = p.x;
				startY = p.y;
				startTop = rect.top;
				startLeft = rect.left;
				box.style.right = 'auto';
				box.style.top = startTop + 'px';
				box.style.left = startLeft + 'px';
				e.preventDefault();
			}

			function onDragMove(e) {
				if (!dragging) return;
				const p = getPoint(e);
				let newTop = startTop + (p.y - startY);
				let newLeft = startLeft + (p.x - startX);

				const maxTop = window.innerHeight - box.offsetHeight;
				const maxLeft = window.innerWidth - box.offsetWidth;
				newTop = Math.min(Math.max(newTop, 0), Math.max(maxTop, 0));
				newLeft = Math.min(Math.max(newLeft, 0), Math.max(maxLeft, 0));

				box.style.top = newTop + 'px';
				box.style.left = newLeft + 'px';
			}

			function onDragEnd() {
				if (!dragging) return;
				dragging = false;

				const wrap = findContentWrap();
				const boxRect = box.getBoundingClientRect();
				// 본문 우측 끝에서부터 얼마나 떨어져 있는지를 기준으로 저장
				// (본문을 못 찾으면 화면 좌측 기준 절대좌표로 대체 저장)
				const leftOffset = wrap ? (boxRect.left - wrap.getBoundingClientRect().right) : boxRect.left;

				localStorage.setItem('autoscrollBoxPos', JSON.stringify({
					top: parseInt(box.style.top, 10),
					leftOffset: leftOffset
				}));
			}

			handle.addEventListener('mousedown', onDragStart);
			document.addEventListener('mousemove', onDragMove);
			document.addEventListener('mouseup', onDragEnd);

			handle.addEventListener('touchstart', onDragStart, { passive: false });
			document.addEventListener('touchmove', onDragMove, { passive: false });
			document.addEventListener('touchend', onDragEnd);
		})();

		// 자동 스크롤 라벨을 더블클릭(PC) / 더블탭(모바일)하면 퀵메뉴 박스를 접었다/펼쳤다 함
		(function enableCollapseToggle() {
			const handle = document.getElementById('autoscroll-drag-handle');
			if (!handle) return;

			function applyCollapsed(collapsed) {
				$box.toggleClass('collapsed', collapsed);
			}

			// 저장된 접힘 상태 복원 (새로고침해도 유지)
			applyCollapsed(localStorage.getItem('autoscrollCollapsed') === 'Y');

			function toggleCollapsed() {
				const next = !$box.hasClass('collapsed');
				applyCollapsed(next);
				localStorage.setItem('autoscrollCollapsed', next ? 'Y' : 'N');
			}

			// PC: 더블클릭
			handle.addEventListener('dblclick', function(e) {
				e.preventDefault();
				toggleCollapsed();
			});

			// 모바일: 더블탭 (touchend 두 번을 시간/이동거리 기준으로 직접 판정)
			let touchStartPoint = null;
			let lastTapTime = 0;
			const DOUBLE_TAP_DELAY = 350; // ms
			const TAP_MOVE_TOLERANCE = 10; // px, 이보다 많이 움직이면 드래그로 간주해 탭에서 제외

			handle.addEventListener('touchstart', function(e) {
				if (e.touches && e.touches.length) {
					touchStartPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
				}
			}, { passive: true });

			handle.addEventListener('touchend', function(e) {
				if (!touchStartPoint) return;
				const p = e.changedTouches && e.changedTouches[0];
				if (!p) return;

				const moved = Math.hypot(p.clientX - touchStartPoint.x, p.clientY - touchStartPoint.y);
				touchStartPoint = null;
				if (moved > TAP_MOVE_TOLERANCE) return; // 드래그로 움직인 경우 탭으로 취급하지 않음

				const now = Date.now();
				if (now - lastTapTime < DOUBLE_TAP_DELAY) {
					e.preventDefault();
					toggleCollapsed();
					lastTapTime = 0; // 연속 트리플탭 등으로 다시 토글되는 것 방지
				} else {
					lastTapTime = now;
				}
			});
		})();

		// 라이믹스 애드온 설정값 읽기 (값이 없으면 기본값 우회 적용)
		// target_id에 콤마(,)로 여러 셀렉터를 지정하면, 현재 페이지에 실제로 존재하는
		// 첫 번째 셀렉터를 자동 스크롤 목적지로 사용합니다. (예: "#cmtPosition, .comment_wrap")
		const targetList = (window.xe_autoscroll_target ? window.xe_autoscroll_target : '#cmtPosition')
			.split(',')
			.map(function(s) { return s.trim(); })
			.filter(function(s) { return s.length > 0; });

		function getTarget() {
			for (let i = 0; i < targetList.length; i++) {
				try {
					if ($(targetList[i]).length > 0) {
						return targetList[i];
					}
				} catch (err) {
					continue;
				}
			}
			return targetList[0] || '#cmtPosition';
		}

		const gap = window.xe_autoscroll_gap ? window.xe_autoscroll_gap : 80;
		let scrollSpeed = window.xe_autoscroll_speed ? window.xe_autoscroll_speed : 0.9;

		// 자동 스크롤 속도 조절용 원형 다이얼
		(function enableSpeedDial() {
			const SPEED_MIN = 0.2;
			const SPEED_MAX = 2.0;
			const svg = document.querySelector('#autoscroll-speed-dial .aqm-speed-svg');
			const fillEl = document.getElementById('aqm-speed-fill');
			const handleEl = document.getElementById('aqm-speed-handle');
			const valueEl = document.getElementById('aqm-speed-value');
			if (!svg || !fillEl || !handleEl || !valueEl) return;

			const CX = 18, CY = 18, R = 14;
			const CIRC = 2 * Math.PI * R;

			function render(value) {
				const clamped = Math.min(Math.max(value, SPEED_MIN), SPEED_MAX);
				const fraction = (clamped - SPEED_MIN) / (SPEED_MAX - SPEED_MIN);
				const angle = fraction * Math.PI * 2;

				fillEl.setAttribute('stroke-dasharray', (fraction * CIRC) + ' ' + CIRC);
				handleEl.setAttribute('cx', CX + R * Math.sin(angle));
				handleEl.setAttribute('cy', CY - R * Math.cos(angle));
				valueEl.textContent = clamped.toFixed(1) + 'x';

				return clamped;
			}

			function valueFromEvent(e) {
				const rect = svg.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				const p = (e.touches && e.touches.length) ? e.touches[0] : e;
				const dx = p.clientX - centerX;
				const dy = p.clientY - centerY;

				let angle = Math.atan2(dx, -dy);
				if (angle < 0) angle += Math.PI * 2;

				const fraction = angle / (Math.PI * 2);
				return SPEED_MIN + fraction * (SPEED_MAX - SPEED_MIN);
			}

			let dragging = false;

			function onStart(e) {
				dragging = true;
				onMove(e);
				e.preventDefault();
			}

			function onMove(e) {
				if (!dragging) return;
				scrollSpeed = render(valueFromEvent(e));
			}

			function onEnd() {
				if (!dragging) return;
				dragging = false;
				localStorage.setItem('autoscrollSpeedValue', String(scrollSpeed));
			}

			svg.addEventListener('mousedown', onStart);
			document.addEventListener('mousemove', onMove);
			document.addEventListener('mouseup', onEnd);

			svg.addEventListener('touchstart', onStart, { passive: false });
			document.addEventListener('touchmove', onMove, { passive: false });
			document.addEventListener('touchend', onEnd);

			// 저장된 속도 값이 있으면 복원, 없으면 관리자 기본값(scrollSpeed) 사용
			const savedSpeed = parseFloat(localStorage.getItem('autoscrollSpeedValue'));
			if (!isNaN(savedSpeed)) {
				scrollSpeed = render(savedSpeed);
			} else {
				render(scrollSpeed);
			}
		})();

		let animationFrameId = null;
		let isScrolling = false;
		let preciseScrollY = 0;

		function smoothScrollStep() {
			const target = getTarget();
			if (!isScrolling || $(target).length === 0) return;

			const targetScrollTop = $(target).offset().top - gap;
			const currentScroll = $(window).scrollTop();

			if (currentScroll >= targetScrollTop - 1) {
				stopAutoScroll(true);
				return;
			}

			preciseScrollY += scrollSpeed;
			window.scrollTo(0, Math.round(preciseScrollY));

			animationFrameId = requestAnimationFrame(smoothScrollStep);
		}

		// 이미 끝 지점에 도달한 상태에서 다시 시작할 때, 순간이동이 아니라
		// 위로 서서히 스크롤한 뒤(다이얼 속도와 별개로 좀 더 빠르게), 맨 위에서 잠시 멈췄다가
		// 자연스럽게 이어서 아래로 자동 스크롤을 시작한다.
		const SCROLL_UP_SPEED = 30.0;
		const TOP_PAUSE_MS = 2000; // 맨 위 도달 후 대기 시간

		function scrollUpToTopThenRestart() {
			preciseScrollY = $(window).scrollTop();

			function upStep() {
				if (!isScrolling) return; // 중간에 Stop을 누르거나 사용자가 개입하면 중단

				preciseScrollY -= SCROLL_UP_SPEED;

				if (preciseScrollY <= 0) {
					window.scrollTo(0, 0);
					preciseScrollY = 0;
					animationFrameId = null;
					setTimeout(function() {
						if (!isScrolling) return; // 대기 중에 정지됐으면 재시작하지 않음
						animationFrameId = requestAnimationFrame(smoothScrollStep);
					}, TOP_PAUSE_MS);
					return;
				}

				window.scrollTo(0, Math.round(preciseScrollY));
				animationFrameId = requestAnimationFrame(upStep);
			}

			animationFrameId = requestAnimationFrame(upStep);
		}

		function startAutoScroll(saveState = true) {
			const target = getTarget();
			if ($(target).length === 0) return;

			const targetScrollTop = $(target).offset().top - gap;
			const currentScroll = $(window).scrollTop();

			isScrolling = true;
			$("#scroll-toggle-btn").addClass("active").text("▣ Stop");

			if (saveState) {
				localStorage.setItem("autoScrollState", "ON");
			}

			if (currentScroll >= targetScrollTop - 1) {
				// 이미 끝 지점에 도달해 있는 상태 -> 위로 서서히 스크롤한 뒤 다시 아래로 시작
				scrollUpToTopThenRestart();
			} else {
				preciseScrollY = currentScroll;
				animationFrameId = requestAnimationFrame(smoothScrollStep);
			}
		}

		function stopAutoScroll(changeStorage = true) {
			isScrolling = false;
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			$("#scroll-toggle-btn").removeClass("active").text("▶ Start");
			
			if (changeStorage) {
				localStorage.setItem("autoScrollState", "OFF");
			}
		}

		$("#scroll-toggle-btn").on("click", function() {
			if (isScrolling) {
				stopAutoScroll(true);
			} else {
				startAutoScroll(true);
			}
		});

		$("#quick-top-btn").on("click", function(e) {
			e.preventDefault();
			stopAutoScroll(true);
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		});

		$(window).on("wheel DOMMouseScroll touchstart mousedown keydown", function(e) {
			if (isScrolling && !$(e.target).closest(".autoscroll-quickmenu").length) {
				stopAutoScroll(true);
			}
		});

		const savedState = localStorage.getItem("autoScrollState");
		if (savedState === "ON") {
			setTimeout(function() {
				startAutoScroll(false);
			}, 150);
		}
	});
})(jQuery);
