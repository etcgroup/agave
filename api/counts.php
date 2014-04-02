<?php
/**
 * counts.php returns the number of tweets over time, divided
 * by sentiment classification as -1, 0, or 1.
 *
 * Tweets are binned by time and the count of positive, negative, and neutral
 * tweets in each time bin is returned.
 */


include_once '../util/data.inc.php';
include_once '../util/request.inc.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

/**
 * Requests to /counts.php should provide the binned time parameters:
 * from, to, and interval.
 *
 * Optionally, a text search parameter can be provided.
 */
$params = $request->get(array(), array('split_sentiment'));
$timeParams = $request->binnedTimeParams();
$filter = $request->queryParameters();

//Get the retrieved parameters
$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;

//Some constants that refer to field names in the SELECT query
$total_count_field = 'count';
$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';
$time_field = 'binned_time';

$split_sentiment = $params->split_sentiment;
if ($split_sentiment === NULL || $split_sentiment === 'true') {
    $split_sentiment = TRUE;
} else {
    $split_sentiment = FALSE;
}

//Execute the database query
$result = $db->get_grouped_counts($from, $to, $interval, $split_sentiment, $filter->rt, $filter->min_rt, $filter->search, $filter->sentiment, $filter->author);

$perf->start('processing');

//A container for storing the results
$bin_counts = array();

//The database will fail to return any count at all for bins with no contents
//so we need to initialize all the bins to be empty before we even look
//at the data.
$next_bin = $interval * floor($from->getTimestamp() / $interval);
$end = $to->getTimestamp();
while ($next_bin < $end)
{
    if ($split_sentiment) {
        $bin_counts[$next_bin] = array($next_bin * 1000, 0,0,0,0);
    } else {
        $bin_counts[$next_bin] = array($next_bin * 1000, 0);
    }

    $next_bin += $interval;
}

//Now go through the database results and fill in the binned data
foreach ($result as $row)
{
    //The time for this row
    $binned_time = $row[$time_field];

    if ($split_sentiment) {
        $bin_counts[$binned_time] = array($binned_time * 1000,
            $row[$total_count_field] / (double)$interval,
            $row[$negative_count_field] / (double)$interval,
            $row[$neutral_count_field] / (double)$interval,
            $row[$positive_count_field] / (double)$interval);
    } else {
        $bin_counts[$binned_time] = array($binned_time * 1000,
            $row[$total_count_field] / (double)$interval);
    }
}

$perf->stop('processing');

//Emit the response
$request->response(array_values($bin_counts));