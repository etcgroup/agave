define(['util/rectangle'],
    function(Rectangle) {

        describe("Rectangle", function() {

            it('accepts top, left, width, height', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                expect(rect.top()).toEqual(options.top);
                expect(rect.left()).toEqual(options.left);
                expect(rect.width()).toEqual(options.width);
                expect(rect.height()).toEqual(options.height);
            });

            it('accepts top, bottom, left, right', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var mod_options = {
                    top: options.top,
                    left: options.left,
                    right: options.left + options.width,
                    bottom: options.top + options.height
                };

                var rect = new Rectangle(mod_options);

                expect(rect.top()).toEqual(options.top);
                expect(rect.left()).toEqual(options.left);
                expect(rect.width()).toEqual(options.width);
                expect(rect.height()).toEqual(options.height);
            });

            it('accepts width, height, bottom, right', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var mod_options = {
                    height: options.height,
                    width: options.width,
                    right: options.left + options.width,
                    bottom: options.top + options.height
                };

                var rect = new Rectangle(mod_options);

                expect(rect.top()).toEqual(options.top);
                expect(rect.left()).toEqual(options.left);
                expect(rect.width()).toEqual(options.width);
                expect(rect.height()).toEqual(options.height);
            });

            it('knows its center point', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var center = rect.center();

                expect(center).toEqual(jasmine.any(Object));
                expect(center.x).toEqual(options.left + options.width / 2);
                expect(center.y).toEqual(options.top + options.height / 2);
            });

            it('knows its bottom and right sides', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                expect(rect.bottom()).toEqual(options.top + options.height);
                expect(rect.right()).toEqual(options.left + options.width);
            });

            it('can set attributes on a selection', function() {
                var selection = {
                    attr: function() {
                    }
                };
                spyOn(selection, 'attr').andReturn(selection);

                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                rect.apply(selection);

                expect(selection.attr).toHaveBeenCalledWith('width', options.width);
                expect(selection.attr).toHaveBeenCalledWith('height', options.height);
                expect(selection.attr).toHaveBeenCalledWith('x', options.left);
                expect(selection.attr).toHaveBeenCalledWith('y', options.top);

            });

            it('can be copied', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend();

                expect(copy.top()).toEqual(options.top);
                expect(copy.left()).toEqual(options.left);
                expect(copy.width()).toEqual(options.width);
                expect(copy.height()).toEqual(options.height);
            });

            it('can be extended with adjusted top', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend({
                    top: 8
                });

                expect(copy.top()).toEqual(8);
                expect(copy.left()).toEqual(options.left);
                expect(copy.width()).toEqual(options.width);
                expect(copy.height()).toEqual(options.height);
            });

            it('can be extended with adjusted left', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend({
                    left: 0
                });

                expect(copy.top()).toEqual(options.top);
                expect(copy.left()).toEqual(0);
                expect(copy.width()).toEqual(options.width);
                expect(copy.height()).toEqual(options.height);
            });

            it('can be extended with adjusted width', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend({
                    width: 2
                });

                expect(copy.top()).toEqual(options.top);
                expect(copy.left()).toEqual(options.left);
                expect(copy.width()).toEqual(2);
                expect(copy.height()).toEqual(options.height);
            });

            it('can be extended with adjusted height', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend({
                    height: 2
                });

                expect(copy.top()).toEqual(options.top);
                expect(copy.left()).toEqual(options.left);
                expect(copy.width()).toEqual(options.width);
                expect(copy.height()).toEqual(2);
            });

            it('can be extended with adjusted right, changing width', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend({
                    right: 5
                });

                expect(copy.top()).toEqual(options.top);
                expect(copy.left()).toEqual(options.left);
                expect(copy.width()).toEqual(3);
                expect(copy.height()).toEqual(options.height);
            });

            it('can be extended with adjusted bottom, changing height', function() {
                var options = {
                    top: 5,
                    left: 2,
                    width: 8,
                    height: 10
                };

                var rect = new Rectangle(options);

                var copy = rect.extend({
                    bottom: 9
                });

                expect(copy.top()).toEqual(options.top);
                expect(copy.left()).toEqual(options.left);
                expect(copy.width()).toEqual(options.width);
                expect(copy.height()).toEqual(4);
            });
        });
    });