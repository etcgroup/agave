define(['underscore'], function(_) {

    /**
     * A collection of functions useful for *building* various other functions.
     */
    var functions = {};

    /**
     * Utility to construct a mutator method that
     * triggers a 'change' event.
     *
     * @param blobName the name of the object on 'this' that contains the field
     * @param fieldName the name of the field in the blob
     * @param [eventName] the name of the event to trigger (defaults to 'change')
     * @returns {Function}
     */
    functions.evented_mutator = function(blobName, fieldName, eventName) {
        eventName = eventName || 'change';

        return function (fieldValue, silent) {

            //The blob is the object that contains the field
            var blob = this[blobName];

            if (!arguments.length) {
                //Just return the value
                return blob[fieldName];
            }

            if (blob[fieldName] !== fieldValue) {
                //Set the value and fire a change event
                var oldValue = blob[fieldName];
                blob[fieldName] = fieldValue;

                //Don't trigger the event if silent was set
                if (!silent) {
                    this.trigger(eventName, this, fieldName);
                }
            }

            //Return this to allow chaining
            return this;
        };
    };

    /**
     * Utility to construct a mass 'set' method
     * that can be used to set a bunch of properties of an object at once.
     *
     * @param blobName the name of the object on 'this' that should be changed
     * @param [eventName] the name of the event to trigger (defaults to 'change')
     * @returns {Function}
     */
    functions.evented_setter = function(blobName, eventName) {
        eventName = eventName || 'change';

        return function(data, silent) {
            var blob = this[blobName];

            //Pull any non-set values from the current data blob
            data = _.defaults(data, blob);

            //See if there is anything to do
            if (_.isEqual(blob, data)) {
                //All good :)
                return true;
            }

            //Save
            this[blobName] = data;

            //Don't trigger if silent was et
            if (!silent) {
                this.trigger('change', this);
            }

            return true;
        };
    };

    return functions;
});