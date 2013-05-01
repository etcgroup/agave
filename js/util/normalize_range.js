define(['lib/d3'], function(d3) {

    /**
     * Given a desired time interval and number of bins to show,
     * calculate a normalized time interval and reasonable number of
     * bins to show in that interval.
     *
     * The result includes a modified from & to, in addition
     * to a modified number of bins.
     *
     * There is also the bin_width in seconds, for convenience.
     *
     * @param from the interval starting time
     * @param to the interval ending time
     * @param bins the desired number of bins
     *
     * @returns {{from: number, to: number, bins: number, bin_width: number}}
     */
    function normalize_range(from, to, bins) {
        var settings = sz_ticks([from, to], bins);

        from = +settings[0];
        to = +settings[1];
        var bin_width = settings[2];

        return {
            from: from,
            to: to,
            bins: (to - from) / bin_width,
            bin_width: bin_width
        };
    }

    //////////////////////////////////////////////////////////
    /////// A bunch of modified timing code from d3 //////////
    ///// allows getting time a pre-defined granularities ////
    //////////////////////////////////////////////////////////

    var sz_time_scaleSetYear = function(y) {
        var d = new Date(y, 0, 1);
        d.setFullYear(y);
        return d;
    };
    var sz_time_scaleGetYear = function(d) {
        var y = d.getFullYear(), d0 = sz_time_scaleSetYear(y), d1 = sz_time_scaleSetYear(y + 1);
        return y + (d - d0) / (d1 - d0);
    };
    var sz_time_scaleSteps = [
        1e3,
        2e3,
        5e3,
        10e3,
        15e3,
        30e3,
        6e4,
        12e4,
        3e5,
        6e5,
        9e5,
        18e5,
        36e5,
        72e5,
        108e5,
        216e5,
        432e5,
        864e5,
        1728e5,
        6048e5,
        2592e6,
        7776e6,
        31536e6
    ];

    var sz_time_scaleLocalMethods = [
        [ d3.time.second, 1 ],
        [ d3.time.second, 2 ],
        [ d3.time.second, 5 ],
        [ d3.time.second, 10 ],
        [ d3.time.second, 15 ],
        [ d3.time.second, 30 ],
        [ d3.time.minute, 1 ],
        [ d3.time.minute, 2 ],
        [ d3.time.minute, 5 ],
        [ d3.time.minute, 10 ],
        [ d3.time.minute, 15 ],
        [ d3.time.minute, 30 ],
        [ d3.time.hour, 1 ],
        [ d3.time.hour, 2 ],
        [ d3.time.hour, 3 ],
        [ d3.time.hour, 6 ],
        [ d3.time.hour, 12 ],
        [ d3.time.day, 1 ],
        [ d3.time.day, 2 ],
        [ d3.time.week, 1 ],
        [ d3.time.month, 1 ],
        [ d3.time.month, 3 ],
        [ d3.time.year, 1 ]
    ];
    var sz_time_scaleLinear = d3.scale.linear();
    sz_time_scaleLocalMethods.year = function(extent, m) {
        return sz_time_scaleLinear.domain(extent.map(sz_time_scaleGetYear)).ticks(m).map(sz_time_scaleSetYear);
    };
    var sz_time_scaleExtent = function(domain) {
        var start = domain[0], stop = domain[domain.length - 1];
        return start < stop ? [ start, stop ] : [ stop, start ];
    };

    var sz_time_scaleDate = function(t) {
        return new Date(t);
    };

    var sz_ticks = function(domain, desiredTicks) {
        var extent = sz_time_scaleExtent(domain.map(sz_time_scaleDate));

        var span = extent[1] - extent[0], target = span / desiredTicks, i = d3.bisect(sz_time_scaleSteps, target);

        //At the end of the array -- use special years ticks
        var ticksFallback = null;
        if (i === sz_time_scaleSteps.length) {
            ticksFallback = sz_time_scaleLocalMethods.year(extent, desiredTicks);
        }

        //No reasonable units, so use linear scale
        if (!i) {
            ticksFallback = d3.scale.linear()
                .domain(domain)
                .ticks(desiredTicks).map(sz_time_scaleDate);
        }

        if (ticksFallback) {
            return [ticksFallback[0], ticksFallback[ticksFallback.length - 1], ticksFallback[1] - ticksFallback[0]];
        }

        //Should we use the next smaller unit?
        if (Math.log(target / sz_time_scaleSteps[i - 1]) < Math.log(sz_time_scaleSteps[i] / target)) {
            --i;
        }

        //What units
        //            var units = sz_time_scaleLocalMethods[i][0];

        var width = sz_time_scaleSteps[i];
        var startPoint = Math.ceil(extent[0] / width) * width;
        var endPoint = Math.floor(extent[1] / width) * width;

        //            var startPoint = units.ceil(extent[0]);
        //            var endPoint = units.floor(extent[1]);
        return [startPoint, endPoint, width];
    };

    return normalize_range;
});