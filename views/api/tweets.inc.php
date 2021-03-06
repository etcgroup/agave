<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

/**
 * tweets.inc.php gets individual tweets in a time range.
 *
 * It only returns non-retweet tweets, and a limit parameter is required.
 *
 * Optionally, a noise threshold can be provided. Only tweets with at least this
 * number of retweets will be returned.
 */

$perf = $request->performance();
$db->record_timing($perf);

/**
 * Required parameters: grouped time parameters (from, to, interval) and limit.
 * Optional: noise_threshold and search.
 */
$params = $request->get(array('limit'), array('sort', 'query_id', 'state_str'));
$timeParams = $request->timeParameters();
$filter = $request->queryParameters($db);
$from = $timeParams->from;
$to = $timeParams->to;
$sort = $params->sort;
$limit = $params->limit;

$result = $db->get_tweets($from, $to, $filter->rt, $filter->min_rt, $filter->search, $filter->sentiment, $filter->author, $sort, $limit);

$db->log_action('view', $request->user_data(), $params->state_str, $params->query_id);

$perf->start('processing');

$tweets = array();
foreach ($result as $row)
{
    //Convert the created_at unix timestamp field to ms
    $row['created_at'] = $row['created_at'] * 1000;
    $tweets[] = $row;
}


$perf->stop('processing');

$request->response($tweets);
