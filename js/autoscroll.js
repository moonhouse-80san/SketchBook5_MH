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

		// 저장된 위치가 있으면 복원 (드래그로 옮긴 경우)
		const savedPos = localStorage.getItem('autoscrollBoxPos');
		if (savedPos) {
			try {
				const pos = JSON.parse(savedPos);
				if (typeof pos.top === 'number' && typeof pos.left === 'number') {
					$box.css({ top: pos.top + 'px', left: pos.left + 'px', right: 'auto' });
				}
			} catch (e) {}
		}

		// 게시판 본문(.rd) 바로 우측에 퀵메뉴 박스를 붙임 (드래그로 위치를 옮긴 적이 없을 때만)
		function alignQuickMenuToContent() {
			if (localStorage.getItem('autoscrollBoxPos')) return; // 드래그로 옮긴 위치가 우선

			const wrap = document.querySelector('.rd');
			if (!wrap) return;

			const rect = wrap.getBoundingClientRect();
			const boxWidth = $box.outerWidth() || 55;
			const margin = 16; // 게시판과 박스 사이 간격(px)
			const left = rect.right + margin;

			if (left + boxWidth > window.innerWidth) {
				// 화면이 좁아 우측에 붙일 공간이 없으면(모바일 등) 기존처럼 화면 우측 상단에 고정
				$box.css({ left: 'auto', right: '16px' });
			} else {
				$box.css({ left: left + 'px', right: 'auto' });
			}
		}

		alignQuickMenuToContent();
		$(window).on('resize', alignQuickMenuToContent);

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
				localStorage.setItem('autoscrollBoxPos', JSON.stringify({
					top: parseInt(box.style.top, 10),
					left: parseInt(box.style.left, 10)
				}));
			}

			handle.addEventListener('mousedown', onDragStart);
			document.addEventListener('mousemove', onDragMove);
			document.addEventListener('mouseup', onDragEnd);

			handle.addEventListener('touchstart', onDragStart, { passive: false });
			document.addEventListener('touchmove', onDragMove, { passive: false });
			document.addEventListener('touchend', onDragEnd);
		})();

		// 설정값 읽기 (값이 없으면 기본값 우회 적용)
		const target = window.xe_autoscroll_target ? window.xe_autoscroll_target : '#cmtPosition';
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
			if (!isScrolling || $(target).length === 0) return;

			const targetScrollTop = $(target).offset().top - gap;
			const currentScroll = $(window).scrollTop();

			if (currentScroll >= targetScrollTop - 1) {
				stopAutoScroll(false);
				return;
			}

			preciseScrollY += scrollSpeed;
			window.scrollTo(0, Math.round(preciseScrollY));

			animationFrameId = requestAnimationFrame(smoothScrollStep);
		}

		function startAutoScroll(saveState = true) {
			if ($(target).length === 0) return;

			const targetScrollTop = $(target).offset().top - gap;
			const currentScroll = $(window).scrollTop();
			
			if (currentScroll >= targetScrollTop) return;

			preciseScrollY = currentScroll;
			isScrolling = true;
			$("#scroll-toggle-btn").addClass("active").text("▣ Stop");
			
			if (saveState) {
				localStorage.setItem("autoScrollState", "ON");
			}

			animationFrameId = requestAnimationFrame(smoothScrollStep);
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
				stopAutoScroll(false); 
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
