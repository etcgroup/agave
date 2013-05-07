define(['util/poll'], function (Poll) {

    describe('Poll utility', function () {

        var callCount = 0;
        var callback;

        beforeEach(function() {
            callCount = 0;

            callback = jasmine.createSpy('callback').andCallFake(function() {
                callCount++;
            });

            jasmine.Clock.useMock();
        });

        afterEach(function () {
            // https://github.com/pivotal/jasmine/issues/51
            // Jasmine's mock clock does not remove scheduled functions between specs,
            // which allows for test pollution.
            jasmine.Clock.defaultFakeTimer.reset();
        });

        it('does not execute the callback until started', function() {

            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            expect(callback).not.toHaveBeenCalled();

            jasmine.Clock.tick(120);

            expect(callback).not.toHaveBeenCalled();
        });

        it('calls the callback once started', function() {

            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            expect(poll.isPolling()).toBe(false);
            poll.start();
            expect(poll.isPolling()).toBe(true);

            expect(callback).not.toHaveBeenCalled();

            jasmine.Clock.tick(50);

            expect(callback).toHaveBeenCalled();
            expect(callCount).toEqual(1);

        });

        it('polls at the correct interval', function() {

            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            poll.start();

            expect(callCount).toEqual(0);
            jasmine.Clock.tick(49);
            expect(callCount).toEqual(0);
            jasmine.Clock.tick(1);
            expect(callCount).toEqual(1);
            jasmine.Clock.tick(1);
            expect(callCount).toEqual(1);
        });

        it('stops polling when stopped', function() {
            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            poll.start();

            expect(callCount).toEqual(0);
            jasmine.Clock.tick(50);
            expect(callCount).toEqual(1);
            jasmine.Clock.tick(50);
            expect(callCount).toEqual(2);
            jasmine.Clock.tick(50);
            expect(callCount).toEqual(3);

            poll.stop();

            expect(callCount).toEqual(3);
            jasmine.Clock.tick(100);
            expect(callCount).toEqual(3);
        });

        it('can be restarted', function() {
            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            poll.start();

            expect(callCount).toEqual(0);
            jasmine.Clock.tick(150);
            expect(callCount).toEqual(3);

            poll.stop();

            jasmine.Clock.tick(100);

            expect(callCount).toEqual(3);

            poll.start();

            expect(callCount).toEqual(3);
            jasmine.Clock.tick(150);
            expect(callCount).toEqual(6);
        });

        it('does not double up if started twice', function() {
            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            poll.start();
            poll.start();

            expect(callCount).toEqual(0);
            jasmine.Clock.tick(150);
            expect(callCount).toEqual(3);
        });

        it('silently ignores duplicate stops', function() {
            var poll = new Poll({
                callback: callback,
                interval: 50
            });

            poll.start();
            poll.stop();
            poll.stop();
        });
    });

});