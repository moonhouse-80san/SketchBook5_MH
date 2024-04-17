<?php
function getTmpAfRandNick(){
		
		$nick = "";
		$firstNick = array("혼자신난", "굵은", "비싼", "잘나가는", "유능한", "착한", "신난", "혼자잘노는", "탐스러운", "행복한", "화려한", "치킨먹는", "사랑받는", "유쾌한", "똑똑한", "돌아온", "섹시한", "짓궃은", "쌀쌀맞은", "못생긴", "밝은", "나쁜", "따뜻한", "쿨한", "갸날픈", "음란한", "딱한", "끈기있는", "강한", "약한", "곤란한", "웃긴", "심심한", "배고픈", "운좋은", "현명한");

		$outArray = array_rand($firstNick, 2);
		$nick .= $firstNick[$outArray[0]]." ";

		$secondNick = array("닭", "사자", "고슴도치", "송아지", "강아지", "귀뚜라미", "생쥐", "하마", "바다표범", "강아지", "돌고래", "꿀벌", "배짱이", "개미", "메뚜기", "비버", "아기고래", "햄스터", "상어", " 대머리독수리", "오징어", "꼴뚜기", "곰", "라마", "코끼리", "악어", "댕댕이", "냥이", "청개구리", "가리비", "파랑새", "키위", "사과", "소", "게", "자라");

		$outArray2 = array_rand($secondNick, 2);
		$nick .= $secondNick[$outArray2[0]];
		if($_SESSION['afRndNick'] == "" || !$_SESSION['afRndNick'] ){
			$_SESSION['afRndNick'] = $nick;
			return $_SESSION['afRndNick'];
		}else{
			return $_SESSION['afRndNick'];
		}
}