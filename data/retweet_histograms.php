<?php
/**
 * Retweet histograms returns a collection of histograms.
 *
 * A single retweet histogram is defined for a specific time interval, and
 * includes the number of retweets, over time bins, of tweets in that time interval.
 *
 * Given a larger time range and an interval length, retweet_histograms.php will
 * return the retweet historgram for each bin in that time range.
 */

include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$perf = $request->timing();
$db = $request->db();

/**
 * Required parameters are the binned time parameters: from, to, and interval.
 */
$params = $request->binnedTimeParams();

$from = $params->from;
$to = $params->to;
$interval = $params->interval;

//We'll collect the histograms here
$histograms = array();

//Field name constants
$time_field = 'binned_time';
$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';

$end = $to->getTimestamp();
$from_ts = $from->getTimestamp();
for ($current_start = $from_ts; $current_start < $end; $current_start += $interval)
{
    //Get the range of tweets for which we want retweets
    $current_stop = $current_start + $interval;

    //And convert it to a datetime
    $tweets_from = new DateTime("@$current_start");
    $tweets_to = new DateTime("@$current_stop");

    $result = $db->get_grouped_retweets_of_range($tweets_from, $tweets_to,
            $from, $to, $interval);

    $perf->start('processing');

    $groups = new GroupedSeries();

    //Set up the empty bins
    $next_bin = $from_ts;
    while ($next_bin < $end)
    {
        $groups->get_group(1)->add_bin($next_bin);
        $groups->get_group(0)->add_bin($next_bin);
        $groups->get_group(-1)->add_bin($next_bin);

        $next_bin += $interval;
    }

    //Fill the bins
    $next_bin = (int) $params->from;
    while ($row = $result->fetch_assoc())
    {
        $binned_time = $row[$time_field];

        $positive_bin = $groups->get_group(1)->get_bin_at($binned_time);
        $positive_bin->count = (int) $row[$positive_count_field];

        $negative_bin = $groups->get_group(-1)->get_bin_at($binned_time);
        $negative_bin->count = (int) $row[$negative_count_field];

        $neutral_bin = $groups->get_group(0)->get_bin_at($binned_time);
        $neutral_bin->count = (int) $row[$neutral_count_field];

        $next_bin += $interval;
    }
    $result->free();

    $histograms[] = $groups;
    $perf->stop('processing');
}
$request->response($histograms);
