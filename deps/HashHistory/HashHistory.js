/** @preserve Version 0.2.2

Copyright (C) 2011 by Christian Vaagland Tellnes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

(function (win) {
  var doc = win.document
    , loc = win.location
    , his = win.history

    , objectProtoToString = Object.prototype.toString

      /**
       *  @const
      **/
    , IS_OPERA  = objectProtoToString.call(win['opera']) === '[object Opera]'

      /**
       *  @const
      **/
    , IS_IE = !!win['attachEvent'] && !IS_OPERA


      /**
       *  @type {boolean}
      **/
    , USE_PUSHSTATE = false


    , options = {
        /**
         *  Default '/favicon.ico' witch is probably an existing file that does not links to something else
         *  @type {string}
        **/
        iframeSrc: '/favicon.ico'

        /**
         *  url base if using pushState
         *  @type {string}
        **/
      , base: '/'

        /**
         *  Interval Frequency
         *  @type {number}
        **/
      , frequency: 100

        /**
         *  @type {boolean}
        **/
      , shebang: true
    }

    , initialized // if initialized
    , iframe // iframe for IE

    , intervalID

    , encodeHash = false

      /**
       *  @type {string}
      **/
    , currentPage = ''
    , currentHash = ''


      /**
       *  TODO: Do we need so long time?
       *  @const
      **/
  //    WAIT_TIME = (IS_IE || IS_OPERA) ? 400 : 200,
    , WAIT_TIME = 200

      /**
       *  @type {number}
      **/
    , currentWaitTime = 0

    , upToDate = false

    , listeners = []

    , listenerType = {
        ALL: 'all'
      , CHANGE: 'change'
      , PUSH: 'push'
      , PAGECHANGE: 'pagechange'
      , PAGEPUSH: 'pagepush'
      , HASHCHANGE: 'hashchange'
      , HASHPUSH: 'hashpush'
      , PAGE: 'page'
      , HASH: 'hash'
    }



  function updateIframe(hash) {
    var idoc
      , html = '<html><body onload="parent.HashHistory._iframeLoaded(unescape(\'' + win.escape(hash) + '\'))"></body></html>'

    try {
      idoc = iframe['contentWindow']['document']
      idoc['open']('javascript:"<html></html>"')
      idoc['write'](html)
      idoc['close']()
      return true
    } catch (e) {
      return false
    }
  }

  function setLocHash(item) {
    loc['hash'] = (options.shebang ? '#!' : '#') + (encodeHash ? encodeURIComponent(item) : item)
  }

  function getLocHash() {
    var str
      , index = 0

    // IE5.5 and IE6 fails if the fragment contains a question mark
    if (encodeHash) {
      str = loc['href']
      index = loc['href'].indexOf('#')
      if (index === -1) {
        return ''
      }
    } else {
      str = loc['hash']
    }
    index += (options.shebang ? 2 : 1)
    return str['substr'](index)
  }

  function getLocQueryString() {
    return loc['pathname'] + loc['search']
  }

  function updateHash(page, hash) {
    var newitem = page + (hash ? '#' + hash : '')

    if (USE_PUSHSTATE) {
      upToDate = false
      his['pushState']({}, doc['title'], newitem)
      upToDate = true
    } else {
      upToDate = false

      /* Now queue up this add request */

      win['setTimeout'](function () {
        if (currentWaitTime > 0) {
          currentWaitTime = currentWaitTime - WAIT_TIME
        }

        if (iframe) {
          updateIframe(newitem)
        }

        setLocHash(newitem)

        if (!currentWaitTime) upToDate = true
      }, currentWaitTime)

      /* Indicate that the next request will have to wait for awhile */
      currentWaitTime = currentWaitTime + WAIT_TIME
    }
  }

  function check(page, hash, is_push) {
    if (is_push) {
      updateHash(page, hash)
    } else {
      if (!upToDate || (page === currentPage && hash === currentHash)) {
        return false
      }
    }

    var i, l, obj, call, oldPage, oldHash

    oldPage = currentPage
    oldHash = currentHash

    currentPage = page
    currentHash = hash


    // Emit events

    for (i = 0, l = listeners.length; i < l; i = i + 1) {
      obj = listeners[i]

      switch (obj['type']) {
      case listenerType.ALL:
        call = true
        break

      case listenerType.PUSH:
        call = is_push
        break
      case listenerType.PAGEPUSH:
        call = is_push && oldPage !== page
        break
      case listenerType.HASHPUSH:
        call = is_push && oldHash !== hash
        break

      case listenerType.CHANGE:
        call = !is_push
        break
      case listenerType.PAGECHANGE:
        call = !is_push && oldPage !== page
        break
      case listenerType.HASHCHANGE:
        call = !is_push && oldHash !== hash
        break

      case listenerType.PAGE:
        call = oldPage !== page
        break
      case listenerType.HASH:
        call = oldHash !== hash
        break

      default:
        call = false
        break
      }

      if (call) {
        obj['handle'](page, hash)
      } // if
    } // for

    return true

  } // function

  function splitHash(str) {
    var i = str.indexOf('#')
    if (i !== -1) {
      return [ str['substr'](0, i), str['substr'](i + 1) ]
    }
    return [ str ]
  }

  function iframeLoaded(state) {
    var h = splitHash(state)
    if (check(h[0], h[1], false)) {
      setLocHash(state)
    }
  }

  /**
   *  @param {string} page
   *  @param {boolean|string=} hash (optional)
  **/
  function pushState(page, hash) {
    var h = splitHash(page)

    if (hash === true) {
      hash = currentHash
    } else if (!hash) {
      hash = ''
    }

    if (h[1]) {
      page = h[0]
      hash = h[1] + (hash ? '#' + hash : '')
    } else {
      hash = hash === undefined ? currentHash : hash
    }

    return check(page, hash, true)
  }

  /**
   *  @param {boolean|string} type
   *  @param {function(string=)} handle
  **/
  function addListener(type, handle) {
    if (type === true) {
      type = listenerType.CHANGE
    } else if (type) {
      type = String(type)
    } else {
      type = listenerType.ALL
    }

    listeners[listeners.length] = { 'handle': handle
                                  , 'type': type
                                  }
  }

  /**
   *  @return {string} Current page
  **/
  function getCurrent() {
    return currentPage
  }

  /**
   *  @param {string=} opt_newHash Sett new hash
  **/
  function hash(opt_newHash) {
    if (arguments.length) {
      currentHash = opt_newHash
      check(currentPage, opt_newHash, true)
    }

    return hash
  }
  hash.toString = function () {
    if (USE_PUSHSTATE) {
      return loc.hash.substr(1)
    } else {
      return currentHash || ''
    }
  }

  function onpopstate() {
    check(getLocQueryString(), getLocHash(), false)
  }

  /**
   *
  **/
  function hashCheck() {
    var hash = getLocHash()
      , h = splitHash(hash)

    if (check(h[0], h[1], false)) {
      if (iframe) updateIframe(hash)
    }
  }

  function onpropertychange() {
    // location event appears when using forward/backward buttons
    if (win['event']['propertyName'] === 'location') {
      hashCheck()
    }
  }

  function startInterval() {
    if (intervalID) win['clearInterval'](intervalID)
    intervalID = win['setInterval'](hashCheck, options.frequency)
  }

  function init() {
    if (initialized) return
    initialized = true

    currentHash = getLocHash()
    if (USE_PUSHSTATE) {
      currentPage = getLocQueryString()
    } else {
      var h = splitHash(currentHash)
      currentPage = h[0]
      currentHash = h[1]
    }

    if (USE_PUSHSTATE) {
      win['addEventListener']('popstate', onpopstate, false)

    // documentMode logic from Modernizr as they have from YUI to filter out IE8 Compat Mode which false positives.
    // SUPPORTS_HASHCHANGE
    } else if (('onhashchange' in win) && (doc['documentMode'] === undefined || doc['documentMode'] > 7)) {
      if (win['addEventListener']) { // well behaved browsers
        win['addEventListener']('hashchange', hashCheck, false)
      } else if (win['attachEvent']) { // IE 8
        win['attachEvent']('onhashchange', hashCheck)
      }

    } else {
      if (IS_IE) { // (IS_IE && !SUPPORTS_HASHCHANGE)   IE6, IE7

        encodeHash = true // Should be false in IE 7, but we do not bother

        // if ('onpropertychange' in document && 'attachEvent' in document)
        doc['attachEvent']('onpropertychange', onpropertychange)

        // add hidden iframe for IE
        iframe = doc['createElement']('iframe')
        iframe['style']['display'] = 'none'

        iframe['src'] = options.iframeSrc
        doc['body']['appendChild'](iframe)

        updateIframe(currentPage)
      } else if (IS_OPERA) {
        // This is only needed for Opera 9.23 and Opera 9.24. Newer versions of Opera supports hashchange event and will not come here.
        // http://my.opera.com/community/forums/topic.dml?id=197771&t=1189129479&page=1
        // http://weblogs.asp.net/bleroy/archive/2007/09/07/how-to-build-a-cross-browser-history-management-system.aspx
        win['setTimeout'](function () {
          var div = doc['createElement']('div')
          div['innerHTML'] = '<img src="javascript:location.href=\'javascript:HashHistory._startInterval()\'" style="position:absolute;left:-1000px;top:-1000px;width:1px;height:1px;border:0;">'
          doc['body']['appendChild'](div.firstChild)
        }, 1)
      }

      startInterval()
    }

    upToDate = true
  }

  /*
  function destroy() {
    if (!initialized) return
    initialized = false
    upToDate = false

    if (win.removeEventListener) { // well behaved browsers
      win.removeEventListener('popstate', onpopstate, false)
      win.removeEventListener('hashchange', hashCheck, false)
    } else if (win.detachEvent) { // IE 8
      win.detachEvent('onhashchange', hashCheck)
    }

    if (iframe) {
      iframe.parentNode.removeChild(iframe)
      iframe = null
    }

    if (intervalID) {
      win.clearInterval(intervalID)
    }
  }
  */


  function setOptions(opt) {
    var key
    for (key in opt) {
      if (opt.hasOwnProperty(key)) {
        switch (key.toLowerCase()) {
        case 'blank':
          options.iframeSrc = String(opt[key])
          break

        case 'usepushstate':
          USE_PUSHSTATE = Boolean(opt[key]) && (his && his['pushState'])
          break

        case 'frequency':
          options.frequency = Number(opt[key])
          break

        case 'shebang':
          options.shebang = Boolean(opt[key])
          break

        case 'init':
          if (opt[key]) init()
          break

        } // switch
      } // if
    } // for
  } // function

  /**
   *
  **/
  function HashHistory(arg, opt_var) {
    switch (objectProtoToString.call(arg)) {
    case '[object String]':
      if (arg.charAt(0) === '#') {
        return arg.length > 1 ? hash(arg['substr'](1)) : hash
      } else {
        pushState(arg, opt_var)
      }
      break

    case '[object Function]':
      addListener(opt_var, arg)
      break

    case '[object Object]':
      setOptions(arg)
      break

    case '[object Boolean]':
      if (arg === true) {
        init()
//      } else {
//        destroy()
      }
      break

    }

    return HashHistory
  }

  HashHistory['toString'] = getCurrent
  HashHistory['init'] = init
  HashHistory['hash'] = hash
  HashHistory['getCurrent'] = getCurrent
  HashHistory['on'] = addListener
  HashHistory['_iframeLoaded'] = iframeLoaded
  HashHistory['_startInterval'] = startInterval


  win['HashHistory'] = HashHistory

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HashHistory
  }

}(window))
