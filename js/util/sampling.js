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
        var outputLen = Math.floor(inputLen / samplingFactor);

//        var inputsPerOutput = 2 * samplingFactor - 1;

        //the offset from the left edge of the window to the center
        var windowCenterOffset = Math.floor(samplingFactor / 2);

        for (var outputIdx = 0; outputIdx < outputLen; outputIdx++) {

            var centerIdx = samplingFactor * outputIdx + windowCenterOffset;

            var bin = {
                count: dataSeries[centerIdx].count,
                time: dataSeries[centerIdx].time
            };
            result.push(bin);
        }

        return result;
    };


    return sampling;
});