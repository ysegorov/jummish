
'use strict';


var oToS = Object.prototype.toString,
    _id = 0,
    u = {};

module.exports = u;

function Dict() {
    return Object.create(null);
}
Dict.prototype = null;
Dict.isDict = function isDict(it) { return Object.getPrototypeOf(it) === null; };

u.cid = function cid(prefix) { _id += 1; return '' + (prefix || 'c') + _id;};

u.isArray = function isArray(arg) { return Array.isArray(arg); };
u.isFunction = function isFunction(arg) { return typeof arg === 'function'; };
u.isObject = function isObject(arg) { return arg !== null && !u.isArray(arg) && typeof arg === 'object'; };
u.isDict = function isDict(arg) { return u.isObject(arg) && Dict.isDict(arg); };
u.isNumber = function isNumber(arg) { return oToS.call(arg) === '[object Number]'; };
u.isBoolean = function isBoolean(arg) { return oToS.call(arg) === '[object Boolean]'; };
u.isString = function isString(arg) { return oToS.call(arg) === '[object String]'; };
u.isDate = function isDate(arg) { return oToS.call(arg) === '[object Date]'; };
u.isInteger = function isInteger(arg) { return typeof arg === 'number' && isFinite(arg) && Math.floor(arg) === arg; };

u.mkDict = function mkDict() { return new Dict(); };
u.keys = function keys(obj) { return Object.keys(obj); };
u.values = function values(obj) { return Object.keys(obj).map(function (k) { return obj[k]; }); };
u.size = function size(obj) { return Object.keys(obj).length; };

u.omit = function omit(filterFn, obj) {
    var nextObj = u.isDict(obj) ? u.mkDict() : {},
        keys = Object.keys(obj);

    keys
        .filter(function (k) { return filterFn(k, obj[k]); })
        .forEach(function (k) { nextObj[k] = obj[k]; });

    if (Object.keys(nextObj).length === keys.length) {
        return obj;
    }
    return nextObj;
};

u.toArray = function toArray(args) {
    var len = args.length,
        a = [],
        i;
    for (i = 0; i < len; i += 1) {
        a.push(args[i]);
    }
    return a;
};

u.noop = function noop() {};
u.always = function always() { return true; };
u.never = function never() { return false; };

u.floatOrInt = function floatOrInt(val) {
    if (!u.isString(val)) {
        return val;
    }
    val = val.indexOf('.') !== -1 ? parseFloat(val) : parseInt(val, 10);
    if (isNaN(val)) {
        val = 0;
    }
    return val;
};
u.isZero = function isZero(v) { return u.floatOrInt(v) === 0;};
