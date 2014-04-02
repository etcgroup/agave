<?php

/**
 * Reads tweets JSON from stdin, one per line.
 * Parses them and inserts the tweets and users into the database.
 */

include_once 'util/config.inc.php';
include_once 'util/queries.inc.php';

function parse_twitter_date($datestr) {
    return new DateTime($datestr);
}

function str_repeat_extended($input, $multiplier, $separator='')
{
    return $multiplier==0 ? '' : str_repeat($input.$separator, $multiplier-1).$input;
}

/**
 * @param $db Queries
 * @param $template
 * @param $field_count
 * @param $values
 * @return null
 */
function insert_query($db, $template, $field_count, $values) {
    if (count($values) == 0) {
        return NULL;
    }

    $placeholder = '(' . str_repeat_extended('?', $field_count, ',') . ')';
    $placeholders = str_repeat_extended($placeholder, count($values) / $field_count, ',');

    $query = sprintf($template, $placeholders);
    $stmt = $db->corpus->prepare($query);
    return $stmt->execute($values);
}

function arrget($array, $key, $default=NULL) {
    if (isset($array[$key])) {
        return $array[$key];
    } else {
        return $default;
    }
}

$config = new Config();
$db = new Queries($config);

$tweet_query_template = "REPLACE INTO tweets
            (id,user_id,created_at,in_reply_to_status_id,in_reply_to_user_id,
            retweet_of_status_id, text, followers_count, friends_count, created_at_5s) VALUES %s";

$user_query_template = "REPLACE INTO users
			(id,screen_name,name,created_at,location,utc_offset,lang,time_zone,statuses_count) VALUES %s";

$batch_size = 1000;
$gathered = 0;
$batches = 0;
$tweet_values = array();
$user_values = array();

while ($line = readline()) {

    $status = json_decode($line, TRUE);
    if ($status === NULL) {
        echo "Unparseable value: $line\n";
        continue;
    }

    if (!is_array($status) || !array_key_exists('id', $status)) {
        echo "Skipping non-tweet: $line\n";
        continue;
    }

    $user = $status['user'];

    $created_at = parse_twitter_date($status['created_at']);

    if (isset($status['retweeted_status'])) {
        $retweet_id = $status['retweeted_status']['id'];
    } else {
        $retweet_id = NULL;
    }

    $tweet_values[] = $status['id'];
    $tweet_values[] = $user['id'];
    $tweet_values[] = $created_at->format("Y-m-d H:i:s");
    $tweet_values[] = arrget($status, 'in_reply_to_status_id');
    $tweet_values[] = arrget($status, 'in_reply_to_user_id');
    $tweet_values[] = $retweet_id;
    $tweet_values[] = $status['text'];
    $tweet_values[] = arrget($status, 'followers_count', 0);
    $tweet_values[] = arrget($status, 'friends_count', 0);
    $tweet_values[] = floor($created_at->getTimestamp() / 5);

    $user_created_at = parse_twitter_date($user['created_at']);

    $user_values[] = $user['id'];
    $user_values[] = $user['screen_name'];
    $user_values[] = $user['name'];
    $user_values[] = $user_created_at->format("Y-m-d H:i:s");
    $user_values[] = arrget($user, 'location');
    $user_values[] = arrget($user, 'utc_offset');
    $user_values[] = arrget($user, 'lang');
    $user_values[] = arrget($user, 'time_zone');
    $user_values[] = arrget($user, 'statuses_count');

    $gathered += 1;

    if ($gathered >= $batch_size) {
        insert_query($db, $tweet_query_template, 10, $tweet_values);
        insert_query($db, $user_query_template, 9, $user_values);
        $tweet_values = array();
        $user_values = array();
        $batches += 1;
        $gathered = 0;

        echo "Inserted $batches batches of $batch_size\n";
    }
}

