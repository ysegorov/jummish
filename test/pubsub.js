/* jshint expr:true */
/* global describe */
/* global it */
/* global beforeEach */
/* global afterEach */

'use strict';

var PubSub = require('../src/pubsub'),
    expect = require('chai').expect;

var callCounter = 0;


describe('PubSub', function () {

    beforeEach(function () { callCounter = 0; });

    it('should properly pass context', function () {
        var obj = {
                onTick: function() { expect(this).to.equal(obj); }
            },
            ps = PubSub.new(),
            token;

        token = ps.on('tick', obj, 'onTick');
        ps.emit('tick', {});
        ps.emit('tick', {});
        ps.off('tick', token);
    });

    it('should never be triggered', function () {
        var obj = {
                onTick: () => callCounter += 1
            },
            ps = PubSub.new(),
            token;

        token = ps.on('tick', obj, 'onTick');
        ps.off('tick', token);
        ps.emit('tick', {});
        ps.emit('tick', {});

        expect(callCounter).to.equal(0);
    });

    it('should be triggered one time', function () {
        var obj = {
                onTick: () => callCounter += 1
            },
            ps = PubSub.new(),
            token;

        token = ps.on('tick', obj, 'onTick');
        ps.emit('tick', {});
        ps.off('tick', token);
        ps.emit('tick', {});

        expect(callCounter).to.equal(1);
    });

    it('should be triggered once', function () {
        var obj = {
                onTick: () => callCounter += 1
            },
            ps = PubSub.new();

        ps.once('tick', obj, 'onTick');
        ps.emit('tick', {});
        expect(ps.size('tick')).to.equal(0);
        ps.emit('tick', {});
        ps.emit('tick', {});

        expect(callCounter).to.equal(1);
    });

    it('should be triggered three times', function () {
        var obj = {
                onTick: () => callCounter += 10
            },
            ps = PubSub.new();

        ps.on('tick', obj, 'onTick');
        ps.emit('tick', {});
        ps.emit('tick', {});
        ps.emit('tick', {});
        ps.resetEvents();
        ps.emit('tick', {});
        ps.emit('tick', {});
        ps.emit('tick', {});

        expect(callCounter).to.equal(30);
    });

    it('should have proper length', function () {
        var obj = {
                onTick: () => callCounter += 10
            },
            ps = PubSub.new();

        expect(ps.size('tick')).to.equal(0);
        ps.on('tick', obj, 'onTick');
        expect(ps.size('tick')).to.equal(1);
        ps.on('tick', obj, 'onTick');
        ps.on('tick', obj, 'onTick');
        expect(ps.size('tick')).to.equal(3);
        ps.resetEvents();
        expect(ps.size('tick')).to.equal(0);

    });

    it('should return results after emit', function () {
        var obj = {
                onTick: function (p) { return 10 + p.a; }
            },
            ps = PubSub.new(),
            p;

        ps.on('tick', obj, 'onTick');
        return ps.emit('tick', {a: 1}).then(function (res) {
            expect(res[0]).to.equal(11);
        });

    });
});
