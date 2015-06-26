
/* jshint node:true */

'use strict';


module.exports = {
    $: require('./src/dom'),
    _: require('./src/utils'),
    ajax: require('./src/ajax'),
    global: require('./src/global'),
    PubSub: require('./src/pubsub'),
    dispatcher: require('./src/dispatcher'),
    View: require('./src/view'),
    Proto: require('proto-js')
};
