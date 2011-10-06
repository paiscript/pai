(function (window) {
	var que = [], 
		ready = [], 
		PAI = {
			'push': function() {
				que.push(arguments);
			},

			'init': function () {
				PAI['_init'](que, ready);
			},

			'ready': function (cb) {
				ready.push(cb);
			}
		};
	
	window['PAI'] = PAI;
	
}(this));
//(function(d){var a=[],b=[],c={push:function(){a.push(arguments)},init:function(){c._init(a,b)},ready:function(a){b.push(a)}};d.PAI=c})(this);




/*jslint browser: false, confusion: false, sloppy: true, sub: true, plusplus: false, maxerr: 50, indent: 4 */
/*properties
    PAI, _i, ready
*/
(function (window) {
	var que = [];
	function PAI() {
		que.push(arguments);
	}
	PAI['ready'] = function () {
		PAI['_i'](que);
	};
	window['PAI'] = PAI;
}(this));
//(function(g){function p(){q.push(arguments)}var q=[];p.ready=function(){p._i(q)};g.PAI=p})(this);
