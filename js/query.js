define(['jquery', 'underscore', 'util/events', 'util/semzoom'], function ($, _, events, SemanticZoom) {

    var DATA_DEFAULTS = {
        from: 0,
        to: 1,
        search: ''
    };

    /**
     * Utility to construct a mutator method.
     * @param fieldName
     * @returns {Function}
     */
    var mutator = function (fieldName) {
        return function (fieldValue) {
            if (arguments.length === 0) {
                return this.data[fieldName];
            }
            this.data[fieldName] = fieldValue;
            this._queryChanged();
            return this;
        };
    };

    /**
     * A centralized model for requesting, storing, and notifying about
     * data related to single query.
     *
     * A query represents a single time interval and a series of
     * other filter values. The interval and filter values can be set, which
     * triggers a request for new data.
     *
     * When the new data arrives events are triggered for data
     * belonging to named streams. For example, there could be
     * separate data streams for "tweets", "counts", and "terms".
     *
     * Other code can subscribe these events if it needs to be notified
     * when new data is available.
     *
     * The Query object can be constructed with a set of initial
     * data values, but it also has defaults.
     *
     * @constructor
     */
    var Query = function (data) {

        data = data || {};

        //Initialize the data with the defaults
        this.data = _.defaults(data, DATA_DEFAULTS);

        this.zoom = new SemanticZoom();

//        this.cache = new DataCache();
//        this.cache.requester(function(data) {
//            return $.getJSON('data/query.php', this.data, 'json');
//        });
    };

    /**
     * Get or set the time interval.
     * @param interval
     */
    Query.prototype.interval = function (interval) {
        if (arguments.length === 0) {
            return [this.data.from, this.data.to];
        }
        this.data.from = interval[0];
        this.data.to = interval[1];
        this._intervalChanged();
        return this;
    };

    /**
     * Get or set the 'search' value.
     * @param search
     */
    Query.prototype.search = mutator('search');


    /**
     * Called when a query field changes. Initiates a data request.
     *
     * @private
     */
    Query.prototype._queryChanged = function() {

    };

    /**
     * Called when the interval changes. Initiates a data request, but
     * only for as much new data (time interval) as required, given the current cache.
     *
     * @private
     */
    Query.prototype._intervalChanded = function() {

    };

    //Mix in event methods
    events(Query);

    return Query;
});