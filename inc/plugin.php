<?php

$pai_filters = array();

function pai_add_filter($tag, $function, $priority = 10) {
	global $pai_filters;

	if (!is_callable($function, false, $callable_name)) {
		return pai_trigger_error("pai_add_filter expects parameter 1 to be a valid callback, function '$callable_name' not found or invalid function name", E_USER_WARNING, 1);
	}
	
	$pai_filters[$tag][$priority][] = $function;
}

function pai_add_action($tag, $function, $priority = 10) {
	pai_add_filter($tag, $function, $priority);
}


function pai_do_action($tag) {
	global $pai_filters;

	if (!isset($pai_filters[$tag])) {
		return;
	}
	
	reset( $pai_filters[ $tag ] );
	
	$args = array_slice(func_get_args(), 1);
	
	do {
		foreach( (array) current($pai_filters[$tag]) AS $function ) {
			call_user_func_array($function, $args);
		}
	} while ( next($pai_filters[$tag]) !== false );

}

function pai_apply_filters($tag, $value) {
	global $pai_filters;

	if (!isset($pai_filters[$tag])) {
		return $value;
	}
	
	reset( $pai_filters[ $tag ] );
	
	$args = array_slice(func_get_args(), 1);
	
	do {
		foreach( (array) current($pai_filters[$tag]) AS $function ) {
			$args[0] = $value;
			$value = call_user_func_array($function, $args);
		}
	} while ( next($pai_filters[$tag]) !== false );

	return $value;
}

function pai_add_ajax_action($tag, $function, $priority = 10) {
	pai_add_filter('ajax:' . $tag, $function, $priority);
}
