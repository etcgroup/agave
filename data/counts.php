<?php
/**
 * counts.php returns the number of tweets over time, divided
 * by sentiment classification as -1, 0, or 1.
 *
 * Tweets are binned by time and the count of positive, negative, and neutral
 * tweets in each time bin is returned.
 */


include_once 'util/data.php';
include_once 'util/request.php';

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
$params = $request->get(array(), array('search'));
$timeParams = $request->binnedTimeParams();
$filter = $request->queryParameters();

//Get the retrieved parameters
$from = $timeParams->from;
$to = $timeParams->to;
$interval = $timeParams->interval;

//Some constants that refer to field names in the SELECT query
$positive_count_field = 'positive';
$negative_count_field = 'negative';
$neutral_count_field = 'neutral';
$time_field = 'binned_time';

//Execute the database query
$split_sentiment = TRUE;
$result = $db->get_grouped_counts($from, $to, $interval, $split_sentiment, $filter->rt, $filter->min_rt, $filter->search, $filter->sentiment, $filter->author);

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
    //Create a bin for each of the three sentiment values,
    //at the current time (next_bin).
    $groups->get_group(1)->add_bin($next_bin);
    $groups->get_group(0)->add_bin($next_bin);
    $groups->get_group(-1)->add_bin($next_bin);

    $next_bin += $interval;
}

//Now go through the database results and fill in the binned data
foreach ($result as $row)
{
    //The time for this row
    $binned_time = $row[$time_field];

    //Get the positive bin at this time
    $positive_bin = $groups->get_group(1)->get_bin_at($binned_time);
    //Set the count for the bin equal to the tweet rate
    $positive_bin->count = (int) $row[$positive_count_field] / (double)$interval;

    //Get the negative bin at this time
    $negative_bin = $groups->get_group(-1)->get_bin_at($binned_time);
    $negative_bin->count = (int) $row[$negative_count_field] / (double)$interval;

    //Get the neutral bin at this time
    $neutral_bin = $groups->get_group(0)->get_bin_at($binned_time);
    $neutral_bin->count = (int) $row[$neutral_count_field] / (double)$interval;
}


$perf->stop('processing');

//Emit the response
$request->response($groups->groups_array());
