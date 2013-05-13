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

$timeParams = $request->timeParameters();

$from = $timeParams->from;
$to = $timeParams->to;

$result = $db->get_users_list($from, $to);

$perf->start('processing');

$users = array();
foreach ($result as $row)
{
    $users[] = $row;
}


$perf->stop('processing');

$request->response($users);
