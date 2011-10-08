<?php // 26.06.11

require(dirname(__FILE__).DIRECTORY_SEPARATOR.'load.php');


if (isset($_GET['_escaped_fragment_']) && pai_conf('url', 'googleAjaxCrawling')) {
	$path = $_GET['_escaped_fragment_'];
} 
else {
	$path = @$_GET[pai_conf('url', 'paramName')];
}

pai_page($path);



if (pai_conf('language', 'status')) {
	session_start();
	$lang = $_REQUEST[pai_conf('language', 'paramName')];
	if (!is_dir(PAI_FILEPATH_CONTENT.pai_conf('language', 'folder').DIRECTORY_SEPARATOR.$lang) OR !is_file(PAI_FILEPATH_CONTENT.pai_conf('language', 'folder').DIRECTORY_SEPARATOR.$lang.'.ini')) {
		$lang = pai_conf('language', 'default');
	}
	define('PAI_LANGUAGE', $lang);
	$_SESSION[pai_conf('language', 'paramName')] = $lang;
	
	if (!$_GET[pai_conf('language', 'paramName')]) {
		//header("Location: ".PAI_PATH.PAI_LANGUAGE.'/');
		header("Location: ".PAI_link());
		exit();
	}
}



echo pai_get_include(PAI_FILEPATH_CONTENT.'site.php');
