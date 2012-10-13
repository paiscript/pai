<?php

function pai_content($name, $return = false, $div = true) {
	$conf = pai_conf('content', $name);
	
	if (is_string($conf)) { $conf = array('type' => $conf); }	
	if (!isset($conf['folder'])) { $conf['folder'] = $name; }
	
	$conf = pai_apply_filters('contentconf', $conf, $name);

	$content = '';
	
	$exclude = @$conf['exclude'];
	if ($exclude) {
		if (!is_array($exclude)) {
			$exclude = explode(',', $exclude);
		}
		$exclude = in_array(PAI_PAGE, $exclude);
	}
	
	if (!$exclude) {
		switch(@$conf['type']) {
		case 'pagevar':
			$content = @pai_pageinfo($conf['name']);
			break;
		case 'map':
			$file = false;
			foreach((array) @$conf['map'] AS $f => $pages) {
				if (in_array(PAI_PAGE, $pages)) {
					$file = $f;
					break;
				}
			}
			
			$content = pai_content_getFileContent($name, $conf, $file);
			
			break;
		case 'path':
			$content = pai_content_getFileContent($name, $conf, PAI_PAGE);
			break;
		
		case 'filter':
			break;
		
		}
	}
	
	$content = pai_apply_filters('content-'.$name, $content, $name, $conf);
	$content = pai_apply_filters('content', $content, $name, $conf);
	
	
	if ($div && !@$conf['id']) {
		$content = '<div id="pai_content-'.$name.'">'.$content.'</div>';
	}
	
	if ($return) {
		return $content;
	}
	print $content;
}

function pai_content_getFileContent($name, $conf, $page) {
	$file = pai_content_getFile($conf['folder'], $page, @$conf['extensions']);
	if (!$file) {
		$file = pai_content_getFile($conf['folder'], @$conf['default'], @$conf['extensions']);
		if (!$file && @$conf['default']) {
			return 'PAI Error: Could not find the default file for the content box '.$name.'.';
		}
	}

	if ($file) {
		return pai_get_include($file);
	}
	return null;
}

function pai_content_getFile($folders, $content, $extensions = null) {
	if (!$content) { return null; }
	if (!$extensions) { $extensions = array('php','html'); }
	
	if (!is_array($folders)) { $folders = array($folders); }
	
	foreach($folders AS $folder) {
		foreach($extensions AS $ext) {
			if (file_exists($file = PAI_FILEPATH_CONTENT.$folder.DIRECTORY_SEPARATOR.$content.'.'.$ext)) { return $file; }
			if (file_exists($file = PAI_FILEPATH_CONTENT.$folder.DIRECTORY_SEPARATOR.$content.DIRECTORY_SEPARATOR.pai_conf('url', 'rootElement').'.'.$ext)) { return $file; }
		}
	}
	
	return null;
}

function pai_get_include($__pai_file) {

	ob_start();
	include($__pai_file);
	$content = ob_get_clean();
	
	return $content;
}


function pai_js_files() {
	$conf = pai_conf('ajax');
	
	$files = array();
	
	$files[] = PAI_FOLDER.'/deps/HashHistory/HashHistory.js';
	$files[] = PAI_FOLDER.'/js-src/adapter.'.$conf['framework'].'.js';
	$files[] = PAI_FOLDER.'/js-src/pai.js';

	global $pai_plugins;
	foreach($pai_plugins AS $name => $plugin) {
		$path = PAI_FOLDER_PLUGINS.'/'.$name.'/';
		if (@$plugin['js-adapters']) {
			if ($plugin['js-adapters'][ $conf['framework'] ]) {
				$files[] = $path.$plugin['js-adapters'][ $conf['framework'] ];
			} 
			else {
				$files[] = $path.reset($plugin['js-adapters']);
			}
		}
		foreach((array) @$plugin['js'] AS $file) { 
			$files[] = $path.$file;
		}
	}
	
	$files = pai_apply_filters('jsfiles', $files);
	
	return $files;
}

function pai_scripts() {
	pai_trigger_error('pai_scripts() is deprecated. Use pai_footer() instead', E_USER_DEPRECATED, 1);
	pai_footer();
}

function pai_head() {
	if(pai_conf('expose_pai')) { 
		?><meta name="generator" content="PAI/<?php echo PAI_VERSION; ?>">
<?php 
	}
	
	?><script>(function(g){function p(){q.push(arguments)}var q=[];p.ready=function(){p._i(q)};g.PAI=p})(this);</script>
<?php
	
	pai_do_action('head');
}

function pai_footer() {

//	echo '<script>' . file_get_contents(PAI_FILEPATH.'js-src'.DIRECTORY_SEPARATOR.'inline.js') . '</script>';
	?>
	
<script>PAI.PAGE=<?php echo pai_json_encode(PAI_PAGE); ?>; PAI.LINK=<?php echo pai_json_encode(pai_link()); ?>;
<?php
	global $pai_js_options;
	if (count($pai_js_options)) {
		echo 'PAI("setOptions", '.pai_json_encode($pai_js_options).');';
	}
	pai_do_action('footerscript');
?>
</script>
<?php if (pai_conf('ajax', 'useSourceFiles')): ?>
<script src="<?php echo PAI_PATH.PAI_FOLDER; ?>/js.php?get=vars&content_folder=<?php echo PAI_FOLDER_CONTENT?>" defer></script>
<?php foreach(pai_js_files() AS $file): ?>
<script src="<?php echo PAI_PATH.$file; ?>" defer></script>
<?php endforeach;
else: ?>
<script src="<?php echo PAI_PATH.PAI_FOLDER; ?>/js.php?get=vars&content_folder=<?php echo PAI_FOLDER_CONTENT?>" defer></script>
<script src="<?php echo PAI_PATH.PAI_FOLDER; ?>/js.php?get=files" defer></script>
<?php endif; 
	
//	pai_do_action('scripts'); // backward
	pai_do_action('footer');
}

function pai_conf() {
	static $conf;
	if (!$conf) {
		$conf = pai_json_decode_file(PAI_FILEPATH.'pai.json', true);

		if (is_file(PAI_FILEPATH_CONTENT.'pai.json')) {
			$conf = pai_deep_merge($conf, pai_json_decode_file(PAI_FILEPATH_CONTENT.'pai.json', true));
		}
		
		if (!$conf) {
			pai_trigger_error('Failed to parse configuration file. Check your syntax.', E_USER_ERROR, 0);
		}
		

		if (!is_string($conf['url']['path'])) {
			$dr = realpath($_SERVER['DOCUMENT_ROOT']);
			if (substr($dr, -1) == DIRECTORY_SEPARATOR) { $dr = substr($dr, 0, -1); }
			$conf['url']['path'] = substr(dirname(PAI_FILEPATH), strlen($dr)).'/';
		}
		
		
		$conf = pai_apply_filters('config', $conf);
		
	}
	
	$ret = $conf;
	$args = func_get_args();
	foreach($args AS $arg) {
		if (!isset($ret[$arg])) {
			pai_trigger_error('Undefined config: '.implode('=>', $args), E_USER_NOTICE);
			return null;
		}
		$ret = $ret[$arg];
	}
	return $ret;
}

function pai_link($page = null, $parameters = array(), $noPath = false) {
	$get = $_GET;
	array_walk($get, create_function('&$value, $key', 'if (substr($key, 0, 4) == "pai_") { $value = null; }'));
	$get = array_filter($get);
	$q = http_build_query(array_merge($get, (array) $parameters)); 
	
	if ($page === null) { $page = PAI_PAGE; }
	if ($page == pai_conf('url', 'rootElement')) { $page = ''; }

	$link = '';
	if (!$noPath) { $link .= PAI_PATH; }
	if (pai_conf('language', 'status')) { $link .= PAI_LANGUAGE.'/'; }
	$link .= $page;
	if ($q) { $link .= '?'.$q; }
	return $link;
}

function pai_title($return = false) {
	$title = pai_pageInfo('title');
	
	$title = pai_apply_filters('title', $title);
	
	if ($return) {
		return $title;
	}
	echo $title;
}

function pai_pageInfo($key = null, $page = PAI_PAGE) {
	static $info;
	
	// Load pages file
	if (!$info) {
		$info = pai_json_decode_file(PAI_FILEPATH_CONTENT.'pages.json');
		
		foreach($info AS $p => $pageinfo) {
			foreach($pageinfo AS $k => $value) {
				$skey = explode('-', $k);
				if (count($skey) > 1) {
					
					$v = $info->$p;
					$ref =& $v;
					foreach($skey AS $a) {
						@$ref->$a = (object) $ref->$a;
						$ref =& $ref->$a;
					}
					$ref = $value;
					unset($pageinfo->$k);
				}
			}
		}
		
		$info = pai_apply_filters('pageinfo', $info);
	}
	
	// gjør $key til array for dyp søk
	if ($key) {
		if (!is_array($key)) {
			$key = array($key);
		}
	}

	// Hvis man vil ha alle verdier for alle sider
	if (!$page) {
		
		// Hvis ikke $key, returner hele pages filen
		if (!$key) {
			return $info;
		}
		
		// henter spesifik verdi fra alle sider
		$result = (object) array();
		foreach($info AS $page => $settings) {
			$ret = $settings;
			foreach($key AS $k) {
				if (isset($ret->$k)) {
					$ret = $ret->$k;
				} 
				else {
					unset($ret);
					break;
				}
			}
			if (isset($ret)) {
				$result->$page = $ret;
			}
		}
		return $result;
	}
	
	if (!isset($info->$page)) {
		pai_trigger_error("Undefined page <i>$page</i>", E_USER_NOTICE);
		return null;
	}
	
	if ($key) {
		$ret = $info->$page;
		foreach($key AS $k) {
			if (!isset($ret->$k)) {
				pai_trigger_error("Undefined key ".implode("=>", $key)." for page $page", E_USER_NOTICE);
				return null;
			}
			$ret = $ret->$k;
		}
		return $ret;
	}
	return $info->$page;
}

function pai_page($path) {

	$path = strtolower(preg_replace(pai_conf('url', 'pathStripRegexp'), "", $path));
	if (!$path) { $path = pai_conf('url', 'rootElement'); }
	if (substr($path, -1) == '/') { $path = substr($path, 0, -1); }

	$path = pai_apply_filters('page', $path);


	define('PAI_PAGE', $path);
	define('PAI_SELF', pai_link());
	
	
	return $path;
}

$pai_js_options = array();
function pai_set_js_options($key, $value = null) {
	global $pai_js_options;
	if (!is_array($key)) {
		$key = explode('-', $key);
	}
	
	$item = &$pai_js_options;
	$array = false;
	foreach($key AS $k) {
		if (substr($k, -2) == '[]') {
			$k = substr($k, 0, -2);
			$item = &$item[$k][];
		}
		else {
			$item[$k] = (array) @$item[$k];
			$item = &$item[$k];
		}
	}
	$item = $value;
}


function pai_trigger_error($message, $level/* = E_USER_NOTICE*/, $tracelength = 1) {
    //Get the caller of the calling function and details about it

	if ($tracelength) {
    	$callee = debug_backtrace();
		$callee = $callee[$tracelength];

    	//Trigger appropriate error
		if (ini_get('html_errors')) {
			$message = '<b>PAI:</b> '.$message.' in <b>'.$callee['file'].'</b> on line <b>'.$callee['line'].'</b>';
		}
		else {
			$message = 'PAI: '.strip_tags($message).' in '.$callee['file'].' on line '.$callee['line'];
		}
		
	}
	
	trigger_error($message, $level);
}

function pai_redirect($url, $time = 0, $external = false, $code = 302) {
	
	$time = (int) $time;
	$code = (int) $code;
	
	if (PAI_AJAX) {
		global $pai_ajax_response;
		$pai_ajax_response['redirect'] = array('url' => $url, 'time' => $time, 'external' => (bool) $external);
	}
	else {
		if ($time) {
			header("Refresh: $time; url=$url", false, $code);
		}
		else {
			header("Location: $url", false, $code);
			ob_end_clean();
			?><!DOCTYPE html>
<title>Moved</title>
<meta http-equiv="Refresh" content="<?php echo $time; ?>; url=<?php echo $url; ?>" />
<h1>Moved</h1>
<p>This page has moved to <a href="<?php echo $url; ?>"><?php echo $url; ?></a>.</p>
<?php
		}
		exit();
	}
}
