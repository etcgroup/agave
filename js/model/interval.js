define(['underscore', 'util/events', 'util/functions'], function(_, events, functions) {

    var DATA_DEFAULTS = {
        from: 0,
        to: 1,
        min: 0,
        max: 1
    };

    /**
     * A model for tracking a time interval ('from' and 'to').
     *
     * The underlying data object can be accessed directly if you really want it.
     *
     * @constructor
     */
    var Interval = function(data) {

        data = data || {};

        //Initialize the data with the defaults
        this.data = _.defaults(data, DATA_DEFAULTS);
    };

    /**
     * Set a multiple fields all at once. Triggers change if any were different.
     *
     * Returns true on success, or false if some field was invalid.
     * If invalid, this.invalid will be set to a useful message.
     *
     * TODO: validation (some useful arrays are at the top here)
     *
     * @param data
     * @returns {boolean}
     */
    Interval.prototype.set = functions.evented_setter('data');

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

    /**
     * Centers the current window around a specific time frame with adjusting the window size
     *
     * @param search
     * @param silent don't trigger an event
     */
    Interval.prototype.centerAround = function(time) {
        var intervalWidth = this.to() - this.from();

        this.set({
            from: time - (intervalWidth * 0.5),
            to: time + (intervalWidth * 0.5)
        });
    }


    /**
     * Gets/sets the minimum value
     *
     * @param val value to assign to min
     */
     Interval.prototype.min = function(val) {
        if(!arguments.length) {
            return this.data.min;
        } else {
            this.data.min = val;
        }
     }

    /**
     * Gets/sets the maximum value
     *
     * @param val value to assign to max
     */
     Interval.prototype.max = function(val) {
        if(!arguments.length) {
            return this.data.max;
        } else {
            this.data.max = val;
        }
     }

    /**
     * Sets the range
     *
     */
     Interval.prototype.setRange = function(min,max) {
        this.data.min = min;
        this.data.max = max;
     }


     /**
      * Gets the extent
      *
      */
     Interval.prototype.getExtent = function() {
        return [
            this.data.from,
            this.data.to
        ];
     }


     /**
      * Gets the range (min/max) extent
      *
      */
     Interval.prototype.getRangeExtent = function() {
        return [
            this.data.min,
            this.data.max
        ];
     }


    //Mix in events
    events(Interval);

    return Interval;
});