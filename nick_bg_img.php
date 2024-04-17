<?php
class nickBgUtil
{
public $nick_bg_data='{"1":"01.png","2":"02.png","3":"03.png","4":"04.png","5":"05.png","6":"06.png","7":"07.png","8":"08.png","9":"09.png","10":"10.png","11":"11.png","12":"12.png","13":"13.png","14":"14.png","15":"15.png","16":"16.png","17":"17.png","18":"18.png","19":"19.png","20":"20.png","21":"21.png","22":"22.png","23":"23.png","24":"24.png","25":"25.png","26":"26.png","27":"27.png","28":"28.png","29":"29.png","30":"30.png","31":"31.png","32":"32.png","33":"33.png","34":"34.png","35":"35.png","36":"36.png","37":"37.png","38":"38.png","39":"39.png","40":"40.png"}';
public $nick_bg_array;

	function __construct(){
		$this->nick_bg_array = json_decode($this->nick_bg_data,true);
	}

	function overflow32($v)
	{
		$v = $v % 4294967296;
		if ($v > 2147483647) return $v - 4294967296;
		elseif ($v < -2147483648) return $v + 4294967296;
		else return $v;
	}

	function hashCode( $s )
	{
		$h = 0;
		$len = strlen($s);
		for($i = 0; $i < $len; $i++)
		{
			$h = $this->overflow32(31 * $h + ord($s[$i]));
		}

		return $h;
	}

	function getNickBgColor($s){
		$hashStr = $this->hashCode($s);
		$c_length = count($this->nick_bg_array);
		$hashStr = (($hashStr % $c_length) + $c_length) % $c_length;
		$i=0;
		foreach($this->nick_bg_array as $cl){
			if($i == $hashStr){
				return $cl;
			}
			$i++;
		}

		return "#FF4500";
	}

}
