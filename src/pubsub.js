
'use strict';

var _ = require('./utils'),
    Proto = require('proto-js');


if (!Promise) {
    throw new Error('Promise required for Pubsub');
}


function mkToken() {
    return _.cid('e');
}


module.exports = Proto.extend({

    constructor: function constructor() {
        this.resetEvents();
    },
    resetEvents: function resetEvents() {
        this._events = _.mkDict();
    },
    get events() {
        return this._events;
    },
    on: function on(topic, ctx, method, once) {
        var token = mkToken(),
            events = this.events,
            subs;

        if (!method || !ctx || !_.isFunction(ctx[method])) {
            throw new Error('Callable method expected as callback');
        }
        if (!(topic in events)) {
            events[topic] = subs = _.mkDict();
        } else {
            subs = events[topic];
        }
        subs[token] = {ctx: ctx, method: method, once: once || false};
        return token;
    },
    once: function once(topic, ctx, method) {
        return this.on(topic, ctx, method, true);
    },
    off: function off(topic, token) {
        var events = this.events,
            subsPrev,
            subsNext;

        if (!(topic in events)) {
            return false;
        }
        subsPrev = events[topic];
        subsNext = _.omit(function (k, v) { return k !== token; }, subsPrev);

        if (subsNext !== subsPrev) {
            events[topic] =  subsNext;
        }

        return true;
    },
    emit: function emit(topic, payload) {

        // TODO tests

        var events = this.events,
            subsPrev,
            subsNext,
            res;

        if (!_.isObject(payload)) {
            throw new Error('Payload expected to be an object');
        }
        if (!(topic in events)) {
            return Promise.resolve([]);
        }
        subsPrev = events[topic];
        subsNext = _.omit(function (k, v) { return !v.once; }, subsPrev);

        res = _.keys(subsPrev).map(function run(k) {
            var conf = subsPrev[k],
                ctx = conf.ctx,
                method = conf.method;
            return new Promise(function runMethod(resolve, reject) {
                try {
                    resolve(ctx[method](payload));
                } catch (err) {
                    reject(err);
                }
            });
        });
        res = Promise.all(res);

        if (subsNext !== subsPrev) {
            events[topic] = subsNext;
        }

        return res;

    },
    size: function size(topic) {
        var events = this.events,
            subs;

        if (!(topic in events)) {
            return 0;
        }
        subs = events[topic];
        return _.size(subs);
    }
});
