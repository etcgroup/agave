define([], function() {

    /**
     * A collection (potentially) of sampling-related algorithms.
     * @type {{}}
     */
    var sampling = {};

    /**
     * Downsample a series of {time:..., count:...} objects.
     *
     * @param dataSeries
     * @param samplingFactor the factor by which to reduce the data.
     * A sampling factor of 2 means that you will get back roughly half as many bins.
     * @returns {Array}
     */
    sampling.downsample = function (dataSeries, samplingFactor) {
        var result = [];

        var inputLen = dataSeries.length;
        var outputLen = Math.ceil(inputLen / samplingFactor);

        var wingSize = samplingFactor; // the number of bins on either side of the center of the window
        //Initialize the output array
        for (var outputIdx = 0; outputIdx < outputLen; outputIdx++) {

            //Initialize the window
            var reversedIdx = outputIdx * samplingFactor;
            var bin = {
                count: 0,
                time: dataSeries[reversedIdx].time
            };
            result.push(bin);

            //Determine the window
            var from = Math.max(0, reversedIdx - wingSize),
                to = Math.min(inputLen - 1, reversedIdx + wingSize);

            //Add all the values in the window
            for (var inputIdx = from; inputIdx < to; inputIdx++) {
                bin.count += dataSeries[inputIdx].count;
            }
            //Divide by the number of counts that were added
            bin.count /= (to - from);
        }

        return result;
    };


    return sampling;
});