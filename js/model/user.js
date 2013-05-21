define(['underscore', 'util/events', 'util/functions'], function(_, events, functions) {

    var DATA_DEFAULTS = {
        name: null
    };

    /**
     * A model for tracking a user.
     *
     * The underlying data object can be accessed directly if you really want it.
     *
     * @constructor
     */
    var User = function(data) {

        data = data || {};

        //Initialize the data with the defaults
        this.data = _.defaults(data, DATA_DEFAULTS);

        this._signed_in = false;
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
    User.prototype.set = functions.evented_setter('data');

    /**
     * Get or set the 'name' value.
     *
     * @param search
     * @param silent don't trigger an event
     */
    User.prototype.name = functions.evented_mutator('data', 'name');

    /**
     * Get or set the signed_in value.
     *
     * @type {Function}
     */
    User.prototype.signed_in = function() {
        return this._signed_in;
    };

    User.prototype.sign_me_in = function(userData) {
        this.set(userData);

        this._signed_in = true;

        this.trigger('signed-in');
    };

    User.prototype.sign_me_out = function() {
        this.set({
            name: null
        });

        this._signed_in = false;

        this.trigger('signed-out');
    };

    events(User);

    return User;

});