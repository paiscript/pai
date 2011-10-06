<?php

// http://no2.php.net/manual/en/function.array-merge.php#54946

function pai_deep_merge() {
	switch( func_num_args() ) {
		case 0 : return false; break;
		case 1 : return func_get_arg(0); break;
		case 2 :
			$args = func_get_args();
			$args[2] = array();
			$isObject = false;
			if (is_object($args[0])) {
				$args[0] = get_object_vars($args[0]);
			}
			if (is_object($args[1])) {
				$args[1] = get_object_vars($args[1]);
				$isObject = true;
			}

			if( is_array($args[0]) AND is_array($args[1]) ) {
				foreach( array_unique(array_merge(array_keys($args[0]),array_keys($args[1]))) AS $key ) {
					if( is_string($key) and is_array(@$args[0][$key]) and is_array(@$args[1][$key]) )
						$args[2][$key] = pai_deep_merge( $args[0][$key], $args[1][$key] );
					elseif( is_string($key) and isset($args[0][$key]) and isset($args[1][$key]) )
						$args[2][$key] = $args[1][$key];
					elseif( is_integer($key) and isset($args[0][$key]) and isset($args[1][$key]) ) {
						$args[2][] = $args[0][$key]; $args[2][] = $args[1][$key]; }
					elseif( is_integer($key) and isset($args[0][$key]) )
						$args[2][] = $args[0][$key];
					elseif( is_integer($key) and isset($args[1][$key]) )
						$args[2][] = $args[1][$key];
					elseif( ! isset($args[1][$key]) )
						$args[2][$key] = $args[0][$key];
					elseif( ! isset($args[0][$key]) )
						$args[2][$key] = $args[1][$key];
				}
				
				if ($isObject) {
					$args[2] = (object) $args[2];
				}
				
				return $args[2];
			}
			else {
				return $args[1]; 
			}
			break;
		default:
			$args = func_get_args();
			$args[1] = pai_deep_merge( $args[0], $args[1] );
			array_shift( $args );
			return call_user_func_array( 'pai_deep_merge', $args );
			break;
	}
}

/*
if (!function_exists('json_decode_file')) {
	function json_decode_file($file, $assoc = false, $depth = 512, $options = 0, $use_include_path = false, $context = null, $offset = -1, $maxlen = null) {
		if ($maxlen === null) {
			$file = file_get_contents($file, $use_include_path, $context, $offset);
		}
		else {
			$file = file_get_contents($file, $use_include_path, $context, $offset, $maxlen);
		}

		if ($options) {
			return json_decode($file, $assoc, $depth, $options);
		} 
		else {
			return json_decode($file, $assoc, $depth);
		}
	}
}
*/

function pai_utf_prepare(&$array) {
	foreach($array AS $key => &$value) {
		if (is_array($value)) {
			pai_utf_prepare($value);
		}
		else {
			$value = utf8_encode($value);
		}
	}
}

function pai_normalize_url($url) {
	$url = (string) $url;
	
	$c = parse_url( (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . PAI_PATH . PAI_PAGE . '?' . $_SERVER['QUERY_STRING']);
	
	if (substr($url, 0, strlen($c['scheme'])) === $c['scheme']) {
		return $url;
	} else if (substr($url, 0, 2) === '//') {
		return $c['scheme'] . $url;
	} else if ($url[0] === '/') {
		return $c['scheme'] . '//' . $c['host'] . $url;
	} else if ($url[0] === '?') {
		return $c['scheme'] . '//' . $c['host'] . $c['path'] . $url;
	} else if ($url[0] === '#') {
		return $c['scheme'] . '//' . $c['host'] . $c['path'] . ($c['query'] ? '?'.$c['query'] : '') . $url;
	} else if (substr($url, 0, 2) === './') {
		$path = $c['path'];
		$path = substr($path, 0, strrpos($path, '/'));
		return $c['scheme'] . '//' . $c['host'] . $path . substr($url, 1);
	} else {
		$path = $c['path'];
		$path = substr($path, 0, strrpos($path, '/'));
		return $c['scheme'] . '//' . $c['host'] . $path . '/' . $url;
	}
}


function pai_json_decode_file($file, $assoc = false) {
	global $pai_json;
	if (!is_file($file)) {
		pai_trigger_error('Cant find json file '.$file.'.', E_USER_ERROR, 1);
	}
	$info = @json_decode(file_get_contents($file), $assoc);
	
	if (is_null($info)) {
		pai_trigger_error('Failed to parse json file '.$file.'. Check your syntax.', E_USER_ERROR, 1);
	}
	
	return $info;
}


function pai_json_encode($value, $options = 0) {
	global $pai_json;
	return $pai_json->encode($value);
}



