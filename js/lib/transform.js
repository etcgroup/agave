define(['underscore'], function(_) {
    var Transform = function() {
        this._transforms = [];
        this.and.apply(this, arguments);
    };

    Transform.prototype.and = function() {

        var transform = arguments[0];
        var args = Array.prototype.slice.call(arguments, 1);

        this._transforms.push(transform + '(' + args.join(',') + ')');
        return this;
    }

    Transform.prototype.toString = function() {
        return this._transforms.join(',');
    }
    
    return Transform;
});