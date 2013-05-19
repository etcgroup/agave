define(['jquery', 'underscore'], function($, _) {

    var DEFAULT_OPTIONS = {};
    var POSITION_OFFSET = {
        top: 5,
        left: 15
    };

    var Tooltip = function(options) {
        options = _.defaults(options || {}, DEFAULT_OPTIONS);

        this.parent = options.parent || $('body');
        this.el = $('<div>')
            .appendTo(this.parent)
            .addClass('tooltip fade');

        this.inner = this.el.append('<div>')
            .addClass('tooltip-inner');
    };

    Tooltip.prototype.show = function(offset, contents) {
        this.el.html(contents);

        this.el.offset({
            top: offset.top + POSITION_OFFSET.top,
            left: offset.left + POSITION_OFFSET.left
        });
        this.el.show();

        //force reflow
        this.el[0].offsetWidth;
        this.el.addClass('in');
    };

    Tooltip.prototype.hide = function() {
        var el = this.el.removeClass('in');

        if ($.support.transition) {
            this.el.one($.support.transition.end, function() {
                el.hide();
            });
        }
    };

    return Tooltip;
});