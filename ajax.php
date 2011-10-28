<?php // 26.06.11

define('PAI_AJAX', true);

$pai_ajax_response = array();

require(dirname(__FILE__).DIRECTORY_SEPARATOR.'load.php');

if (isset($_GET['action'])) {
	pai_do_action('ajax:' . $_GET['action']);
}

if (isset($_GET['page'])) {
	$GET = $_GET;

	$url = parse_url($_GET['page']);
	$_GET = array();
	parse_str(@$url['query'], $_GET);

	pai_page($url['path']);

	$pai_ajax_response['page'] = PAI_PAGE;

	$content = array();

	if (isset($GET['content'])) {
		$name = $GET['content'];
		$info = @pai_conf('content', $name);
		if ($info) {
			$content[$name] = pai_content($name, true, false);
		}
	}
	else {
		foreach(pai_conf('content') AS $name => $info) {
			if (isset($info['interval']) && !@$info['interval']['pageChange']) { continue; }
			$content[$name] = pai_content($name, true, false);
		}

		$pai_ajax_response['title'] = pai_title(true);
	}
	
	$pai_ajax_response['content'] = $content;
}

header("Content-type: application/json; charset=utf-8");


if (pai_conf('charset') !== 'utf-8') { pai_utf_prepare($pai_ajax_response); }

echo json_encode($pai_ajax_response);
