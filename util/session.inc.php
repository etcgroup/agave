<?php

//see http://php.net/manual/en/function.session-set-save-handler.php
//and http://shiflett.org/articles/storing-sessions-in-a-database

class DbSessionHandler
{
    private $queries;

    /**
     * @param Queries $queries
     * @param array $config
     */
    public function __construct($queries, $config)
    {
        $this->queries = $queries;

        // the following prevents unexpected effects when using objects as save handlers
        register_shutdown_function('session_write_close');

        session_set_save_handler(
            array($this, 'open'),
            array($this, 'close'),
            array($this, 'read'),
            array($this, 'write'),
            array($this, 'destroy'),
            array($this, 'gc')
        );

        //4 hours
        $SESSION_TIMEOUT = 14400;
        $current_domain = $_SERVER['SERVER_NAME'];
        if (isset($config['environment']) && $config['environment'] == 'development') {
            $current_domain = '';
        }

        if (isset($config['secure']) && $config['secure']) {
            session_set_cookie_params($SESSION_TIMEOUT, '/', $current_domain, TRUE);
        } else {
            session_set_cookie_params($SESSION_TIMEOUT, '/', $current_domain, FALSE);
        }

        //set the session cookie name
        session_name('tvappsession');

        session_start();
    }

    function open()
    {
        return true;
    }

    function close()
    {
        return true;
    }

    function read($id)
    {
        $session = $this->queries->get_session($id);
        if ($session) {
            return $session['data'];
        } else {
            return '';
        }
    }

    function write($id, $data)
    {
        return $this->queries->save_session($id, $data);
    }

    function destroy($id)
    {
        return $this->queries->delete_session($id);
    }

    function gc($maxlifetime)
    {
        return $this->queries->clean_sessions($maxlifetime);
    }
}


