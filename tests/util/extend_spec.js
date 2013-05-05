define(['util/extend'],
    function(extend) {

        describe("OO extend utility", function() {

            var parent_default_member = 'asdf';
            var child_default_member = 'fdsa';
            var Parent, Child;

            beforeEach(function() {
                //Declare a testing
                Parent = function() {
                    this.member = parent_default_member;
                };

                Parent.prototype.get = function() {
                    return this.member;
                };

                Child = function() {
                    Parent.apply(this);

                    this.child_member = child_default_member;
                };

                extend(Child, Parent);

                Child.prototype.child_get = function() {
                    return this.child_member;
                };
            });

            it('leaves the parent alone', function() {
                expect(Parent.prototype.constructor).toBe(Parent);

                var p = new Parent();
                expect(p).toEqual(jasmine.any(Parent));
                expect(p.member).toEqual(parent_default_member);
                expect(p.get()).toEqual(parent_default_member);
                expect(p.child_get).toBeUndefined();
            });

            it('has children instance of parents', function() {

                var child = new Child();

                expect(child).toEqual(jasmine.any(Child));
                expect(child).toEqual(jasmine.any(Parent));
            });

            it('allows constructor call through', function() {

               var child = new Child();

               expect(child.member).toEqual(parent_default_member);
               expect(child.child_member).toEqual(child_default_member);
            });

            it('inherits methods from the parent', function() {
                var child = new Child();

                expect(child.child_get).toBeDefined();
                expect(child.child_get()).toEqual(child_default_member);

                expect(child.get).toBeDefined();
                expect(child.get()).toEqual(parent_default_member);
            });

            it('allows method override', function() {
                Child.prototype.get = function() {
                    return this.child_member;
                };

                var child = new Child();
                expect(child.get()).toEqual(child_default_member);
            });

        });
    });