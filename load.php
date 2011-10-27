<?php // 26.06.11

if (defined('PAI_VERSION')) { echo 'PAI Error: Multiple loadings load.php'; exit(); }

define('PAI_VERSION', '2.0.1-pre');

if (!defined('PAI_AJAX')) { define('PAI_AJAX', false); }

if (!defined('PAI_FOLDER')) { define('PAI_FOLDER', 'pai'); }
if (!defined('PAI_FOLDER_CONTENT')) { define('PAI_FOLDER_CONTENT', 'content'); }
if (!defined('PAI_FOLDER_PLUGINS')) { define('PAI_FOLDER_PLUGINS', 'pai_plugins'); }

if (!defined('PAI_FILEPATH')) { define('PAI_FILEPATH', dirname(__FILE__).DIRECTORY_SEPARATOR); }
if (!defined('PAI_FILEPATH_ROOT')) { define('PAI_FILEPATH_ROOT', dirname(PAI_FILEPATH).DIRECTORY_SEPARATOR); }
if (!defined('PAI_FILEPATH_PLUGINS')) { define('PAI_FILEPATH_PLUGINS', PAI_FILEPATH_ROOT.PAI_FOLDER_PLUGINS.DIRECTORY_SEPARATOR); }
if (!defined('PAI_FILEPATH_CONTENT')) { define('PAI_FILEPATH_CONTENT', PAI_FILEPATH_ROOT.PAI_FOLDER_CONTENT.DIRECTORY_SEPARATOR); }



require_once(PAI_FILEPATH.'inc'.DIRECTORY_SEPARATOR.'functions.php');
require_once(PAI_FILEPATH.'inc'.DIRECTORY_SEPARATOR.'pai.php');
require_once(PAI_FILEPATH.'inc'.DIRECTORY_SEPARATOR.'plugin.php');

if (!class_exists('Services_JSON')) {
	require_once(PAI_FILEPATH.'inc'.DIRECTORY_SEPARATOR.'JSON/JSON.php');
}
$pai_json = new Services_JSON();


if (file_exists($file = PAI_FILEPATH_CONTENT.'load.php')) { include_once($file); }

if (!defined('PAI_PATH')) { define('PAI_PATH', pai_conf('url', 'path')); }


$pai_plugins = array();
foreach(pai_conf('plugins') AS $name => $conf) {
	if (is_bool($conf)) {
		$conf = array('disabled' => !$conf);
	}

	if (isset($conf['status']) && !isset($conf['disabled'])) { $conf['disabled'] = !$conf['status']; }
	if (@$conf['disabled']) { continue; }
	
	$path = PAI_FILEPATH_PLUGINS.$name.DIRECTORY_SEPARATOR;

	$package = pai_json_decode_file($path.'package.json', true);

	if (isset($package['php']) && is_string($package['php'])) { $package['php'] = array($package['php']); }
	if (isset($package['js' ]) && is_string($package['js' ])) { $package['js' ] = array($package['js' ]); }
	
	$package['conf'] = $conf; 
	$pai_plugins[$name] = $package;
	
	if (isset($package['php'])) {
		foreach((array) $package['php'] AS $file) {
			include($path.$file);
		}
	}
}

if (pai_conf('expose_pai')) {
	$poweredBy = 'PAI/'.PAI_VERSION;
	if (ini_get('expose_php')) {
		$poweredBy = 'PHP/'.PHP_VERSION.' '.$poweredBy;
	}
	header("X-Powered-By: $poweredBy", true);
}

