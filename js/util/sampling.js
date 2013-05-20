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

        //Initialize the output array
        for (var outputIdx = 0; outputIdx < outputLen; outputIdx++) {
            var reversedIdx = outputIdx * samplingFactor;
            result.push({
                count: 0,
                time: dataSeries[reversedIdx].time
            });
        }

        var lostSamples = samplingFactor;
        var contributingSamples = 2 * samplingFactor;
        for (var inputIdx = 0; inputIdx < inputLen - lostSamples; inputIdx++) {
            //what output bins do I contribute to?

            var mappedIdx = inputIdx / samplingFactor;

            var inputData = dataSeries[inputIdx].count / contributingSamples;

            result[Math.floor(mappedIdx)].count += inputData;
            result[Math.ceil(mappedIdx)].count += inputData;
        }

        return result;
    };


    return sampling;
});