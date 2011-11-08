// PAI v2.0.0
// 03.07.11

// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {

  Function.prototype.bind = function (oThis) {

    if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;

  };

}


(function (PAI, jQuery) {
	if (!PAI['adapter']) { PAI['adapter'] = {}; }
	
	function eventHandler(event) {
		var data = event['data'], elm;
		if (data && data.selector) {
			elm = jQuery(event['target'])['closest'](data.selector)['get'](0);
			if (elm) {
				data.handler(event, elm)
			}
		}
	}
	
	
	jQuery.extend(PAI['adapter'], {
		"find": 		function(sel) { return jQuery(sel)[0]; },

		"getAttribute":	jQuery['attr'],
		"html":			function(e, c) { jQuery('#'+e)['html'](c); },
		"scrollTo":		function(element) { var pos = jQuery(element)['offset'](); window.scrollTo(pos['left'], pos['top']); }, // From prototypejs
		

		"isString": 		function(obj) { return Object.prototype.toString.call(obj) === '[object String]'; },
		"toQueryString":	jQuery['param'],
		"extend":			jQuery['extend'],
		
//  		"each":		function(collection, iterator, context) { jQuery['each'](collection, function(index, value) { iterator.call(context, value, index); }); },

	
		"addEvent": 		function(elm, eventName, selector, handler) {
			if (arguments.length === 3) {
				jQuery['event']['add'](elm, eventName, selector);
			} else {
				jQuery['event']['add'](elm, eventName, eventHandler, {selector: selector, handler: handler});
			}
		},
		"fireEvent": 		function(element, eventName, data) {
			return jQuery['event']['trigger'](eventName, data, element);
		},
		"preventDefault": 	function(event) { event.preventDefault(); },
		"eventPrevented": 	function (event) { return event.isDefaultPrevented(); },


		"formSerialize":	function(element) { var a = jQuery(element)['serializeArray'](), l=a.length, o = {}; for(var i=0; i<l; i++) { o[a[i].name] = a[i].value; } return o; },
		"toQueryParams":	function(string) { var a = string.split('&'), l = a.length, o = { }, b; for(var i=0; i<l;i++) { b = a[i].split('=', 2); o[b[0]] = b[1]; } return 0; },
	
	
		"ajax": jQuery['ajax'] // function(o) { return jQuery.ajax(o); }
	});

	jQuery(PAI['ready']);

}(PAI, jQuery));
