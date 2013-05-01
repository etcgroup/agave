define(['model/interval'],
    function (Interval) {

        describe("Interval Model", function () {

            it('takes on default field values', function() {

                var interval = new Interval();

                expect(interval.from()).toBeDefined();
            });

            it('allows initializing with data', function() {

                var interval = new Interval({
                    from: 23
                });

                expect(interval.from()).toEqual(23);
            });

        });

    });