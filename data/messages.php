<?php
/**
 * messages.php returns the number of tweets over time, divided
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

if(isset($_POST) && isset($_POST["type"]) && $_POST["type"] == "send") {
		if(!isset($_POST["message"]) && !isset($_POST["user"])) {
	header('Content-type: application/json');
			echo json_encode(array("error" => true, "reason" => "Missing message data"));
			die();
		}
		$query = $DB->prepare('INSERT INTO chat (`chat_id`, `user`, `ip`, `message`, `timestamp`) VALUES (NULL, :user, :ip, :message, :time)');
		$query->bindValue(':user', $_POST["user"], PDO::PARAM_STR);
		$query->bindValue(':ip', $_SERVER["REMOTE_ADDR"], PDO::PARAM_STR);
		$query->bindValue(':message', str_replace("\n", "<br>", htmlspecialchars($_POST["message"])), PDO::PARAM_STR);
		$query->bindValue(':time', time(), PDO::PARAM_INT);
		$query->execute();
	}
	
	$query = $DB->query('SELECT chat_id, user, message, timestamp FROM chat order by timestamp');
	$messages = array();
	foreach($query as $row) { ?>
					<message>
						<userid id="c_<?=$row["chat_id"]?>"><?=$row["user"] ?></userid>
						<p id="message_text"><?=$row["message"]?></p>
						<timestamp><?=date("M j, Y g:ia", $row["timestamp"])?></timestamp>
					</message>				
<? } ?>
