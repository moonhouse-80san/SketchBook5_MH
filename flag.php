<?php
if(!defined('__XE__')) exit();

function getCountryFlag($ip, $flag_kr = '')
{
	$ip2long = ip2long($ip);
	$output = executeQuery('allbandazole.getCountryByIP', ['ip' => $ip2long]);
	
	if (isset($output->data) && isset($output->data->country) && $output->data->start_ip <= $ip2long) {
		// flag_kr이 'N'이면 한국(KR)은 표시하지 않음
		if ($flag_kr === 'N' && $output->data->country === 'KR') {
			return ''; // 한국 국기는 표시하지 않음
		}
		
		// 국기 표시
		$ipflag = sprintf('<img src="https://flagcdn.com/16x12/%s.png" alt="%s" title="%s">', 
			strtolower($output->data->country), 
			$output->data->country, 
			$output->data->country
		);
		return $ipflag;
	}
	
	return '';
}