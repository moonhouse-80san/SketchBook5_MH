<?php
/**
 * 다운로드 횟수 카운터 (SketchBook5_MH 스킨 전용)
 * 위치: /modules/board/skins/SketchBook5_MH/down_count.php
 * GET  ?srl=문서번호 : 현재 횟수 조회
 * POST srl=문서번호  : 횟수 +1 (CSRF 검증)
 */
require dirname(__DIR__, 4) . '/common/autoload.php';
Context::init();

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$documentSrl = (int)($_REQUEST['srl'] ?? 0);
$oDocument = $documentSrl > 0 ? DocumentModel::getDocument($documentSrl, false, false, false) : null;
if (!$oDocument || !$oDocument->isExists()) {
  http_response_code(404);
  exit('{"count":0}');
}

$dir = RX_BASEDIR . 'files/mh_downcount/';
if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
  http_response_code(500);
  exit('{"count":0}');
}

$fp = fopen($dir . $documentSrl . '.txt', 'c+');
if (!$fp || !flock($fp, LOCK_EX)) {
  http_response_code(500);
  exit('{"count":0}');
}
$count = (int)trim((string)stream_get_contents($fp));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!Rhymix\Framework\Security::checkCSRF()) {
    flock($fp, LOCK_UN);
    fclose($fp);
    http_response_code(403);
    exit('{"count":' . $count . '}');
  }
  // 같은 접속자의 5초 내 중복 클릭은 1회로 처리
  $sessionKey = 'mh_dc_' . $documentSrl;
  if (time() - (int)($_SESSION[$sessionKey] ?? 0) >= 5) {
    $_SESSION[$sessionKey] = time();
    $count++;
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, (string)$count);
  }
}

flock($fp, LOCK_UN);
fclose($fp);
echo '{"count":' . $count . '}';
