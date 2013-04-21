define(['jquery', 'vis/semzoom'],
    function($, SemanticZoomVis) {

        var request;

        beforeEach(function() {

            this.indexer = function(d) {
                return d.time;
            }

            this.requester = function(zoomLevel, extent) {
                request = $.Deferred();
                request.abort = function() {};
                spyOn(request, 'abort');

                return request;
            }

            spyOn(this, "requester").andCallThrough();

            this.defaultOptions = {
                zoomLevels: [1, 2, 3],
                defaultZoomLevel: 2,
                indexer: this.indexer,
                requester: this.requester
            };
        });


        var generateData = function(zoomLevel, extent) {
            var data = [];
            for (var i = extent[0]; i <= extent[1]; i += zoomLevel) {
                data.push({
                    time: i,
                    value: Math.random()
                });
            }
            return data;
        }

        describe("SemanticZoomVis", function() {

            it("can detect options", function() {
                var options = this.defaultOptions;
                var zoomVis = new SemanticZoomVis(options);

                expect(zoomVis.currentZoomLevel).toEqual(options.defaultZoomLevel);
                expect(zoomVis.zoomLevels).toEqual(options.zoomLevels);
                expect(zoomVis.indexer).toEqual(options.indexer);
                expect(zoomVis.requester).toEqual(options.requester);
            });

            it("can request data with a zoom level and extent", function() {
                var options = this.defaultOptions;
                var zoomVis = new SemanticZoomVis(options);

                var extent = [6, 14];
                var zoomLevel = 2;

                var promise = zoomVis.request(zoomLevel, extent);

                expect(this.requester).toHaveBeenCalledWith(zoomLevel, extent);

                expect(promise).toEqual(request);
            });


            it("emits a new request at the same zoom only when the extent requires it", function() {
                var options = this.defaultOptions;
                var zoomVis = new SemanticZoomVis(options);

                var extent = [6, 14];
                var zoomLevel = 2;

                var promise = zoomVis.request(zoomLevel, extent);

                var rightExtent = [extent[0], extent[1] + 5];
                var rightPromise = zoomVis.request(zoomLevel, rightExtent);
                expect(rightPromise).not.toEqual(promise);

                var leftExtent = [extent[0] - 5, extent[1]];
                var leftPromise = zoomVis.request(zoomLevel, leftExtent);
                expect(leftPromise).not.toEqual(promise);
                expect(leftPromise).not.toEqual(rightPromise);

                var outerExtent = [extent[0] - 5, extent[1] + 5];
                var outerPromise = zoomVis.request(zoomLevel, outerExtent);
                expect(outerPromise).not.toEqual(promise);
                expect(outerPromise).not.toEqual(rightPromise);
                expect(outerPromise).not.toEqual(leftPromise);

                expect(this.requester.calls.length).toEqual(4);

                leftPromise = zoomVis.request(zoomLevel, leftExtent);
                expect(leftPromise).toEqual(outerPromise);

                rightPromise = zoomVis.request(zoomLevel, leftExtent);
                expect(rightPromise).toEqual(outerPromise);

                expect(this.requester.calls.length).toEqual(4);
            });

            it("can request data at multiple zoom levels", function() {
                var options = this.defaultOptions;
                var zoomVis = new SemanticZoomVis(options);

                var extent = [6, 14];
                var zoomLevel = 2;

                var extent2 = [4, 10];
                var zoomLevel2 = 3;

                var promise = zoomVis.request(zoomLevel, extent);

                expect(this.requester).toHaveBeenCalledWith(zoomLevel, extent);
                expect(promise).toEqual(request);

                var promise2 = zoomVis.request(zoomLevel2, extent2);

                expect(this.requester).toHaveBeenCalledWith(zoomLevel2, extent2);
                expect(promise2).toEqual(request);

                expect(promise2).not.toEqual(promise);
                expect(promise.abort).not.toHaveBeenCalled();
            });

            it ("cancels exiting requests with same zoom level and different extent", function() {
                var options = this.defaultOptions;
                var zoomVis = new SemanticZoomVis(options);

                var extent = [6, 14];
                var zoomLevel = 2;

                var extent2 = [4, 10];
                var zoomLevel2 = 2;

                var promise = zoomVis.request(zoomLevel, extent);

                expect(this.requester).toHaveBeenCalledWith(zoomLevel, extent);
                expect(promise).toEqual(request);

                var promise2 = zoomVis.request(zoomLevel2, extent2);

                expect(this.requester).toHaveBeenCalledWith(zoomLevel2, extent2);
                expect(promise2).toEqual(request);
                expect(promise2).not.toEqual(promise);

                expect(promise.abort).toHaveBeenCalled();
            });

            it("cannot request data at an unsupported zoom level", function() {
                var options = this.defaultOptions;
                var zoomVis = new SemanticZoomVis(options);

                var extent = [6, 54];
                var zoomLevel = 10;

                var caller = function() {
                    return zoomVis.request(zoomLevel, extent);
                }
                expect(caller).toThrow();
                expect(this.requester).not.toHaveBeenCalled();
            });
        });
    });
