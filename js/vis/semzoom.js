define([
    'lib/d3',
    'underscore',
    'backbone',
    'lib/rectangle'],
    function(d3, _, Backbone, Rectangle) {

        var SemanticZoomVis = function(options) {

            this.container = options.target;
            if (!(options.target instanceof d3.selection)) {
                this.container = d3.select(this.container);
            }

            this.zoomLevels = options.zoomLevels;

            this.currentZoomLevel = options.defaultZoomLevel;
            this.currentExtent = options.defaultExtent;

            this.requester = options.requester;

            this._cache = {};

            var self = this;
            _.each(this.zoomLevels, function(zl) {
                self._cache[zl] = null
            });
        }

        _.extend(SemanticZoomVis.prototype, Backbone.Events, {

            /**
             * Retrieve a data request at the given zoom level (using jQuery deferred).
             *
             * If the data is already available then the request can
             * be used immediately.
             */
            request: function(zoomLevel, extent) {
                var self = this;

                if (!(zoomLevel in this._cache)) {
                    throw "Unsupported zoom level requested";
                }

                var cached = this._cache[zoomLevel];
                if (cached) {
                    if (extent[0] >= cached.extent[0] &&
                        extent[1] <= cached.extent[1]) {
                        return cached.request;
                    }
                }

                var request = this.requester(zoomLevel, extent);
                this._cacheRequest(zoomLevel, extent, request);

                var originalDone = request.done

                return request;
            },

            /**
             * Cache the data request at the provided zoom level and extent.
             */
            _cacheRequest: function(zoomLevel, extent, request) {
                var self = this;

                if (!(zoomLevel in this._cache)) {
                    throw "Unsupported zoom level cached";
                }

                if (this._cache[zoomLevel]) {

                    var existing = this._cache[zoomLevel];

                    if (existing.request.abort) {
                        //There's already a request cached
                        //so cancel the request
                        console.log("Canceling request for " + existing.extent + " at zoom " + zoomLevel);
                        existing.request.abort();
                    }
                }

                this._cache[zoomLevel] = {
                    extent: extent,
                    request: request
                }
            },

            /**
             * Fades out the current display and replaces it with the new panel.
             * withPanel should be a d3 selection.
             */
            replacePanel: function(withPanel) {
                var self = this;

                var transition = withPanel.transition()
                .style('opacity', 1);

                if (this._currentPanel) {
                    var oldPanel = this._currentPanel;

                    transition.each('end', function() {
                        oldPanel.remove();
                    })
                }

                this._currentPanel = withPanel;
            },

            /**
             * Build a new panel as a target for rendering a new zoom level.
             */
            blankPanel: function() {
                return this.container.append('g')
                .style('opacity', 0)
                .attr('x', 0)
                .attr('y', 0);
            },

            /**
             * Render and return an svg object given the provided data.
             */
            renderPanel: function(zoomLevel, extent, data) {
                var panel = this.blankPanel();

                var colors = d3.scale.category10();
                colors.domain([0,1,2,3,4,5,6,7,8,9]);

                var rect = panel.append('rect')
                .attr('width', 100)
                .attr('height', 150)
                .style('fill', colors(Math.floor(Math.random() * 10)));

                panel.append('text')
                .style('fill', '#fff')
                .attr('x', 0)
                .attr('y', 12)
                .text(zoomLevel.toString() + " " + extent.toString());

                return panel;
            },

            render: function() {
                var self = this;

                var zoomLevel = this.zoomLevels[Math.floor(Math.random() * this.zoomLevels.length)];
                var extent = [Math.round(Math.random() * 100), Math.round(Math.random() * 200 + 200)];

                var request = this.request(zoomLevel, extent);
                request.done(function(data) {
                    var panel = self.renderPanel(zoomLevel, extent, data);
                    self.replacePanel(panel);

                    panel.on('click', function() {
                        self.render();
                    });
                });


            }


        });


        return SemanticZoomVis;

    });
