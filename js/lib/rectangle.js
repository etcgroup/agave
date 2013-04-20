define(['underscore'], function(_) {

    /**
     * Rectangle is a class for managing a bounding box.
     *
     * It should be created with an object defining the size and position
     * of the box. The specification must be sufficient to comipletely
     * define the width, height, and position of the box.
     *
     * For the vertical dimension, any of these combos work:
     *      - top, height
     *      - top, bottom
     *      - height, bottom
     *
     * For the horizontal dimension, any of these combos work:
     *      - left, width
     *      - left, right
     *      - width, right
     */
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
        /**
         * Calculate the position of the center of the box.
         *
         * An object with keys x and y is returned.
         */
        center: function() {
            return {
                y: this.options.top + this.options.height * 0.5,
                x: this.options.left + this.options.width * 0.5
            };
        },

        /**
         * Get the top of the box.
         */
        top: function() {
            return this.options.top;
        },

        /**
         * Get the bottom of the box.
         */
        bottom: function() {
            return this.options.top + this.options.height;
        },

        /**
         * Get the left side of the box.
         */
        left: function() {
            return this.options.left;
        },

        /**
         * Get the right side of the box.
         */
        right: function() {
            return this.options.left + this.options.width;
        },

        /**
         * Get the width of the box.
         */
        width: function() {
            return this.options.width
        },

        /**
         * Get the height of the box.
         */
        height: function() {
            return this.options.height;
        },

        /**
         * Make a new box with the same settings as this box
         * plus some overrides.
         */
        extend: function(options) {
            return new Rectangle(_.defaults(options, this.options));
        },

        /**
         * Use this rectangle to set x, y, width, and height
         * attributes on a selection.
         */
        apply: function(selection) {
            selection.attr('width', this.options.width)
            .attr('height', this.options.height)
            .attr('x', this.options.left)
            .attr('y', this.options.top)
        }
    });

    return Rectangle;
});