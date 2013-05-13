define(['util/normalize_range'],
    function (normalize_range) {

        describe("normalize_range", function () {

            it('calculates recommendations at normal intervals', function () {

                //0 to 10 seconds, shifted slightly
                var binCount = 10;
                var from = 1;
                var to = 10 * 1000 + 1;

                var result = normalize_range(from, to, binCount);

                expect(result.bin_width).toEqual(1000);
                expect(result.from % 1000).toBe(0);
                expect(result.to % 1000).toBe(0);
            });
        });
    });