/*jshint sub: true, plusplus: false, maxerr: 50, eqeqeq: true, curly: true, forin: true, immed: true, newcap: true, noarg: true, noempty: true, onevar: true, undef: true, white: true */
/*global PAI: true, innerShiv: false */

(function (win) {
  var adpt, baselink,

    hh = win['HashHistory'],
    loc = win.location,
    doc = win.document,

    options = {},
    regexp_skip = /(^|\s)pai_skip(\s|$)/,
    regexp_ajaxify = /(^|\s)pai_ajaxify(\s|$)/,

    skipNextHHCb = false,

    listeners = {},

    filters = {};

  /**
   *  @param {Object} obj
   *  @param {number} start
   *  @param {number=} end
   *  @return {Array}
  **/
  function slice(obj, start, end) {
    return Array.prototype.slice.call(obj, start, end || obj.length);
  }

  function PAI(arg) {
    if (adpt['isString'](arg) && PAI[arg]) {
      PAI[arg].apply(PAI, slice(arguments, 1));
    } else if (typeof arg === 'function') {
      arg();
    }
  }

  PAI['skip'] = function (element) {
    element['PAI_AJAXIFY'] = false;
  };
  PAI['ajaxify'] = function (element) {
    element['PAI_AJAXIFY'] = true;
  };

  PAI['setOptions'] = function (opt) {
    options = adpt['extend'](true, options, opt);
  };
  PAI['getOptions'] = function () {
    return options;
  };

  PAI['on'] = PAI['addListener'] = function (eventName, handle) {
    if (!listeners[eventName]) {
      listeners[eventName] = [];
    }
    listeners[eventName].push(handle);
  };

  PAI['addFilter'] = function (tag, handle, priority) {
    priority = priority || 10;

    if (!filters[tag]) {
      filters[tag] = [];
    }
    if (!filters[tag][priority]) {
      filters[tag][priority] = [];
    }
    filters[tag][priority].push(handle);
  };

  // From prototypejs
  // https://github.com/sstephenson/prototype/blob/1fb9728/src/lang/string.js#L332
  var extractAndStripScripts = (function () {
    var ScriptFragment = '<script[^>]*>([\\S\\s]*?)<\/script>';
      matchAll = new RegExp(ScriptFragment, 'img'),
      matchOne = new RegExp(ScriptFragment, 'im');

    return function (code, scripts) {
      code = code || '';
      scripts = scripts || [];

      var match, result = '', lastIndex = 0;
      while ((match = matchAll.exec(code)) !== null) {
        result += code.substring(lastIndex, match.index);
        lastIndex = matchAll.lastIndex;
        scripts.push(match[1]);
      }
      result += code.substring(lastIndex);
      return result;
      };
    }());



  /**
   *  @param {string} eventName
   *  @param {...} args
  **/
  function emit(eventName, args) {
    var i, l;

    args = slice(arguments, 1);

    if (listeners[eventName]) {

      for (i = 0, l = listeners[eventName].length; i < l; i++) {
        listeners[eventName][i].apply(PAI, args);
      }
    }
    adpt['fireEvent'](doc, 'pai:' + eventName, args);
  }

  PAI['emit'] = emit;


  /**
   *  @param {string} tag
   *  @param {*} value
   *  @param {...*} args
  **/
  function applyFilter(tag, value, args) {
    if (!filters[tag]) {
      return value;
    }

    var i, l, j, m;

    args = slice(arguments, 1);

    for (i = 0, l = filters[tag].length; i < l; i++) {
      if (filters[tag][i]) {
        for (j = 0, m = filters[tag][i].length; j < m; j++) {
          args[0] = value;
          value = filters[tag][i][j].apply(PAI, args);
        }
      }
    }

    return value;
  }


  /**
   *  @param {string=} page
  **/
  function pageInfo(page) {
    return options['pageInfo'][page || PAI['PAGE']];
  }


  function loadScript(src, cb) {
    function onload() {
      if (cb) {
        cb();
        cb = null;
      }
    }

    var script, b;

    script = doc.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
      script.src = src;
    script.onreadystatechange = function onreadystatechange() {
      if (this.readyState === 'loaded' || this.readyState === 'complete') {
        onload();
      }
    };
    script.onload = onload;
      b = doc.getElementsByTagName('script')[0];
    b.parentNode.insertBefore(script, b);

    script = b = null;
  }


  function normalizeUrl(url) {
    var path;
    url = String(url);

    if (url.substr(0, loc.protocol.length) === loc.protocol) {
      return url;
    } else if (url.substr(0, 2) === '//') {
      return loc.protocol + url;
    } else if (url.charAt(0) === '/') {
      return loc.protocol + '//' + loc.host + url;
    } else if (url.charAt(0) === '?') {
      return loc.protocol + '//' + loc.host + loc.pathname + url;
    } else if (url.charAt(0) === '#') {
      return loc.protocol + '//' + loc.host + loc.pathname + loc.search + url;
    } else if (url.substr(0, 2) === './') {
      path = loc.pathname;
      path = path.substr(0, path.lastIndexOf('/'));
      return loc.protocol + '//' + loc.host + path + url.substr(1);
    } else {
      path = loc.pathname;
      path = path.substr(0, path.lastIndexOf('/'));
      return loc.protocol + '//' + loc.host + path + '/' + url;
    }
  }

  function checkUrl(url) {
    url = normalizeUrl(url);
    if (url.substr(0, baselink.length) === baselink) {
      url = url.substr(baselink.length);
      if (url.substr(url.length - 1) === '/') {
        url = url.substr(0, url.length - 1);
      }
      return url;
    }

    return null;
  }

  function checkElement(element) {
    var a = element.nodeName, ret = false;
    if (a === 'A' || a === 'FORM') {
      ret = true;

      if (element['PAI_AJAXIFY'] === false) {
        ret = false;
      } else if (element['PAI_AJAXIFY'] === true) {
        ret = true;
      } else {
        // Has className
        a = element.className;
        if (a.length > 0) {
          // pai_skip
          if (a === 'pai_skip' || regexp_skip.test(a)) {
            element['pai_skip'] = true;
            ret = false;
          } else if (a === 'pai_ajaxify' || regexp_ajaxify.test(a)) { // pai_ajaxify
            element['pai_ajaxify'] = true;
            ret = true;
          }
        }

      }
    }

    if (ret) {
      a = element.nodeName === 'FORM' ? 'action' : 'href';
      ret = element[a];

      if (!adpt['isString'](ret)) {
        ret = adpt['getAttribute'](element, a);
      }
      ret = checkUrl(ret);
    }

    return applyFilter('checkElement', ret, element);
  }

  function getContentElement(name) {
    var elm = ((options['content'][name] && options['content'][name]['id']) || 'pai_content-' + name);
    return applyFilter('contentElement', elm, name);
  }

  function ajax_success(res) {
    var i, name, elm, content, scripts = [];

    if (res['redirect']) {
      PAI['redirect'](res['redirect']['url'], res['redirect']['time'], res['redirect']['external']);
    }

    if (res['content']) {
      for (name in res['content']) {
        if (res['content'].hasOwnProperty(name)) {
          elm = getContentElement(name);

          content = res['content'][name] || '';

          // push scripts to end of scripts array
          content = extractAndStripScripts(content, scripts);

          content = applyFilter('content', content, name);
          content = applyFilter('content-' + name, content, name);

          adpt['html'](elm, content);


          emit('contentupdate-' + name, name, elm, res);
          emit('contentupdate', name, elm, res);
        }
      }
    }

    if (res['title']) {
      doc.title = applyFilter('title', res['title'], res.page);
    }


    for(i = 0; i < scripts.length; i++) {
      (function(script) {
        win.setTimeout(function() {
          eval(script);
        }, 10);
      }(scripts[i]));
    }
  }

  function page_ajax_success(res) {
    ajax_success(res);

    if (options['resetScroll']) {
      win.scroll(0, 0);
    }

    var elm = String(hh.hash);
    if (elm) {
      elm = adpt['find']('#' + elm + ', [name="' + elm + '"]');
      if (elm) {
        win.setTimeout(function () {
          adpt['scrollTo'](elm);
        }, 10);
      }
    }

    emit('pageload', res);
    emit('page-' + res.page, res);
  }

  /**
   *  @param {string} uri
   *  @param {string|boolean=} data
  **/
  function showPage(uri, data) {

    var i, type, page;

    type = (data && data !== true) ? 'POST' : 'GET';

    hh(uri);

    if (!uri) {
      uri = options['rootElement'];
    }

    if (uri.match('\\#')) {
      i = uri.indexOf('#');
      page = uri.substr(0, i + 1);
    } else {
      page = uri;
    }

    i = page.indexOf('?');
    if (i !== -1) {
      page = page.substr(0, i);
    }

    PAI['PAGE'] = page;
    PAI['LINK'] = PAI['PATH'] + uri;

    if (!options['pageInfo'][page]) {
      options['pageInfo'][page] = {};
    }

//    adpt['fireEvent'](doc, 'pai:showpage', {'page': page, 'data': data});

    adpt['ajax']({
      url: baselink + options['ajaxEndpoint'] + '?page=' + encodeURIComponent(uri),
      dataType: 'json',
      data: type === 'POST' ? data : null,
      type: 'POST',
      success: page_ajax_success
    });
  }


  function PeriodicalUpdater(name, options) {
    if (typeof options === 'number') {
      options = {"frequency": options};
    }

    options = adpt['extend']({
      "frequency": 60,
      "decay": 0
    }, options || { });

    this.name = name;
    this.options = options;

    if (this.options['decay']) {
      this.value = getContentElement(this.name).innerHTML;
    }
    this.decay = (this.options['decay'] || 1);

    this.updateHandler = this.update.bind(this);
    this.successHandler = this.success.bind(this);

    this.timer = win.setTimeout(this.updateHandler, this.decay * this.options['frequency'] * 1000);
  }
  PeriodicalUpdater.prototype = {
    update: function () {
      if (applyFilter('contentinterval-' + this.name + '-update', true, this)) {
        adpt['ajax']({
          url: baselink + options['ajaxEndpoint'] + '?page=' + encodeURIComponent(PAI['PAGE']) + '&content=' + encodeURIComponent(this.name),
          dataType: 'json',
          type: 'POST',
          success: this.successHandler
        });
      }
    },

    success: function (res) {
      ajax_success(res);

      if (this.options['decay']) {
        this.decay = (res['content'][this.name] === this.value) ? this.decay * this.options['decay'] : 1;
        this.value = res['content'][this.name];
      }

      emit('contentinterval-' + this.name + '-updated', this, res);
      emit('contentinterval', this, res);

      this.timer = win.setTimeout(this.updateHandler, this.decay * this.options['frequency'] * 1000);
    }
  };

  function onclick(event, element) {
    var page = checkElement(element);
    if (!page && page !== '') { return; }

    emit('click', event, element);
    if (adpt['eventPrevented'](event)) { return; }

    showPage(page);
    adpt['preventDefault'](event);
  }

  function onclick_stop(event, element) {
    var page = checkElement(element);
    if (!page && page !== '') { return; }

    adpt['preventDefault'](event);
  }

  function onsubmit(event, element) {
    var page, data, get;

    page = checkElement(element);
    if (page === false) { return; }

    emit('submit', event, element);
    if (adpt['eventPrevented'](event)) { return; }

    data = adpt['formSerialize'](element);

    if (element.method === 'get') {
      if (page.match('\\?')) {
        get = page.split('?', 2);

        page = get[0];
        get = adpt['toQueryParams'](String(get[1]));

        data = adpt['extend'](get, data);
      }
      page += '?' + adpt['toQueryString'](data);

      data = null;
    }

//    skipNextHHCb = true;
    showPage(page, data);
    adpt['preventDefault'](event);
  }

  (function() {
    var timeout, oldpath;
    PAI['redirect'] = function (url, time, external) {
      if (timeout) {
        win.clearTimeout(timeout);
      }
      oldpath = PAI['PATH'];
      timeout = win.setTimeout(function () {
        timeout = null;
        if (oldpath !== PAI['PATH']) { return; }

        if (!external) {
          url = checkUrl(url);

          if (url) {
            showPage(url);
            return;
          }
        }

        loc.href = normalizeUrl(url);

      }, time * 1000);
    };
  }());

  function hh_cb(page) {
    if (skipNextHHCb) {
      skipNextHHCb = false;
    } else {
      showPage(page);
    }
  }


  // init
  function init(que) {
    hh(true);
    hh(hh_cb, 'pagechange');

    adpt = win['PAI']['adapter'];

    PAI['extend'] = adpt['extend'];

    PAI['extend'](win['PAI']);
    PAI['extend']({
      'checkElement': checkElement,
      'showPage': showPage,
      'pageInfo': pageInfo,
      'normalizeUrl': normalizeUrl,
      'loadScript': loadScript
    });


    win['PAI'] = PAI;

    var i, l, page,
      key, content;

    // que
    for (i = 0, l = que.length; i < l; i++) {
      PAI.apply(PAI, que[i]);
    }


    baselink = loc.protocol + '//' + loc.host + PAI['PATH'];


    adpt['addEvent'](doc, options['clickEventName'], 'a', onclick);

    if (options['clickEventName'] !== 'click') {
      adpt['addEvent'](doc, 'click', 'a', onclick_stop);
    }

    adpt['addEvent'](doc, 'submit', 'form', onsubmit);

    page = String(hh());
    if (page !== PAI['PAGE'] && loc.hash.substr(0, 2) === '#!') {
      showPage(page);
    }


    // check pages
    for (key in options['content']) {
      if (options['content'].hasOwnProperty(key)) {
        content = options['content'][key];
        if (content['interval']) {
          new PeriodicalUpdater(key, content['interval']);
        }

      }
    }
  }

  win['PAI']['_i'] = init;

}(this));
