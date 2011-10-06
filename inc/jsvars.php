<?php

$vars = array(
	'clickEventName' => pai_conf('ajax', 'clickEventName'),
	'resetScroll' => pai_conf('ajax', 'resetScroll'),
	'content' => pai_conf('content'),
	'plugins' => pai_conf('plugins'),
	'rootElement' => pai_conf('url', 'rootElement'),
	'paiFolder' => PAI_FOLDER,
	'pageInfo' => pai_pageInfo(null, null),
	'ajaxEndpoint' => pai_conf('ajax', 'endpoint'),
);
$vars = pai_apply_filters('jsvars', $vars);

$content = 'PAI("setOptions", '.pai_json_encode($vars, JSON_FORCE_OBJECT).');
PAI.PATH='.pai_json_encode(PAI_PATH).';';


return $content;
