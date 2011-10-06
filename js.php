<?php
// Version 5

if (@$_GET['content_folder'] AND $folder = preg_replace('([^a-zA-Z0-9-_/])', '', $_GET['content_folder'])) {
	define('PAI_FOLDER_CONTENT', $folder);
}

require_once('load.php');

// $lastModifiedDate must be a GMT Unix Timestamp
// You can use gmmktime(...) to get such a timestamp
// getlastmod() also provides this kind of timestamp for the last
// modification date of the PHP file itself
function cacheHeaders($lastModifiedDate) {
  if ($lastModifiedDate) {
    if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $lastModifiedDate) {
      if (php_sapi_name()=='CGI') {
        header("Status: 304 Not Modified");
      } else {
        header("HTTP/1.0 304 Not Modified");
      }
      exit;
    } else {
      $gmtDate = gmdate("D, d M Y H:i:s \G\M\T",$lastModifiedDate);
      header('Last-Modified: '.$gmtDate);
      header("Cache-Control: max-age=86400");
      header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 86400)); 
    }
  }
}

// This function uses a static variable to track the most recent
// last modification time
function lastModificationTime($time=0) {
  static $last_mod ;
  if (!isset($last_mod) || $time > $last_mod) {
    $last_mod = $time ;
  }
  return $last_mod ;
}



switch($_GET['get']) {
case 'vars':
	$code = include('inc/jsvars.php');
	break;
case 'files':
	
	$code = '';
	
	foreach(pai_js_files() AS $file) {
		$file = PAI_FILEPATH_ROOT.$file;
		lastModificationTime(filemtime($file));
		$code .= file_get_contents($file)."\n";
	}

	cacheHeaders(lastModificationTime());

	break;
default:
	$code = '';
	break;
}



header("Content-type: text/javascript");


ob_end_clean();
ob_start("ob_gzhandler");
echo $code;

