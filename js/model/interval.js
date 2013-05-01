define(['underscore', 'util/events', 'util/functions'], function(_, events, functions) {

    var DATA_DEFAULTS = {
        from: 0,
        to: 1
    };

    /**
     * A model for tracking a time interval ('from' and 'to').
     *
     * @constructor
     */
    var Interval = function(data) {

        data = data || {};

        //Initialize the data with the defaults
        this.data = _.defaults(data, DATA_DEFAULTS);
    };

    /**
     * Get or set the 'from' value.
     *
     * @param search
     * @param silent don't trigger an event
     */
    Interval.prototype.from = functions.evented_mutator('data', 'from');

    /**
     * Get or set the 'to' value.
     *
     * @param search
     * @param silent don't trigger an event
     */
    Interval.prototype.to = functions.evented_mutator('data', 'to');

    //Mix in events
    events(Interval);

    return Interval;
});