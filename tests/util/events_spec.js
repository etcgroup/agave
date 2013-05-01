define(['jquery', 'util/events'],
    function ($, events) {

        describe("jQuery Events Mixin", function () {

            var MyClass;

            beforeEach(function () {
                MyClass = function () {
                };
            });

            it('adds methods to prototype', function () {
                events(MyClass);
                expect(MyClass.prototype.on).toBeDefined();
                expect(MyClass.prototype.trigger).toBeDefined();
                expect(MyClass.prototype.off).toBeDefined();
            });

            it('fires events to listeners', function () {
                events(MyClass);

                var foo = new MyClass();

                var firstCallback = 0;
                foo.on('asdf', function () {
                    firstCallback++;
                });

                var secondCallback = 0;
                foo.on('asdf', function () {
                    secondCallback++;
                });

                foo.trigger('asdf');

                expect(firstCallback).toEqual(1);
                expect(secondCallback).toEqual(1);
            });

            it('transmits data with events', function () {
                events(MyClass);

                var foo = new MyClass();

                var event = null;
                var args = null;
                foo.on('asdf', function (e) {
                    event = e;
                    args = Array.prototype.slice.call(arguments, 1);
                });

                foo.trigger('asdf');

                expect(event).toEqual(jasmine.any($.Event));
                expect(args).toEqual([]);

                foo.trigger('asdf', 'a', 'b', 'c');
                expect(event).toEqual(jasmine.any($.Event));
                expect(args).toEqual(['a', 'b', 'c']);
            });

            it('allows unsubscribing from events', function () {
                events(MyClass);

                var foo = new MyClass();

                var callCount = 0;
                var callback = function () {
                    callCount++;
                }


                foo.on('asdf', callback);
                foo.trigger('asdf');
                expect(callCount).toEqual(1);

                //Unsubscribe specifically
                foo.off('asdf', callback);
                foo.trigger('asdf');
                expect(callCount).toEqual(1);

                //Resubscribe
                foo.on('asdf', callback);
                foo.trigger('asdf');
                expect(callCount).toEqual(2);

                //Unsubscribe globally
                foo.off('asdf');
                foo.trigger('asdf');
                expect(callCount).toEqual(2);
            });

            it('does not execute a same-named function on the object', function() {
                events(MyClass);

                var foo = new MyClass();

                foo.asdf = function() {};

                spyOn(foo, 'asdf');

                foo.trigger('asdf');

                expect(foo.asdf).not.toHaveBeenCalled();
            });
        });
    });