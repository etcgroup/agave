<?php
/**
 * tweets.php gets individual tweets in a time range.
 *
 * It only returns non-retweet tweets, and a limit parameter is required.
 *
 * Optionally, a noise threshold can be provided. Only tweets with at least this
 * number of retweets will be returned.
 */
include_once '../util/data.inc.php';
include_once '../util/request.inc.php';

$request = new Request();
$perf = $request->timing();
$db = $request->db();

$params = $request->get(array('limit'), array('sort'));
$timeParams = $request->timeParameters();
$filter = $request->queryParameters();
$from = $timeParams->from;
$to = $timeParams->to;
$sort = $params->sort;
$limit = $params->limit;

$result = $db->get_users_list($from, $to, $filter->rt, $filter->min_rt, $filter->search, $filter->sentiment, $filter->author, $sort, $limit);

$perf->start('processing');

$users = array();
foreach ($result as $row)
{
    $users[] = $row;
    
}


$perf->stop('processing');

$request->response($users);
