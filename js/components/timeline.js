define(['jquery',
    'lib/d3',
    'util/events',
    'util/loader',
    'util/transform',
    'util/rectangle',
    'vis/histogram'], function ($, d3, events, loader, Transform, Rectangle, Histogram) {

    var AXIS_OFFSET = 3;

    /**
     * A class for rendering and maintaining a basic timeline.
     *
     * A wrapper around a histogram that adds axes and data handling.
     *
     * Options must include:
     * - api: An API object
     * - into: a selection
     * - queries: a collection of Query objects
     * - interval: an Interval object
     *
     * Options may include:
     * - width
     * - height
     * - binSize
     * - utcOffset
     * - interpolation
     *
     * @param options
     * @constructor
     */
    var Timeline = function (options) {
        this.api = options.api;
        this.into = options.into || $('<div>');
        this.interval = options.interval;
        this.queries = options.queries;

        //Get the dimensions from the target if set
        if (options.into) {
            this._height = options.height || options.into.height();
            this._width = options.width || options.into.width();
        } else {
            this._height = options.height || 50;
            this._width = options.width || 300;
        }

        //Create a time scale for the timeline
        this._timeScale = d3.time.scale.utc();

        //Create an axis generator for the timeline
        this._timeAxis = d3.svg.axis()
            .scale(this._timeScale)
            .tickSubdivide(true)
            .orient("bottom");

        this._interpolation = options.interpolation || 'linear';

        //Some tweet data constants. Ideal bin count
        //is used when switching zoom levels to determine a binning
        //granularity based on viewable time range.
        this._binSize = options.binSize || 60;

        //The utc offset to render times at.
        this._utcOffset = options.utcOffset || 0;

        var self = this;

        //The function used to get the time value from count bins.
        //The utc offset is added to convert the time *out* of UTC, but
        //we pretend it is still in UTC.
        this._timeAccessor = function (d) {
            return d.time + self._utcOffset;
        };

        this.initUI();
        this.attachEvents();
    };

    /**
     * Attach to model events.
     */
    Timeline.prototype.attachEvents = function () {
        this.interval.on('change', $.proxy(this._onIntervalChanged, this));

        var queryChange = $.proxy(this._onQueryChanged, this);
        this.queries.forEach(function (query) {
            query.on('change', queryChange);
        });
    };

    /**
     * Sets up the UI container and svg element.
     */
    Timeline.prototype.initUI = function() {
        this.ui = {};
        this.ui.svg = d3.select(this.into.selector)
            .append('svg');

        this.loader = loader({
            into: this.into
        });
    };

    /**
     * Render the timeline. Only should be called once.
     * Subsequently, use update.
     */
    Timeline.prototype.render = function () {

        this._buildBoxes();
        this._updateTimeScaleRange();

        this._updateTarget();

        this._renderBackground();

        this._renderTimeAxis();
        this._renderHistogram();

        //A convenient container for anything that needs to be
        //in the same place as the inner box
        this.ui.chartGroup = this.ui.svg.append('svg');

        this._requestData();
    };

    /**
     * Update the timeline. Only should be called after render.
     */
    Timeline.prototype.update = function () {
        this._buildBoxes();
        this._updateTimeScaleRange();

        this._updateTarget();
        this._updateBackground();

        this._updateTimeAxis();
        this._updateHistogram();

        this.ui.chartGroup
            .call(this.boxes.inner);
    };

    /**
     * Request some data for this histogram
     * @private
     */
    Timeline.prototype._requestData = function() {
        //Meant to be overridden
    };


    /**
     * Update the svg element configuration.
     */
    Timeline.prototype._updateTarget = function () {
        this.ui.svg.call(this.boxes.outer);
    };

    /**
     * Render and size the background rectangle.
     */
    Timeline.prototype._renderBackground = function () {
        //Add a background
        this.ui.svg.append('rect')
            .classed('main background', true);

        this._updateBackground();
    };


    /**
     * Update the size of the background rectangle, in case it has changed.
     */
    Timeline.prototype._updateBackground = function () {
        //Size the background
        this.ui.svg.select('rect.main.background')
            .call(this.boxes.outer);
    };

    /**
     * Update the range of the timescale in case the box has changed sizes.
     */
    Timeline.prototype._updateTimeScaleRange = function () {
        this._timeScale.range([0, this.boxes.inner.width()]);
    };

    /**
     * Set up all the rectangles used to calculate sub-component sizes and positions.
     */
    Timeline.prototype._buildBoxes = function () {

        var margin = {
            left: 40,
            right: 20,
            top: 10,
            bottom: 25
        };

        this.boxes = {};

        //The outer box, outside the margin.
        this.boxes.outer = new Rectangle({
            top: 0,
            left: 0,
            width: this._width,
            height: this._height
        });

        //The inner box, inside the margin.
        this.boxes.inner = new Rectangle({
            top: this.boxes.outer.top() + margin.top,
            left: this.boxes.outer.left() + margin.left,
            right: this.boxes.outer.width() - margin.right,
            bottom: this.boxes.outer.height() - margin.bottom
        });
    };

    /**
     * Render the timeline.
     */
    Timeline.prototype._renderHistogram = function () {

        //Use a Histogram to draw the timeline
        this._histogram = new Histogram();

        //Configure the histogram itself
        this._histogram
            .className('histogram')
            .container(this.ui.svg)
            .box(this.boxes.inner)
            .xData(this._timeAccessor)
            .xScale(this._timeScale)
            .interpolate(this._interpolation)
            .render();

        this._updateHistogram();
    };

    Timeline.prototype._renderTimeAxis = function () {
        //Add an x axis
        this.ui.svg.append('g')
            .classed('x axis chart-label', true);

        this._updateTimeAxis();
    };

    /**
     * Translate from offset time into real, external UTC time.
     *
     * @param extent
     * @returns {Array}
     */
    Timeline.prototype.extentToUTC = function(extent) {
        return [
            extent[0] - this._utcOffset,
            extent[1] - this._utcOffset
        ];
    };

    /**
     * Translate from real, external UTC time into offset time.
     *
     * @param extent
     * @returns {Array}
     */
    Timeline.prototype.extentFromUTC = function(extent) {
        return [
            extent[0] + this._utcOffset,
            extent[1] + this._utcOffset
        ];
    };

    /**
     * Called when a query model changes.
     *
     * @param e Event
     * @param query
     * @param field
     */
    Timeline.prototype._onQueryChanged = function (e, query, field) {

    };

    /**
     * Called when the interval model changes.
     *
     * @param e Event
     * @param interval
     * @param field
     * @private
     */
    Timeline.prototype._onIntervalChanged = function (e, interval, field) {

    };

    /**
     * Called when new data is available.
     *
     * @param e Event
     * @param result
     */
    Timeline.prototype._onData = function (e, result) {
        //Update the timeline
        this._updateHistogram();
        this._updateTimeAxis();
    };

    /**
     * Update the histogram.
     * @private
     */
    Timeline.prototype._updateHistogram = function () {
        this._histogram.update();
    };

    /**
     * Update the horizontal axis labels.
     * @private
     */
    Timeline.prototype._updateTimeAxis = function () {
        //Update the time axis
        this.ui.svg.select('g.x.axis.chart-label')
            .attr('transform', new Transform('translate',
                this.boxes.inner.left(), this.boxes.inner.bottom() + AXIS_OFFSET))
            .call(this._timeAxis);
    };

    //Mix in events
    events(Timeline);

    return Timeline;
});