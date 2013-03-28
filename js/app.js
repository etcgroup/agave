define(['jquery', 'lib/d3',
    'vis/tweet_timeline'],
    function($, d3, TweetTimeline) {
        //        //For the SAGAwards data
        //        var from = 1359327600*1000;
        //        var to = 1359334800*1000;
        //        var interval = 60*2*1000;
        //        var min_important_rt = 1;

        //For the superbowl data
        var from = 1359932400*1000;
        var to = 1359952200*1000;
        var min_important_rt = 1;
        var utcOffsetMillis = -5 * 60 * 60 * 1000;

        var width = $('#tweetstream').width();

        var params = document.location.search;
        var searchQuery = getParameterByName(params, 'q');

        var timeline = new TweetTimeline();

        (function() {
            var startExtent = [from + utcOffsetMillis, to + utcOffsetMillis];

            timeline.width(width)
            .height(500)
            .retweetHeight(70)
            .noiseHeight(70)
            .noiseThreshold(min_important_rt)
            .searchQuery(searchQuery)
            .utcOffsetMillis(utcOffsetMillis)
            .idealBinCount(100)
            //            .interpolate('step-before')
            .timeScale().domain(startExtent);

            var container = d3.select('#tweet-timeline');
            timeline.container(container)
            .render();
        })();

        var searchInput = $('#search-query-input');
        searchInput.val(searchQuery);
        $('#search-form').on('submit', function(e) {
            e.preventDefault();

            var query = searchInput.val();
            var state = {
                q: query
            }

            history.pushState(state, query, '?' + $.param(state));

//            timeline.searchQuery(query)
//            .update();

            return false;
        });


        function getParameterByName(queryString, name)
        {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(queryString);
            if(results == null)
                return "";
            else
                return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    });
