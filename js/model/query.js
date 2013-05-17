define(['underscore', 'util/events', 'util/functions'], function (_, events, functions) {

    var DEFAULT_DATA = {
        search: null,
        author: null,
        rt: false,
        min_rt: 0,
        sentiment: null
    };

    var VALID_VIEW_MODES = ['area', 'stacked', 'expand', 'hidden'];

    /**
     * A model for data related to single query.
     *
     * A query represents a series of filter values. The
     * filter values can be set, which triggers "change" events.
     *
     * The Query object can be constructed with a set of initial
     * data values, but it also has defaults.
     *
     * The underlying data object can be accessed directly if you really want it.
     *
     * @constructor
     */
    var Query = function (data) {

        data = data || {};

        //Initialize the data with the defaults
        this.data = _.defaults(data, DEFAULT_DATA);
    };


    /**
     * Set a bunch of fields all at once. Triggers change if any were different.
     *
     * Returns true on success, or false if some field was invalid.
     * If invalid, this.invalid will be set to a useful message.
     *
     * TODO: validation (some useful arrays are at the top here)
     *
     * @param data
     * @returns {boolean}
     */
    Query.prototype.set = functions.evented_setter('data');

    /**
     * Get 'id' value.
     */
    Query.prototype.id = function() {
        return this.data.id;
    };

    /**
     * Get or set the 'search' value.
     *
     * @param search
     * @param silent don't trigger an event
     */
    Query.prototype.search = functions.evented_mutator('data', 'search');

    /**
     * Get or set the 'view' value.
     *
     * @type {Function}
     */
    Query.prototype.view = functions.evented_mutator('data', 'view');

    /**
     * Get or set the 'author' value.
     *
     * @type {Function}
     */
    Query.prototype.author = functions.evented_mutator('data', 'author');

    /**
     * Get or set the 'rt' value.
     *
     * @type {Function}
     */
    Query.prototype.rt = functions.evented_mutator('data', 'rt');

    /**
     * Get or set the 'min_rt' value.
     *
     * @type {Function}
     */
    Query.prototype.min_rt = functions.evented_mutator('data', 'min_rt');

    /**
     * Get or set the 'sentiment' value.
     *
     * @type {Function}
     */
    Query.prototype.sentiment = functions.evented_mutator('data', 'sentiment');

    //Mix in event methods
    events(Query);

    return Query;
});