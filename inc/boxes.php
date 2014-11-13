<?php

$pai_boxes = array();

function pai_define_box($name, $type, $options = null) {
  global $pai_boxes;

  if (!is_string($type)) {
    // pai_define_box({string}, {function})
    if (is_callable($type)) {
      $options = $type;
      $type = 'function';
    }

    // pai_define_box({string}, {array}, {function})
    if (is_array($type) && is_callable($options)) {
      $type['function'] = $options;
      $options = $type;
      $type = 'function';
    }
  }

  switch ($type) {
  case 'function':
    if (is_callable($options)) $options = array('function' => $options);
    break;
  case 'map':
    if (!is_array($options['map'])) {
      pai_trigger_error('PAI Error: `'.$fullpath.'` is not a dir', E_USER_ERROR, 1);
    }
    break;
  case 'dir':
    if (is_string($options)) $options = array('path' => $options);

    $fullpath = PAI_FILEPATH_CONTENT . $options['path'];
    if (!is_dir($fullpath)) {
      pai_trigger_error('PAI Error: `'.$fullpath.'` is not a dir', E_USER_ERROR, 1);
    }
    break;
  }

  $options['type'] = $type;

  $pai_boxes[$name] = $options;
}

function pai_box($name, $element = 'div') {
  global $pai_boxes;

  $options = @$pai_boxes[$name];
  if (!$options) {
    pai_trigger_error('PAI Error: `' . $name . '` box not defined', E_USER_WARNING, 1);
    return;
  }

  $content = pai_box_content($name);

  if ($element) {
    if (!is_string($element)) $element = 'div';
    $id = (isset($options['id']) ? $options['id'] : 'pai_box-'.$name);
    $content = sprintf('<%s id="%s">%s</%s>', $element, $id, $content, $element);
  }

  print $content;
}

function pai_box_content($name) {
  global $pai_boxes;

  if (isset($pai_boxes[$name])) $options = $pai_boxes[$name];
  else $options = array('type' => 'filter');

  $content = '';

  switch($options['type']) {
  case 'function':
    ob_start();
    if (is_string($options['function']) || is_array($options['function'])) {
      call_user_func($options['function']);
    } else {
      $options['function']();
    }
    $content = ob_get_clean();
    break;
  case 'map':
    $file = '';

    foreach((array) $options['map'] AS $f => $pages) {
			if (in_array(PAI_PAGE, $pages)) {
				$file = $f;
				break;
			}
		}

    $filepath = pai_box_get_filepath(
        $options['path']
      , array(
          $file
        , $file.'/'.(isset($options['index']) ? $options['index'] : 'index')
        , (isset($options['default']) ? $options['default'] : false)
        )
      , (isset($options['extensions']) ? $options['extensions'] : array('php', 'html'))
      );

    if ($filepath) {
      $content = pai_get_include($filepath);
    }
    break;
  case 'dir':
    $filepath = pai_box_get_filepath(
        $options['path']
      , array(
          PAI_PAGE
        , PAI_PAGE.'/'.(isset($options['index']) ? $options['index'] : 'index')
        , (isset($options['default']) ? $options['default'] : false)
        )
      , (isset($options['extensions']) ? $options['extensions'] : array('php', 'html'))
      );

    if ($filepath) {
      $content = pai_get_include($filepath);
    }
    break;
  }

  $content = pai_apply_filters('box-'.$name, $content, $name, $options);
  $content = pai_apply_filters('box', $content, $name, $options);

  return $content;
}

function pai_box_get_filepath($dir, $paths, $exts) {
  foreach($paths AS $path) {
    if (!$path) continue;

    foreach($exts AS $ext) {
      $file = PAI_FILEPATH_CONTENT
            . $dir
            . DIRECTORY_SEPARATOR
            . $path . '.' . $ext
            ;
      if (file_exists($file)) return $file;
    }
  }

  return null;
}
