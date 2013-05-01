define(['underscore', 'util/events', 'util/functions'], function (_, events, functions) {

    var DATA_DEFAULTS = {
        search: ''
    };

    /**
     * A model for data related to single query.
     *
     * A query represents a series of filter values. The
     * filter values can be set, which triggers "change" events.
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
    };

    /**
     * Get or set the 'search' value.
     *
     * @param search
     * @param silent don't trigger an event
     */
    Query.prototype.search = functions.evented_mutator('data', 'search');

    //Mix in event methods
    events(Query);

    return Query;
});