define(['util/events'],
    function(events) {

        describe("jQuery Events Mixin", function() {

            var MyClass;

            beforeEach(function() {
                MyClass = function() {};
            }

            it('adds methods to prototype', function() {
                events(MyClass);
                expect(MyClass.prototype.on).toBeDefined());
                expect(MyClass.prototype.trigger).toBeDefined());
            });

            it('allows fires events to listeners', function() {
                events(MyClass);

                var foo = new MyClass();

                var firstCallback = 0;
                foo.on('asdf', function() {
                    firstCallback++;
                });

                var secondCallback = 0;
                foo.on('asdf', function() {
                    secondCallback++;
                });

                foo.trigger('asdf');

                expect(firstCallback).toEqual(1);
                expect(secondCallback).toEqual(1);
            });
        });
    });