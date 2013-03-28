define(['jquery', 'lib/d3',
    'vis/tweet_timeline'],
    function($, d3, TweetTimeline) {
        //        //For the SAGAwards data
        //        var from = 1359327600*1000;
        //        var to = 1359334800*1000;
        //        var interval = 60*2*1000;
        //        var min_important_rt = 1;

        //For the superbowl data
        var params = document.location.search;
        var SB_START = 1359932400;
        var SB_END = 1359952200;

        var from = getParameterByName(params, 'start', SB_START) * 1000;
        var to = getParameterByName(params, 'end', SB_END) * 1000;
        var searchQuery = getParameterByName(params, 'q', null);

        var min_important_rt = 1;
        var utcOffsetMillis = -5 * 60 * 60 * 1000;

        var width = $('#tweetstream').width();

        var timeline = new TweetTimeline();

        timeline.width(width)
        .height(500)
        .retweetHeight(70)
        .noiseHeight(70)
        .noiseThreshold(min_important_rt)
        .searchQuery(searchQuery)
        .utcOffsetMillis(utcOffsetMillis)
        .idealBinCount(200)
        .timeExtent([from, to])
        .onZoomChanged(function(extent) {
            from = extent[0];
            to = extent[1];

            updateState();
        });

        var container = d3.select('#tweet-timeline');
        timeline.container(container)
        .render();

        var searchInput = $('#search-query-input');

        searchInput.val(searchQuery);
        $('#search-form').on('submit', function(e) {
            e.preventDefault();
            updateState();
            return false;
        });

        function updateState() {
            var query = searchInput.val();
            var start = from / 1000;
            var end = to / 1000;

            var state = {
                q: query,
                start: start,
                end: end
            }

            history.pushState(state, query, '?' + $.param(state));
        }

        function getParameterByName(queryString, name, defaultValue)
        {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(queryString);
            if(results == null)
                return defaultValue;
            else
                return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    });
