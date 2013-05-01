define(['util/semzoom', 'lib/d3'],
    function(SemanticZoom, d3) {

        describe("SemanticZoom", function() {
            var zoom;

            beforeEach(function() {
                zoom = new SemanticZoom();
            });


            it('has reasonable defaults', function() {
                expect(zoom.domain()).toBeDefined();
                expect(zoom.idealBinCount() > 0).toBe(true);
            });

            it('can can detect a displaced center', function() {
                var visible = [0, 10];
                expect(zoom._is_center_off(visible, 5)).toBe(false);
                expect(zoom._is_center_off(visible, 4)).toBe(false);
                expect(zoom._is_center_off(visible, 3)).toBe(false);
                expect(zoom._is_center_off(visible, 2)).toBe(false);
                expect(zoom._is_center_off(visible, 1)).toBe(false);
                expect(zoom._is_center_off(visible, 0)).toBe(false);
                expect(zoom._is_center_off(visible, -0.01)).toBe(true);
                expect(zoom._is_center_off(visible, 10.01)).toBe(true);
            });

            it('can detect if too close to edge of data', function() {
                var visible = [0, 100];

                //Lots of buffer data
                expect(zoom._is_close_to_edge(visible, [-100, 200])).toBe(false);
                //Just on the threshold
                expect(zoom._is_close_to_edge(visible, [-25, 125])).toBe(false);

                //Just over the threshold on the left
                expect(zoom._is_close_to_edge(visible, [-24, 125])).toBe(true);

                //Just over the threshold on the right
                expect(zoom._is_close_to_edge(visible, [-25, 124])).toBe(true);

                //Not enough on either side
                expect(zoom._is_close_to_edge(visible, [-24, 124])).toBe(true);

                //Way too little data
                expect(zoom._is_close_to_edge(visible, [50, 51])).toBe(true);

                //No overlap at all, but a big data interval
                expect(zoom._is_close_to_edge(visible, [1000, 2000])).toBe(true);
            });

            it('can detect if the wrong number of bins', function() {
                var visible = [0, 100];
                zoom.idealBinCount(100);

                //So the ideal bin count is 100, with thresholds 50 and 150.
                //This translates to bin widths of 1, 2, and 0.66666
                expect(zoom._is_bin_count_wrong(visible, 1)).toBe(false);
                expect(zoom._is_bin_count_wrong(visible, 2)).toBe(false);
                expect(zoom._is_bin_count_wrong(visible, 2/3)).toBe(false);

                expect(zoom._is_bin_count_wrong(visible, 2.01)).toBe(true);
                expect(zoom._is_bin_count_wrong(visible, 0.66)).toBe(true);
            });

            it('calculates a recommendation wider than needed', function() {
                zoom.idealBinCount(10);

                //0 to 10 seconds
                var visible = [0, 10*1000];

                var result = zoom._recalculate(visible);
                 //three times as large, -10 to 20 seconds
                expect(result.from).toEqual(-10*1000);
                expect(result.to).toEqual(20*1000);
                //one second
                expect(result.bin_width).toEqual(1000);
            });

            it('recommends no change when data is perfect', function() {
                var visible = [0, 10*1000];
                zoom.domain(visible);
                zoom.idealBinCount(10);

                var data = [-10*1000, 20*1000];
                var binWidth = 1000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeFalsy();
            });

            it('recommends change when visible bins is too small', function() {
                var visible = [0, 10*1000];
                zoom.domain(visible);
                zoom.idealBinCount(10);

                var data = [-10*1000, 20*1000];
                var binWidth = 5000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeTruthy();
            });

            it('respects setting a scale instead of a simple domain', function() {
                var visible = [0, 10*1000];
                zoom.scale(d3.time.scale().domain(visible));
                zoom.idealBinCount(10);

                var data = [-10*1000, 20*1000];
                var binWidth = 5000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeTruthy();
            });


            it('recommends change when visible bins is too big', function() {
                var visible = [0, 10*1000];
                zoom.domain(visible);
                zoom.idealBinCount(10);

                var data = [-10*1000, 20*1000];
                var binWidth = 100;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeTruthy();
            });

            it('recommends change when buffer is too small', function() {
                var visible = [0, 10*1000];
                zoom.domain(visible);
                zoom.idealBinCount(10);

                var data = [-2.5*1000, 20*1000];
                var binWidth = 1000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeFalsy();

                data = [-2.49*1000, 20*1000];
                binWidth = 1000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeTruthy();

                data = [-10*1000, 12.5*1000];
                binWidth = 1000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeFalsy();

                data = [-10*1000, 12.49*1000];
                binWidth = 1000;
                expect(zoom.recommend(data[0], data[1], binWidth)).toBeTruthy();
            });

            it('ignores tiny shifts when updating bin width', function() {

                //With this visible domain and data setup,
                //an update is triggered because the number of visible bins
                //is just over 300, just above the threshold.

                //Unfortunately, the recalculation cannot recommend
                //a new bin size given its restricted list of bin
                //sizes and the current visible range.

                //When it tries to recalculate, it shifts the range 2000
                //to one side, a tiny unimportant change that shouldn't trigger
                //an update.

                var visible = [1359923120238, 1359923722069];
                var data = [1359922518000, 1359924322000];
                var binWidth = 2000;

                zoom.domain(visible);
                zoom.idealBinCount(200);

                expect(zoom.recommend(data[0], data[1], binWidth)).toBeFalsy();
            });

            it('throws exceptions if the arguments are wrong', function() {
                var visible = [0, 10*1000];
                zoom.domain(visible);
                zoom.idealBinCount(10);

                var data = [-10*1000, 20*1000];
                var binWidth = 100;

                var missingParams1 = function() {
                    zoom.recommend(data[0]);
                };

                var missingParams2 = function() {
                    zoom.recommend(data[0], data[1]);
                }

                var parameterTypes = function() {
                    zoom.recommend(data, data, data);
                }

                expect(missingParams1).toThrow();
                expect(missingParams2).toThrow();
                expect(parameterTypes).toThrow();
            });
        });
    });
