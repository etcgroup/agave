<?php
/**
 * tweets.php gets individual tweets in a time range.
 *
 * It only returns non-retweet tweets, and a limit parameter is required.
 *
 * Optionally, a noise threshold can be provided. Only tweets with at least this
 * number of retweets will be returned.
 */
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$perf = $request->timing();
$db = $request->db();

/**
 * Required parameters: grouped time parameters (from, to, interval) and limit.
 * Optional: noise_threshold and search.
 */
$params = $request->get(array('limit'), array('min_rt', 'rt', 'search', 'author', 'sentiment', 'sort'));
$timeParams = $request->timeParameters();

$from = $timeParams->from;
$to = $timeParams->to;
$limit = $params->limit;
$sort = $params->sort;
$min_rt = $params->min_rt;
$is_rt = $params->rt === 'true';
$search = $params->search ? $params->search : NULL;
$sentiment = $params->sentiment ? $params->sentiment : NULL;
$screen_name = $params->author ? $params->author : NULL;

if ($screen_name !== NULL) {
    $user = $db->get_user_by_name($screen_name);
    if ($user !== NULL) {
        $user_id = $user['id'];
    } else {
        //No getting off easy if you can't find them
        $user_id = -1;
    }
} else {
    $user_id = NULL;
}

$result = $db->get_tweets($from, $to, $is_rt, $min_rt, $search, $sentiment, $user_id, $sort, $limit);

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
