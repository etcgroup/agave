<?php

include_once 'util/queries.php';
include_once 'util/data.php';
include_once 'util/request.php';

$request = new Request();
$params = $request->get(array('from', 'to'));

$start = new DateTime("@$params->from");
$end = new DateTime("@$params->to");

$perf = $request->timing();
$db = new Queries('localhost', 'root', '', 'twitter_sagawards');
$db->record_timing($perf);

$utc = new DateTimeZone('UTC');

$result = $db->get_originals_in_interval($start, $end);

$perf->start('processing');

$tweets = array();
while ($row = $result->fetch_assoc())
{
    $tweets[] = $row;
}
$result->free();

$perf->stop('processing');

$request->response($tweets);
