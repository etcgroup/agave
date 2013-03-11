define(['underscore'], function(_) {
    var Rectangle = function(options) {
        if (_.has(options, 'bottom')) {
            if (_.has(options, 'top')) {
                options.height = options.bottom - options.top;
            } else if (_.has(options, 'height')) {
                options.top = options.bottom - options.height;
            } else {
                throw 'Rectangle given bottom but no top or height';
            }

            delete options.bottom;
        }
        if (_.has(options, 'right')) {
            if (_.has(options, 'left')) {
                options.width = options.right - options.left;
            } else if (_.has(options, 'width')) {
                options.left = options.right - options.width;
            } else {
                throw 'Rectangle given right but no left or width';
            }
            delete options.right;
        }

        if (!_.has(options, 'left')) {
            throw new 'Rectangle has no left side!';
        }
        if (!_.has(options, 'top')) {
            throw new 'Rectangle has no top!';
        }
        if (!_.has(options, 'width')) {
            throw new 'Rectangle has no width!';
        }
        if (!_.has(options, 'height')) {
            throw new 'Rectangle has no height!';
        }

        this.options = options;
    }

    _.extend(Rectangle.prototype, {
        center: function() {
            return {
                y: this.options.top + this.options.height * 0.5,
                x: this.options.left + this.options.width * 0.5
            };
        },

        top: function() {
            return this.options.top;
        },

        bottom: function() {
            return this.options.top + this.options.height;
        },

        left: function() {
            return this.options.left;
        },

        right: function() {
            return this.options.left + this.options.width;
        },

        width: function() {
            return this.options.width
        },

        height: function() {
            return this.options.height;
        },

        extend: function(options) {
            return new Rectangle(_.defaults(options, this.options));
        },

        apply: function(selection) {
            selection.attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('x', this.options.left)
            .attr('y', this.options.top)
        }
    });

    return Rectangle;
});