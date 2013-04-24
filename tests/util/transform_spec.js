define(['lib/transform'],
    function(Transform) {

        describe("Transform", function() {

            it('accepts empty constructor arguments', function() {
                var t = new Transform();

                expect(t.toString()).toEqual('');
            });

            it('accepts a transform in the constructor', function() {
                var t = new Transform('translate', 23, 54);

                expect(t.toString()).toEqual('translate(23,54)');
            });

            it('chains transforms', function() {
                var t = new Transform('scale', 1, 2);

                t.and('rotate', 25);

                expect(t.toString()).toEqual('scale(1,2),rotate(25)');
            })
        });
    });