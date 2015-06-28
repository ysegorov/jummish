
'use strict';

var _ = require('./utils'),
    $ = require('./dom'),
    g = require('./global'),
    // proto
    Proto = require('proto-js');


function mkToken() {
    return _.cid('vv');
}


/**
 * Extendable View boilerplate
 *
 **/
var View = Proto.extend({

    /**
     * View constructor function
     * will be invoked by Proto.new method
     *
     * @param {object} props - View properties
     * @param {Element} [targetEl] - DOM Element to mount View instance to
     *
     */
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
    /** template name for a View instance */
    template: '*',
    /** View close method */
    close: function close() {
        this.unmount();
        this.removeHandlers();

        this.closeChildren();

        this.el = this.props = this.nodes = null;

        return this;
    },
    /**
     * Method to serialize data to render a View template with
     *
     * Extension point, must be overriden
     *
     * @return {object} - object to be passed to template function
     *
     */
    serialize: function serialize() {
        return {};
    },
    /**
     * Method to load template from a pool of available templates
     *
     * Must be overriden to customize template loading
     *
     * @param {string} tmplName - Name of the template to load
     * @return {function} - function to be called to render template
     *
     */
    loadTemplate: function() {
        throw new Error('Subclass must provide ``loadTemplate`` method');
    },
    /**
     * Method to render template using serialized data
     *
     * Can be overriden to customize renderer
     *
     * @return {string} - rendered html string
     *
     */
    render: function render() {
        var tmpl = this.loadTemplate(this.template);
        return tmpl(this.serialize());
    },
    /**
     * Method to re-render view if needed
     */
    reRender: function reRender() {
        var targetEl = this.el.parentNode,
            props = this.props;

        this.close();
        this.props = props;

        return this.mountTo(targetEl);
    },
    /**
     * Method to handle DOM event and call actual event handler
     *
     * @param {Event} evt - DOM event
     *
     */
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
    /**
     * Method to mount view to DOM element
     *
     * Automatically renders view if needed
     *
     * @param {Element} targetEl - DOM element to mount view to
     *
     */
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
    /**
     * Method to unmount (detach ``this.el`` from DOM) view
     *
     * @return {object} this
     *
     */
    unmount: function unmount() {
        this._beforeUnmount();

        $.remove(this.el);

        this._afterUnmount();

        return this;
    },
    /**
     * Method to add event listeners to ``this.el``
     *
     * For ``focus`` and ``blur`` events attaches handlers to currently
     * available in DOM nodes (as these events don't bubble)
     *
     * Requires View instance to have method ``this.handleEvent``
     *
     * @return {object} this
     *
     */
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

        return this;
    },
    /**
     * Method to remove event listeners attached to ``this.el``
     *
     * For ``focus`` and ``blur`` events detaches handlers from currently
     * available in DOM nodes (as these events don't bubble)
     *
     * @return {object} this
     *
     */
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

        return this;
    },
    /**
     * Method to mount children views, described in ``this.children`` object,
     * to nodes, described in ``this.nodes`` object
     *
     * Expected structure:
     *
     * this.chidlren = {
     *      $menu: MenuView.new({}),
     *      $items: [ItemView.new({item: 1}), ItemView.new({item: 2})]
     * };
     * this.nodes = {
     *      $menu: $('[data-menu]', this.el),
     *      $items: $('[data-items]', this.el)
     * }
     *
     * Method is called automatically in ``this.mountTo`` method.
     *
     * @return {object} this
     *
     */
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
    /**
     * Method to close children views, described in ``this.children`` method
     *
     * @return {object} this
     *
     */
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
    /* Internal method to call ``this.populateNodes`` if available */
    _populateNodes: function _populateNodes() {
        if (!this.el) {
            throw new Error('View.populateNodes must be called after View.el was created');
        }
        if (_.isFunction(this.populateNodes)) {
            this.populateNodes();
        }
        return this;
    },
    /* Internal method to call ``this.beforeMount`` if available */
    _beforeMount: function _beforeMount() {
        if (_.isFunction(this.beforeMount)) {
            this.beforeMount();
        }
        return this;
    },
    /* Internal method to call ``this.afterMount`` if available */
    _afterMount: function _afterMount() {
        if (_.isFunction(this.afterMount)) {
            this.afterMount();
        }
        return this;
    },
    /* Internal method to call ``this.beforeUnmount`` if available */
    _beforeUnmount: function _beforeUnmount() {
        if (_.isFunction(this.beforeUnmount)) {
            this.beforeUnmount();
        }
        return this;
    },
    /* Internal method to call ``this.afterUnmount`` if available */
    _afterUnmount: function _afterUnmount() {
        if (_.isFunction(this.afterUnmount)) {
            this.afterUnmount();
        }
        return this;
    }

});


module.exports = View;
