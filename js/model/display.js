define(['underscore', 'util/events', 'util/functions'], function(_, events, functions) {

    var DATA_DEFAULTS = {
        mode: 'simple',
        focus: null,
        annotations: true
    };

    /**
     * A model for tracking the current display configuration.
     *
     * The underlying data object can be accessed directly if you really want it.
     *
     * @constructor
     */
    var Display = function(data) {

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
    Display.prototype.set = functions.evented_setter('data');

    /**
     * Get or set the 'mode' value.
     *
     * @param view
     * @param silent don't trigger an event
     */
    Display.prototype.mode = functions.evented_mutator('data', 'mode');

    /**
     * Get or set the 'focus' value.
     *
     * @param focus
     * @param silent don't trigger an event
     */
    Display.prototype.focus = functions.evented_mutator('data', 'focus');

    /**
     * Get or set the 'annotations' value.
     *
     * @param show
     * @type {Function}
     */
    Display.prototype.annotations = functions.evented_mutator('data', 'annotations');

    events(Display);

    return Display;

});