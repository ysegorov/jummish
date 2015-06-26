/* jshint expr:true */
/* global describe */
/* global it */
/* global beforeEach */
/* global afterEach */

'use strict';


var _ = require('../src/utils'),
    expect = require('chai').expect;


describe('Utils', function () {

    it('should properly detect Object and Dict', function () {
        expect(_.isDict(_.mkDict())).to.be.true;
        expect(_.isDict({})).to.be.false;
    });
    it('should return same object type while omitting', function () {
        let o = {},
            d = _.mkDict();

        o.foo = 'bar';
        d.foo = 'baz';

        function fltr(k, v) { return k !== 'foo'; }

        expect(_.omit(fltr, d)).to.not.have.property('foo');
        expect(_.isDict(_.omit(fltr, d))).to.be.true;
        expect(_.omit(fltr, o)).to.not.have.property('foo');
        expect(_.isDict(_.omit(fltr, o))).to.be.false;
    });
});

