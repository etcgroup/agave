<?php
if (basename(__FILE__) == basename($_SERVER['PHP_SELF'])) {
    exit();
}

require_once('util/codebird/src/codebird.php');

/**
 * Prepares a Twitter API object using codebird-php 2.4.
 *
 * https://github.com/mynetx/codebird-php/tree/QA_2_4
 */
class TwitterAPI
{
    /**
     * @var Codebird\Codebird
     */
    public $cb;


    public function __construct($request)
    {
        $twitter_config = $request->config['twitter'];

        \Codebird\Codebird::setConsumerKey($twitter_config['api_key'], $twitter_config['api_secret']);
        $this->cb = \Codebird\Codebird::getInstance();

        $this->user_auth();
    }

    /**
     * Sign in the current user.
     */
    public function user_auth() {
        if (isset($_SESSION['oauth_token']) && isset($_SESSION['oauth_token_secret'])) {
            // assign access token on each page load
            $this->cb->setToken($_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);
        }
    }
}
