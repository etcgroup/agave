<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) exit();

/**
 * users.inc.php gets individual users relevant to a tweet filter.
 */
include_once 'util/data.inc.php';

$perf = $request->performance();
$db->record_timing($perf);

$params = $request->get(array('limit'), array('sort'));
$timeParams = $request->timeParameters();
$filter = $request->queryParameters($db);
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
