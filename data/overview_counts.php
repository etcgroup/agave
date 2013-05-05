<?php
/**
 * overview_counts.php returns the simple number of tweets over time within a time range.
 *
 * Tweets are binned by time and the count of positive, negative, and neutral
 * tweets in each time bin is returned.
 *
 * A minimum retweet-count threshold is provided. Tweets will only be counted
 * if they exceed this threshold, filtering out noisey tweets.
 */


include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();

//Initialize the db connection
$db = $request->db();
//Get the performance tracker
$perf = $request->timing();

/**
 * Requests to /by_time.php should provide the binned time parameters:
 * from, to, and interval (bin size in seconds).
 */
$timeParams = $request->binnedTimeParams();

//Get the retrieved parameters
$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;

//Some constants that refer to field names in the SELECT query
$time_field = 'binned_time';
$count_field = 'count';

//Execute the database query
$result = $db->get_grouped_counts($from, $to, $interval);

$perf->start('processing');

//A container for storing the results
$groups = new GroupedSeries();

//The database will fail to return any count at all for bins with no contents
//so we need to initialize all the bins to be empty before we even look
//at the data.
$next_bin = $from->getTimestamp();
$end = $to->getTimestamp();
while ($next_bin < $end)
{
    $groups->get_group(0)->add_bin($next_bin);
    $next_bin += $interval;
}

//Now go through the database results and fill in the binned data
while ($row = $result->fetch_assoc())
{
    //The time for this row
    $binned_time = $row[$time_field];

    //Get the neutral bin at this time
    $neutral_bin = $groups->get_group(0)->get_bin_at($binned_time);
    $neutral_bin->count = (int) $row[$count_field] / (double)$interval;
}
$result->free();

$perf->stop('processing');

//We need to output only one series
$request->response($groups->get_group(0)->values);
