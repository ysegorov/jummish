# juvi

Frontend library trying to keep client-side code clean and simple

## Installation

```shell
$ npm install --save ysegorov/juvi#0.1.3
```

## Usage

Describe views

```javascript

// @module views/item.js

'use strict';

var ju = require('juvi'),
    $ = ju.$,
    View = ju.View;


var SubView = View.extend({
    template: 'subview',
    loadTemplate: function (tmplName) {
        // load template somehow and return function to render data
        return function (data) {
            return '<li>' + data.title + '</li>';
        };
    },
    serialize: function serialize() {
        return this.props;
    }
});

var ItemView = View.extend({
    template: 'item',
    loadTemplate: function (tmplName) {
        // load template somehow and return function to render data
        return function (data) {
            return '<div><div data-title="t">' + data.title + '</div><ul data-subitems="s"></ul></div>';
        };
    },
    init: function init() {
        // initialize
        this.items = [{title: 'A'}, {title: 'B'}, {title: 'C'}];
    },
    populateNodes: function populateNodes() {
        var el = this.el,
            $ = this.$;
        this.nodes = {
            $title: $('[data-title]', el),
            $subitems: $('[data-subitems]', el)
        };
        this.children = {
            $subitems: this.items.map(function (it) { return SubView.new(it); })
        };
        return this;
    },
    serialize: function serialize() {
        return {title: 'Hello world'};
    }
});


module.exports = ItemView;

```

Use them

```javascript

// @module app.js

'use strict';

var IV = require('views/item');


module.exports = function () {
    // var v = IV.new({});
    // v.mountTo(document.body);
    // return v;
    return IV.new({}, document.body);
};

```
And get rendered html

```html
<body>
    <div>
        <div data-title="t">Hello world</div>
        <ul data-subitems="s">
            <li>A</li>
            <li>B</li>
            <li>C</li>
        </ul>
    </div>
</body>
```


## License

MIT
