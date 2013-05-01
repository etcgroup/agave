define(['jquery'], function ($) {

    var on = function () {
        var $this = $(this);
        return $this.on.apply($this, arguments);
    };

    var off = function() {
        var $this = $(this);
        return $this.off.apply($this, arguments);
    };

    var trigger = function () {
        var $this = $(this);
        var eventName = arguments[0];
        var data = Array.prototype.slice.call(arguments, 1);
        return $this.triggerHandler(eventName, data);
    };

    var events = function(Class) {
        Class.prototype.on = on;
        Class.prototype.off = off;
        Class.prototype.trigger = trigger;
    };

    return events;
});
