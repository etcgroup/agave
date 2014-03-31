<?php
/**
 * Authenticate the user against Twitter.
 * Redirect to the return_to url when done.
 */

include_once 'util/request.inc.php';


$request = new Request('app.ini');
$db = $request->db();

$params = $request->get(array('return_to'), array('sign_out', 'username'));

if ($params->sign_out) {

    $user_data = $request->user_data();

    $request->sign_out();

    $db->log_action('sign out', $user_data);

} else {

    if ($request->auth_mode() == 'twitter') {
        include_once 'util/twitter.inc.php';
        $twitter_api = new TwitterAPI($request);
        $cb = $twitter_api->cb;

        if (! isset($_SESSION['oauth_token'])) {
            //We need to redirect the user to Twitter to get the stuff

            // get the request token
            $reply = $cb->oauth_requestToken(array(
                'oauth_callback' => 'https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']
            ));

            // store the token
            $cb->setToken($reply->oauth_token, $reply->oauth_token_secret);
            $_SESSION['oauth_token'] = $reply->oauth_token;
            $_SESSION['oauth_token_secret'] = $reply->oauth_token_secret;
            $_SESSION['oauth_verify'] = true;

            // redirect to auth website
            $auth_url = $cb->oauth_authenticate();
            header('Location: ' . $auth_url);
            die();

        } elseif (isset($_GET['oauth_verifier']) && isset($_SESSION['oauth_verify'])) {
            //Twitter is giving us the stuff

            // verify the token
            $cb->setToken($_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);
            unset($_SESSION['oauth_verify']);

            // get the access token
            $reply = $cb->oauth_accessToken(array(
                'oauth_verifier' => $_GET['oauth_verifier']
            ));

            if ($reply) {
                // store the token (which is different from the request token!)
                $_SESSION['oauth_token'] = $reply->oauth_token;
                $_SESSION['oauth_token_secret'] = $reply->oauth_token_secret;
                $twitter_api->user_auth();

                $twitter_user = $cb->account_verifyCredentials();

                //Get the user id from the database
                $user_id = $db->get_app_user_id($twitter_user);
                if ($user_id) {
                    $_SESSION['user_id'] = $user_id;
                    $user_data = $request->user_data(TRUE);
                    $db->log_action('sign in', $user_data);
                } else {
                    $error = 'Could not sign in.';
                }

            } else {
                $error = 'Authentication failure.';
                $db->log_action('auth fail');
            }
        } elseif (isset($_GET['denied'])) {
            $error = 'Authentication did not complete.';
            $db->log_action('auth deny');
        }

        if (isset($error)) {
            unset($_SESSION['oauth_token']);
            unset($_SESSION['oauth_token_secret']);
            unset($_SESSION['oauth_verify']);
            $request->flash($error);
        }
    } else {
        //It is a simple sign-in!
        $username = $params->username;

        //Get the user id from the database
        $user_id = $db->get_simple_app_user_id($username);
        if ($user_id) {
            $_SESSION['user_id'] = $user_id;
            $user_data = $request->user_data(TRUE);
            $db->log_action('sign in', $user_data);
        } else {
            $error = 'Could not sign in.';
        }
    }
}

header('Location: ' . $params->return_to);
die();