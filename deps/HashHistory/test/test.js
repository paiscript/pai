		var $ = function(id) { return document.getElementById(id); }
		
		function log() {
			var type = arguments[0];
			arguments[0] = '';
			
			$('log_'+type).innerHTML += '<br>'+Array.prototype.join.call(arguments, ' ');
		}
		
		var push_i = 0, change_i = 0;
		
		HashHistory
			({blank: 'HashHistory.js', frequency: 50, usepushstate: false, shebang: true})
			(function all(page, hash) {
				log(this.type, '>>', page, hash)
			}, 'all')
			(function push(page, hash) {
				log(this.type, '>>', page, hash)
			}, 'push')
			(function pagepush(page, hash) {
				log(this.type, '>>', page)
			}, 'pagepush')
			(function hashpush(page, hash) {
				log(this.type, '>>', hash)
			}, 'hashpush')
			(function change(page, hash) {
				log(this.type, '>>', page, hash)
			}, 'change')
			(function pagechange(page, hash) {
				log(this.type, '>>', page)
			}, 'pagechange')
			(function hashchange(page, hash) {
				log(this.type, '>>', hash)
			}, 'hashchange')
			
			(function all(page, hash, type) {
				if (page.substr(8) != change_i) {
//					log('default', '<b>Error change:</b>', page, page.substr(8), '!=', change_i);
					change_i = Number(page.substr(8));
				}
				change_i++;
				
				$('current-page').innerHTML = HashHistory;
				$('current-hash').innerHTML = HashHistory('#');
//				log('default', '>> change event', page, hash, type)
			})
			;
		
		
		

		window.onload = function() {
			HashHistory(true);
			$('current-page').innerHTML = HashHistory;
			$('current-hash').innerHTML = HashHistory('#');
			
			
//			HashHistory('A');
//			setTimeout(function() { HashHistory('B'); }, 1000);
//			setTimeout(function() { HashHistory('C'); }, 2000);
			
		
			var i = 0;
			var intId = setInterval(function() {
				//HashHistory("rand-"+Math.random());
				HashHistory("?counter-"+(++i), String(i));
				HashHistory("?counter-"+(++i), String(i));
				//HashHistory("?counter-"+(i++));
			
				if (i >= 10) {
					clearInterval(intId);
				}
			}, 1);

		}