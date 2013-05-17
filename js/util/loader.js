define(['jquery', 'underscore', 'lib/spin', 'lib/bootstrap'], function ($, _, Spinner, bootstrap) {

    //Some handy presets
    var presets = {
        tiny: { lines: 8, length: 2, width: 2, radius: 3 },
        small: { lines: 8, length: 4, width: 3, radius: 5 },
        large: { lines: 10, length: 8, width: 4, radius: 8 }
    };

    //Defaults for all configurations
    var defaults = {
        color: null
    };

    var loader = function (options) {
        var into = options.into || $('<div>');
        var preset = presets[options.style || 'large'];
        var delay = options.delay || 100;

        var opt = _.defaults(options.options || {}, preset, defaults);

        var spinner = new Spinner(opt);
        var el, $el;

        var showing = false;
        var active = {};

        var showTimeout = null;

        var show = function () {
            if (showing) {
                return;
            }

            showing = true;

            showTimeout = setTimeout(function() {
                showTimeout = null;

                spinner.spin();
                el = spinner.el;
                $el = $(el);

                if ($.support.transition) {
                    $el.off($.support.transition.end);
                }
                
                //start invisible and fade in/out
                $el.addClass('fade');

                //Add to target container
                $el.appendTo(into);

                //Position the spinner
                $el.css({
                    position: 'absolute',
                    top: '50%',
                    left: '50%'
                });

                //Force reflow before making it visible
                el.offsetWidth;

                //Fade in
                $el.addClass('in');
            }, delay);
        };

        var hide = function () {
            if (!showing) {
                return;
            }

            showing = false;
            if (showTimeout) {
                //It hasn't even been shown yet
                clearTimeout(showTimeout);
                showTimeout = null;
            } else {

                //Fade out
                $el.removeClass('in');

                //When done fading, stop/remove the spinner
                $el.one($.support.transition.end, function () {
                    spinner.stop();
                });
            }
        };

        return {
            start: function (id) {
                id = id || 0;

                active[id] = true;

                show();
            },

            stop: function (id) {
                id = id || 0;

                active[id] = false;

                //Only hide if no more active
                var allDone = _.all(active, function (v) {
                    return !v;
                });

                if (allDone) {
                    hide();
                }
            }
        };
    };

    return loader;
});