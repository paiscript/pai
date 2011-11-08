// PAI v2.0.0
// 03.07.11


(function() {
	var toString = Object.prototype.toString,
		hop = Object.prototype.hasOwnProperty;
		
	function isPlainObject( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
			return false;
		}
		
		// Not own constructor property must be Object
		if ( obj.constructor
			&& !hop.call(obj, "constructor")
			&& !hop.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}
		
		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
	
		var key;
		for ( key in obj ) {}
		
		return key === undefined || hop.call( obj, key );
	};



	function merge() {
		// copy reference to target object
		var target = arguments[0] || {}, i = 1, length = arguments.length, options, name, src, copy;
	
		// Handle case when target is a string or something (possible in deep copy)
		if ( typeof target !== "object" && !Object.isFunction(target) ) {
			target = {};
		}
		
		// extend PAI itself if only one argument is passed
		if ( length === i ) {
			target = this;
			--i;
		}
	
		for ( ; i < length; i++ ) {
			// Only deal with non-null/undefined values
			if ( (options = arguments[ i ]) != null ) {
				// Extend the base object
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];
	
					// Prevent never-ending loop
					if ( target === copy ) {
						continue;
					}
	
					// Recurse if we're merging object literal values or arrays
					if ( copy && ( isPlainObject(copy) || Object.isArray(copy) ) ) {
						var clone = src && ( isPlainObject(src) || Object.isArray(src) ) ? src
							: Object.isArray(copy) ? [] : {};
	
						// Never move original objects, clone them
						target[ name ] = merge( clone, copy );
	
					// Don't bring in undefined values
					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}
	
		// Return the modified object
		return target;
	}
	
	Object['isPlainObject'] = isPlainObject;
	Object['merge'] = merge;

}());

(function(window) {
	var Element = window['Element'], 
		Object = window['Object'], 
		Prototype = window['Prototype'],
		Event = window['Event'],
		PAI = window['PAI'];
	
	if (!PAI['adapter']) { PAI['adapter'] = {}; }
	
	Object.extend(PAI['adapter'], {
		find: 		function(sel) { return Prototype['Selector']['select'](sel)[0]; },

		getAttribute:	Element['readAttribute'],
		html:			function(element, content) { 
			element = $(element);
			if (content.nodeType === 11) {
				element.update().appendChild(content);
			} else {
				element.update(content);
			}
		},
		scrollTo:		Element['scrollTo'],
		
//		each:			function(collection, iterator, context) { Prototype['Enumerable']['each'].call(collection, iterator, context); },

		isString: 		Object['isString'],
		toQueryString:	Object['toQueryString'],
		extend:			Object['merge'],
	
		addEvent: 		Event['on'],
		fireEvent: 		Event['fire'],
		preventDefault: 	function(event) { event.preventDefault(); },
		eventPrevented: 	function (event) {
			if (event.stopPropagation) {
				return event.defaultPrevented;
			} else {
				return !event.returnValue;
			}
		},


		formSerialize:	function(element) { return window['Form']['serialize'](element, {hash:true}); },
		toQueryParams:	function(str) { return str.toQueryParams(); },
	
	
		ajax: function(o) {
			return new window['Ajax']['Request'](o.url, {
				'parameters':	o.data,
				'onSuccess':	function(t) { return (o['success'] || Prototype['emptyFunction'])( t['response'+(o.dataType=='json'?'JSON':'Text')], t['statusText'], t); },
				'onException':	o.error,
				'onComplete':	o.complete
			} ); 
		}
	});

	document['observe']('dom:loaded', PAI['ready']);
}(window));
