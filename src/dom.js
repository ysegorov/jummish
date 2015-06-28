
'use strict';

var g = require('./global'),
    _ = require('./utils');

if (g.document) {
    require('dom4');
}

var doc = g.document,
    log = g.log,
    domReady = false,
    domReadyCb = [],
    simpleRe = /^(#?[\w-]+|\.[\w-.]+)$/,
    periodRe = /\./g,
    readyFn,
    $;


// http://ryanmorr.com/abstract-away-the-performance-faults-of-queryselectorall/
function query(selector, context){
    context = context || doc;
    if(simpleRe.test(selector)){
        switch(selector.charAt(0)){
            case '#':
                return doc.getElementById(selector.substr(1));
            case '.':
                return _.toArray(context.getElementsByClassName(selector.substr(1).replace(periodRe, ' ')));
            default:
                return _.toArray(context.getElementsByTagName(selector));
        }
    }
    return _.toArray(context.querySelectorAll(selector));
}


var S = String;
var eM = {  // entityMap
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
};

function eH (str) {  // escapeHtml
    if (!str) {
        return str;
    }
    return S(str).replace(/[&<>"'\/]/g, function fromEM (s) {
        return eM[s];
    });
}


module.exports = $ = function $(selector, context) {
    var r = query(selector, context),
        isArr = _.isArray(r);

    return isArr ? (r.length > 1 ? r : (r.length === 1 ? r[0] : null)) : r;
};

$.escapeHtml = eH;

$.create = function create(tag, attrs) {
    var el = doc.createElement(tag);

    attrs = attrs || {};

    _.keys(attrs).forEach(function setAttr(key) {
        el.setAttribute(key, attrs[key]);
    });

    return el;
};
$.createFragment = function createFragment() {
    return doc.createDocumentFragment();
};

$.ready = function onReady(cb) {
    if (domReady) {
        try {
            cb();
        } catch (err) {
            log.error(err);
        }
        return ;
    }
    domReadyCb.push(cb);
    return $;
};

readyFn = function ready() {
    domReady = true;
    doc.removeEventListener('DOMContentLoaded', readyFn);

    domReadyCb.forEach(function call(cb) {
        try {
            cb();
        } catch (err) {
            log.error(err);
        }
    });

    domReadyCb = null;
};

if (doc) {
    if (doc.readyState !== 'loading') {
        readyFn();
    } else {
        doc.addEventListener('DOMContentLoaded', readyFn);
    }
}


$.on = function on(el, evtType, handler) {
    el.addEventListener(evtType, handler, false);
    return $;
};
$.off = function on(el, evtType, handler) {
    el.removeEventListener(evtType, handler, false);
    return $;
};
// TODO CustomEvent
$.trigger = function trigger(el, evtType) {
    var e = doc.createEvent('HTMLEvents');
    e.initEvent(evtType, true, true);
    el.dispatchEvent(e);
    return $;
};
// TODO undelegate
$.delegate = function delegate(targetEl, evt, selector, handler) {
    function wrapper(e) {
        var el = e.target,
            matched;

        if (!el) {
            return ;
        }
        // assuming matches and closest dom4 methods are available
        matched = el.matches(selector) ? el : el.closest(selector);

        if (matched) {
            handler.call(matched, e);
        }
    }
    return $.on(targetEl, evt, wrapper);
};

$.append = function append(el, targetEl) {
    (targetEl || doc.body).appendChild(el);
    return $;
};
$.before = function before(el, targetEl) {
    targetEl.before(el);
    return $;
};
$.after = function after(el, targetEl) {
    targetEl.after(el);
    return $;
};
$.remove = function remove(el) {
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
    return $;
};
$.addClass = function addClass(el, clName) {
    el.classList.add(clName);
    return $;
};
$.removeClass = function removeClass(el, clName) {
    el.classList.remove(clName);
    return $;
};
$.hasClass = function hasClass(el, clName) {
    return el.classList.contains(clName);
};
$.addClassOnlyTo = function addClassOnlyTo(el, clName, relativeTo) {
    var elements;
    if ($.hasClass(el, clName)) {
        return;
    }
    elements = $('.' + clName, (relativeTo || el).parentNode);
    if (!_.isArray(elements)) {
        // FIXME wraping unwrapped in $
        elements = [elements];
    }
    elements.forEach(function rmClass(el) {
        $.removeClass(el, clName);
    });
    return $.addClass(el, clName);
};
$.htmlToEl = function htmlToEl(html) {
    var div = $.create('div'),
        ch;

    div.innerHTML = html.trim();
    ch = div.children;

    if (ch.length !== 1) {
        throw new Error('html must have only one root element, got ' + ch.length);
    }

    return ch[0];
};
$.attr = function attrbute(el, attr, value) {
    if (value) {
        el.setAttribute(attr, value);
        return $;
    } else {
        return el.getAttribute(attr);
    }
};
$.rmAttr = function rmAttribute(el, attr) {
    el.removeAttribute(attr);
    return $;
};
$.text = function text(el, value) {
    if (value) {
        el.textContent = value;
        return $;
    }
    return el.textContent;
};
$.html = function html(el, value) {
    el.innerHTML = value;
    return $;
};
$.replaceWith = function replaceWith(el, html) {
    if (!_.isString(html)) {
        throw new Error('String expected');
    }
    el.outerHTML = html;
    return $;
};
$.safeHtml = function safeHtml(el, value) {
    el.innerHTML = eH(value);
    return $;
};
//svg pie source http://codepen.io/agrimsrud/pen/EmCoa
$.calcSvgPie = function calcSvgPie(val) {
    if (!_.isInteger(val)) {
        throw new Error('ineteger expected');
    }
    if (val < 0) {
        val = 0;
    } else if (val > 100) {
        val = 100;
    }

    var a = (val * 3.6) % 360,
        r = ( a * Math.PI / 180 ),
        x = Math.sin( r ) * 125,
        y = Math.cos( r ) * - 125,
        mid = ( a > 180 ) ? 1 : 0,
        path = 'M 0 0 v -125 A 125 125 1 ' +
            mid + ' 1 ' +
            x  + ' ' +
            y  + ' z';

    return path;
};

$.radioVal = function radioVal(form, name) {
    var radios = form.elements[name],
        cnt = radios.length,
        val = null,
        i;

    for (i = 0; i < cnt; i += 1) {
        if (radios[i].checked) {
            val = radios[i].value;
            break;
        }
    }
    return val;
};
$.formChanged = function formChanged(form) {
    var elements = form.elements,
        cnt = elements.length,
        i;

  for (i = 0; i < cnt; i += 1) {
      if(elements[i].value !== elements[i].defaultValue) {
          return(true);
      }
  }
  return(false);
};
$.offset = function offset(elem, relativeTo) {
    var elemRect = elem.getBoundingClientRect(),
        x = 0,
        y = 0;

    do {
        x += elem.offsetLeft;
        y += elem.offsetTop + elem.scrollTop;
        elem = elem.offsetParent;
    } while (elem !== relativeTo);

    return {
        left: x,
        top: y,
        height: elemRect.height,
        width: elemRect.width,
        offsetWidth: relativeTo.scrollWidth,
        offsetHeight: relativeTo.scrollHeight
    };
};
