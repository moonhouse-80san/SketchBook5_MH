jQuery(function ($) {
	$('document').ready(function () {
		// 글읽기 이미지 출력
		$(".img_lst li").on("hover",function(){
			var imgsrc = $(this).children('img').attr("src");
			$(".img_org img").attr("src", imgsrc);
		});
	});
});