define(['underscore'], function(_) {

    var from_number = {
        '-1': 'negative',
        '0': 'neutral',
        '1': 'positive',
        '': 'combined'
    };

    var numbers = _.keys(from_number);
    var strings = _.values(from_number);
    var classes = _.map(strings, function(str) {
        return 'sentiment-' + str;
    });

    var to_number = _.invert(from_number);

    var sentiment = {
        from_number: function(num) {
            return from_number[num];
        },
        to_number: function(str) {
            return to_number[str];
        },
        numbers: numbers,
        strings: strings,
        classes: classes
    };

    return sentiment;
});