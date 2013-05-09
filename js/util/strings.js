define([], function () {

    /**
     * A collection of string-related helpers
     */
    var strings = {};

    /**
     * Shortens the given string to at most max_length.
     * Tries to cut on word boundaries.
     * Adds ellipses.
     *
     * Based on http://snipplr.com/view/40259/
     */
    strings.snippet = function(string, max_length) {
        if (string.length <= max_length) {
            return string;
        }

        var xMaxFit = max_length - 3;
        var xTruncateAt = string.lastIndexOf(' ', xMaxFit);
        if (xTruncateAt === -1 || xTruncateAt < max_length / 2) {
            xTruncateAt = xMaxFit;
        }

        return string.substr(0, xTruncateAt) + "...";
    };

    return strings;

});