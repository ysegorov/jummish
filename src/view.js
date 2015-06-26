
'use strict';

var _ = require('./utils'),
    $ = require('./dom'),
    g = require('./global'),
    // proto
    Proto = require('proto-js');


function mkToken() {
    return _.cid('vv');
}


var View = Proto.extend({

    constructor: function constructor(props, targetEl) {
        this.props = props || {};
        this.cid = mkToken();

        this.el = null;
        this.children = null;
        this.nodes = null;

        if (_.isFunction(this.init)) {
            this.init();
        }
        if (targetEl) {
            this.mountTo(targetEl);
        }
    },
    // dom helpers
    $: $,
    // template name
    template: '*',
    close: function close() {
        this.unmount();
        this.removeHandlers();

        this.closeChildren();

        this.el = this.props = this.nodes = null;

        return this;
    },
    // extension point
    serialize: function serialize() {
        return {};
    },
    loadTemplate: function() {
        throw new Error('Subclass must provide ``loadTemplate`` method');
    },
    // extension point
    render: function render() {
        var tmpl = this.loadTemplate(this.template);
        return tmpl(this.serialize());
    },
    reRender: function reRender() {
        var targetEl = this.el.parentNode,
            props = this.props;

        this.close();
        this.props = props;

        return this.mountTo(targetEl);
    },
    handleEvent: function handleEvent(evt) {
        var handlers = this.events[evt.type],
            target = evt.target,
            self = this;

        if (!handlers) {
            return ;
        }
        _.keys(handlers).forEach(function handle(selector) {
            var matched = target.matches(selector) ? target : target.closest(selector),
                fn;
            if (matched) {
                fn = self[handlers[selector]];
                if (!_.isFunction(fn)) {
                    throw new Error('Missing event handler');
                }

                evt.matchedTarget = matched;

                fn.call(self, evt, matched);

                evt.matchedTarget = null;
            }
        });
    },
    mountTo: function mountTo(targetEl) {
        if (!this.el) {
            this._beforeMount();

            var html = this.render();

            this.el = $.htmlToEl(html);
            $.attr(this.el, 'data-cid', this.cid).attr(this.el, 'data-vid', this.vid);

            this._populateNodes();
            this.populateHandlers();
            this.mountChildren();
        }
        $.append(this.el, targetEl);

        return this._afterMount();
    },
    _populateNodes: function _populateNodes() {
        if (!this.el) {
            throw new Error('View.populateNodes must be called after View.el was created');
        }
        if (_.isFunction(this.populateNodes)) {
            this.populateNodes();
        }
        return this;
    },
    populateHandlers: function populateHandlers() {
        var el = this.el,
            events = this.events;

        if (!el || !events || !_.isFunction(this.handleEvent)) {
            return ;
        }
        (function populate(_el, _ctx, _events) {
            // events which don't bubbles
            var restricted = ['focus', 'blur'];
            _.keys(_events).forEach(function addEvent(evtType) {
                if (restricted.indexOf(evtType) !== -1) {
                    _.keys(_events[evtType]).forEach(function addRestricted(selector) {
                        var t = $(selector, _el);
                        if (t) {
                            $.on(t, evtType, _ctx, false);
                        }
                    });
                } else {
                    $.on(_el, evtType, _ctx, false);
                }
            });
        })(el, this, events);

    },
    removeHandlers: function removeHandlers() {
        var el = this.el,
            events = this.events;

        if (!el || !events || !_.isFunction(this.handleEvent)) {
            return ;
        }
        (function remove(_el, _ctx, _events) {
            var restricted = ['focus', 'blur'];
            _.keys(_events).forEach(function addEvent(evtType) {
                if (restricted.indexOf(evtType) !== -1) {
                    _.keys(_events[evtType]).forEach(function addRestricted(selector) {
                        var t = $(selector, _el);
                        if (t) {
                            $.off(t, evtType, _ctx, false);
                        }
                    });
                } else {
                    $.off(_el, evtType, _ctx, false);
                }
            });
        })(el, this, events);

    },
    mountChildren: function mountChildren() {
        var ch = this.children,
            nodes = this.nodes;

        if (ch) {

            _.keys(ch).forEach(function mount(key) {
                var v = ch[key],
                    targetEl = nodes[key];

                if (!_.isArray(v)) {
                    v = [v];
                }
                v.forEach(function mount(child) {
                    if (_.isFunction(child.mountTo)) {
                        child.mountTo(targetEl);
                    }
                });
            });
        }
        return this;
    },
    closeChildren: function closeChildren() {
        var ch = this.children;

        if (ch) {

            _.keys(ch).forEach(function close(key) {
                var v = ch[key];

                if (!_.isArray(v)) {
                    v = [v];
                }
                v.forEach(function unmount(child) {
                    if (_.isFunction(child.close)) {
                        child.close();
                    }
                });
            });

            this.children = null;
        }
        return this;
    },
    _beforeMount: function _beforeMount() {
        if (_.isFunction(this.beforeMount)) {
            this.beforeMount();
        }
        return this;
    },
    _afterMount: function _afterMount() {
        if (_.isFunction(this.afterMount)) {
            this.afterMount();
        }
        return this;
    },
    _beforeUnmount: function _beforeUnmount() {
        if (_.isFunction(this.beforeUnmount)) {
            this.beforeUnmount();
        }
        return this;
    },
    _afterUnmount: function _afterUnmount() {
        if (_.isFunction(this.afterUnmount)) {
            this.afterUnmount();
        }
        return this;
    },
    unmount: function unmount() {
        this._beforeUnmount();

        $.remove(this.el);

        this._afterUnmount();

        return this;
    }

});


module.exports = View;
