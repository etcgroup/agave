<?php

//see http://php.net/manual/en/function.session-set-save-handler.php
//and http://shiflett.org/articles/storing-sessions-in-a-database

class DbSessionHandler
{
    private $queries;

    /**
     * @param Queries $queries
     */
    public function __construct($queries)
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


