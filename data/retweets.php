<?php

/**
 * retweets.php returns counts of retweets over time.
 *
 * Retweets are binned by time and counts are returned.
 */
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$db = $request->db();
$perf = $request->timing();

/**
 * Required parameters are the binned time parameters (from, to, interval).
 *
 * Optional parameters are:
 *      - 'of_id', if retweets are desired of a specific tweet only
 *      - 'of_from' and 'of_to' if retweets are desired for tweets in a range
 *      - 'search' for retweets matching a search query
 *
 * The optional parameters besides search may be non-functional.
 */
$params = $request->get(
        array(), array('of_id', 'of_from', 'of_to', 'search')
);
$timeParams = $request->binnedTimeParams();

$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;
$search = $params->search;

//Database field names
$time_field = 'binned_time';
$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';
$count_field = 'count';

//Depending on what was requested, the result may have sentiment division included
//or not. $hasSentiment is set depending on which type of query will be run.
if ($params->of_id !== NULL)
{
    $result = $db->get_grouped_retweets_of_id($params->of_id, $from, $to,
            $interval);
    $hasSentiment = FALSE;
}
else if ($params->of_from !== NULL && $params->of_to !== NULL)
{
    $of_from = (int) ($params->of_from / 1000);
    $of_to = (int) ($params->of_to / 1000);

    $tweets_from = new DateTime("@$of_from");
    $tweets_to = new DateTime("@$of_to");

    $result = $db->get_grouped_retweets_of_range($tweets_from, $tweets_to,
            $from, $to, $interval);
    $hasSentiment = TRUE;
}
else
{
    $result = $db->get_grouped_retweets($from, $to, $interval, $search);
    $hasSentiment = FALSE;
}

$perf->start('processing');

$groups = new GroupedSeries();

$next_bin = $from->getTimestamp();
$end = (int) $to->getTimestamp();
while ($next_bin < $end)
{
    if ($hasSentiment)
    {
        $groups->get_group(1)->add_bin($next_bin);
        $groups->get_group(0)->add_bin($next_bin);
        $groups->get_group(-1)->add_bin($next_bin);
    }
    else
    {
        //Only initialize a single data series if not using sentiment.
        $groups->get_group(0)->add_bin($next_bin);
    }

    $next_bin += $interval;
}

foreach ($result as $row)
{
    $binned_time = $row[$time_field];

    if ($hasSentiment)
    {
        $positive_bin = $groups->get_group(1)->get_bin_at($binned_time);
        $positive_bin->count = (int) $row[$positive_count_field] / (double) $interval;

        $negative_bin = $groups->get_group(-1)->get_bin_at($binned_time);
        $negative_bin->count = (int) $row[$negative_count_field] / (double) $interval;

        $neutral_bin = $groups->get_group(0)->get_bin_at($binned_time);
        $neutral_bin->count = (int) $row[$neutral_count_field] / (double) $interval;
    }
    else
    {
        $count_bin = $groups->get_group(0)->get_bin_at($binned_time);
        $count_bin->count = (int) $row[$count_field] / (double) $interval;
    }
}


$perf->stop('processing');

if ($hasSentiment)
{
    //We need to output all 3 sentiment groups
    $request->response($groups);
}
else
{
    //We need to output only one series
    $request->response($groups->get_group(0)->values);
}
