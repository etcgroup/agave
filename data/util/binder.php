<?php

/**
 * Class Binder
 *
 * For tracking and binding parameters in prepared statements.
 */
class Binder
{

    public $param_map = array();

    /**
     * Adds a new parameter. Base name is a prefix for the parameter's name,
     * good to use in case the queries need to be debugged.
     *
     * @param $baseName
     * @param $value
     * @param int $type
     * @return mixed
     */
    public function param($baseName, $value = NULL, $type = PDO::PARAM_STR)
    {
        if ($value === NULL) {
            return NULL;
        }

        $paramsSize = count($this->param_map);
        $param = "{$baseName}_{$paramsSize}";
        $this->param_map[$param] = array($value, $type);
        return "(:$param)";
    }

    /**
     * Get the keys for the parameters.
     *
     * @return array
     */
    public function param_keys()
    {
        return array_keys($this->param_map);
    }

    /**
     * Binds the declared parameters to the prepared statement.
     * @param PDOStatement $stmt
     * @return mixed
     */
    public function bind($stmt)
    {
        if (!$stmt) {
            return NULL;
        }

        //Bind all the parameters
        foreach ($this->param_map as $paramName => $pair) {
            $value = $pair[0];
            $type = $pair[1];

            if (!$stmt->bindValue($paramName, $value, $type)) {
                return NULL;
            }
        }

        return $stmt;
    }


}