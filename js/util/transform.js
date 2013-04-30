define([], function() {
    /**
     * An object that can be used to build an SVG transform string.
     *
     * The constructor, as well as the and() method, expect
     * arguments that describe the transform:
     *      - Transform("translate", 3, 6)
     *      - Transform("scale", 1.2, 5)
     * etc...
     */
    var Transform = function() {
        this._transforms = [];
        if (arguments.length) {
            this.and.apply(this, arguments);
        }
    };

    /**
     * Append another transform.
     */
    Transform.prototype.and = function() {

        var transform = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1);

        this._transforms.push(transform + '(' + args.join(',') + ')');
        return this;
    };

    /**
     * Get the transform string.
     */
    Transform.prototype.toString = function() {
        return this._transforms.join(',');
    };

    return Transform;
});