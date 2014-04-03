<?php

/**
 * Class for gathering configuration info.
 */
class Config {
    public $raw;

    public function __construct($config_file = NULL)
    {

        if ($config_file === NULL) {
            $config_file = dirname(__FILE__) . '/../app.ini';
        }

        $config_file_path = realpath($config_file);
        if ($config_file_path === FALSE) {
            trigger_error("Config file $config_file does not exist", E_USER_ERROR);
        }

        $this->raw = parse_ini_file($config_file_path, TRUE);
        if ($this->raw === FALSE) {
            trigger_error("Error parsing $config_file_path", E_USER_ERROR);
        }

        $env = $this->get('environment', 'production');
        if ($env === 'development') {
            error_reporting(-1);
            ini_set('display_errors', 1);
        } elseif ($env === 'production') {
            error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT);
            ini_set('display_errors', 0);
        }

        if (!isset($this->raw['db'])) {
            trigger_error("Config file $config_file must contain [db] section", E_USER_ERROR);
        }
    }

    public function get($name, $default=NULL) {
        if (isset($this->raw[$name])) {
            return ($this->raw[$name]);
        } else {
            return $default;
        }
    }

    public function keep_data_private() {
        return (bool)$this->get('keep_private_data');
    }
} 