<?php
class nickBgUtil {
    private $nick_bg_data;
    private $nick_bg_array;

    public function __construct() {
        // 현재 PHP 파일이 있는 디렉토리를 기준으로 상대 경로 설정
        $profile_dir = __DIR__ . '/img/profile';
        
        // PNG 파일 목록 가져오기
        $png_files = glob($profile_dir . '/*.png');
        
        $data = array();
        foreach($png_files as $index => $file) {
            // 파일명만 추출 (경로 제외)
            $filename = basename($file);
            // 1부터 시작하는 인덱스로 배열 생성
            $data[$index + 1] = $filename;
        }
        
        // 키 기준으로 정렬
        ksort($data);
        
        // JSON 형태로 변환하여 저장
        $this->nick_bg_data = json_encode($data);
        $this->nick_bg_array = $data;
    }

    private function overflow32($v) {
        $v = $v % 4294967296;
        if ($v > 2147483647) return $v - 4294967296;
        elseif ($v < -2147483648) return $v + 4294967296;
        else return $v;
    }

    private function hashCode($s) {
        $h = 0;
        $len = strlen($s);
        for($i = 0; $i < $len; $i++) {
            $h = $this->overflow32(31 * $h + ord($s[$i]));
        }
        return $h;
    }

    public function getNickBgColor($s) {
        if (empty($s)) {
            return $this->nick_bg_array[1];
        }
        
        $hashStr = $this->hashCode($s);
        $c_length = count($this->nick_bg_array);
        $index = (($hashStr % $c_length) + $c_length) % $c_length + 1;
        
        return $this->nick_bg_array[$index] ?? $this->nick_bg_array[1];
    }
}