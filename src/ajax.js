/* global fetch */

'use strict';


function status(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    }
    throw new Error(response.statusText);
}

function json(response) {
    return response.json();
}


module.exports = function query(url, opts) {
    if (!opts) {
        opts = {};
    }
    if (!opts.headers) {
        opts.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }
    opts.headers['X-Requested-With'] = 'XMLHttpRequest';
    if (!opts.method) { opts.method = 'get'; }
    return fetch(url, opts).then(status).then(json);
};
