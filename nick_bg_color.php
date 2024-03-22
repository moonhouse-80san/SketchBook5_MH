<?php
class nickBgUtil
{
public $nick_bg_data='{"orange":"#FF4500","brownishorange":"#DAA520","darkgreen":"#008000","blue":"#0000FF","blueviolet":"#8a2be2","brown":"#a52a2a","cadetblue":"#5f9ea0","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","crimson":"#dc143c","darkblue":"#00008b","darkgoldenrod":"#b8860b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f","darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","dimgray":"#696969","firebrick":"#b22222","hotpink":"#ff69b4","dodgerblue":"#1e90ff","forestgreen":"#228b22","grey":"#808080","indianred":"#cd5c5c","indigo":"#4b0082","lightcoral":"#f08080","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightslategrey":"#778899","limegreen":"#32cd32","magenta":"magenta","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370db","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","navy":"#000080","olive":"olive","olivedrab":"#6b8e23","seagreen":"#2e8b57","orangered":"#ff4500","orchid":"#da70d6","pink":"#FF69B4","purple":"purple","slateblue":"#6a5acd","red":"#FF0000","rosybrown":"#bc8f8f","royalblue":"#4169e1","saddlebrown":"#8b4513","salmon":"#fa8072","sienna":"#a0522d","slategrey":"#708090","steelblue":"#4682b4","tan":"#d2b48c","tomato":"#ff6347","violet":"#ee82ee"}';
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
