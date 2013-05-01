define(['util/functions'], function(functions) {

    describe("functions utility", function() {

        describe('event_mutator factory', function() {

            var MyClass, instance;

            beforeEach(function() {
                MyClass = function() {
                    this.data = {};
                };

                MyClass.prototype.trigger = function() {};

                instance = new MyClass();

                spyOn(instance, 'trigger');
            });

            it('can get and set values', function() {

                MyClass.prototype.myval = functions.evented_mutator('data', 'myval');

                expect(instance.myval()).toBeUndefined();

                instance.myval(5);

                expect(instance.myval()).toEqual(5);
            });

            it('supports chaining', function() {
                MyClass.prototype.myval = functions.evented_mutator('data', 'myval');

                expect(instance.myval(5)).toBe(instance);
            });

            it('allows specifying the blob name', function() {

                //Add an object called 'blob' to the instance
                instance.blob = {
                    myval: 'happy'
                };

                //Add a mutator that looks for 'myval' in 'blob'
                MyClass.prototype.myval = functions.evented_mutator('blob', 'myval');

                expect(instance.myval()).toEqual('happy');
            });

            it('fires change events when the value changes', function() {

                MyClass.prototype.myval = functions.evented_mutator('data', 'myval');

                expect(instance.trigger).not.toHaveBeenCalled();

                instance.myval('setting 1');

                expect(instance.trigger).toHaveBeenCalledWith('change', 'myval', undefined, 'setting 1');

                instance.myval('setting 2');

                expect(instance.trigger).toHaveBeenCalledWith('change', 'myval', 'setting 1', 'setting 2');
            });

            it('does not fire change events when the value does not change', function() {

                //initialize a starting value
                instance.data.myval = 'setting 1';

                MyClass.prototype.myval = functions.evented_mutator('data', 'myval');

                expect(instance.trigger).not.toHaveBeenCalled();

                instance.myval('setting 1');

                expect(instance.trigger).not.toHaveBeenCalled();

            });

            it('does not fire change events in silent mode', function() {

                MyClass.prototype.myval = functions.evented_mutator('data', 'myval');

                expect(instance.trigger).not.toHaveBeenCalled();

                instance.myval('setting 1', true);

                expect(instance.trigger).not.toHaveBeenCalled();

            });


            it('allows custom event names', function() {

                MyClass.prototype.myval = functions.evented_mutator('data', 'myval', 'another-event');

                expect(instance.trigger).not.toHaveBeenCalled();

                instance.myval('setting 1');

                expect(instance.trigger).toHaveBeenCalledWith('another-event', 'myval', undefined, 'setting 1');
            });
        });

    });

});